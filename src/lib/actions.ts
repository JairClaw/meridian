'use server';

import { db, schema } from '@/db';
import { eq, desc, and, gte, lte, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// ============ ACCOUNTS ============

export async function getAccounts() {
  return db.select().from(schema.accounts).where(eq(schema.accounts.isActive, true));
}

export async function getAccount(id: number) {
  const [account] = await db.select().from(schema.accounts).where(eq(schema.accounts.id, id));
  return account;
}

export async function createAccount(data: {
  name: string;
  type: string;
  currency: string;
  institution?: string;
  accountNumber?: string;
  currentBalance?: number;
  color?: string;
}) {
  const balance = data.currentBalance || 0;
  const [account] = await db.insert(schema.accounts).values({
    name: data.name,
    type: data.type,
    currency: data.currency,
    institution: data.institution,
    accountNumber: data.accountNumber,
    openingBalance: balance, // Start with opening = current (no transactions yet)
    currentBalance: balance,
    color: data.color,
  }).returning();
  
  revalidatePath('/accounts');
  revalidatePath('/');
  return account;
}

// Recalculate account balance from opening_balance + sum of all transactions
export async function recalculateAccountBalance(accountId: number) {
  const [sumResult] = await db.select({
    total: sql<number>`COALESCE(SUM(${schema.transactions.amountCents}), 0)`,
  })
    .from(schema.transactions)
    .where(eq(schema.transactions.accountId, accountId));
  
  const [account] = await db.select()
    .from(schema.accounts)
    .where(eq(schema.accounts.id, accountId));
  
  if (!account) return null;
  
  const newBalance = (account.openingBalance || 0) + (sumResult?.total || 0);
  
  await db.update(schema.accounts)
    .set({ currentBalance: newBalance, updatedAt: new Date() })
    .where(eq(schema.accounts.id, accountId));
  
  return newBalance;
}

export async function updateAccount(id: number, data: Partial<{
  name: string;
  type: string;
  currency: string;
  institution: string;
  accountNumber: string;
  currentBalance: number;
  color: string;
  isActive: boolean;
}>) {
  const [account] = await db.update(schema.accounts)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(schema.accounts.id, id))
    .returning();
  
  revalidatePath('/accounts');
  revalidatePath('/');
  return account;
}

export async function deleteAccount(id: number) {
  // Soft delete - just mark as inactive
  await db.update(schema.accounts)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(schema.accounts.id, id));
  
  revalidatePath('/accounts');
  revalidatePath('/');
}

// ============ TRANSACTIONS ============

export async function getTransactions(options?: {
  accountId?: number;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}) {
  let query = db.select({
    transaction: schema.transactions,
    account: schema.accounts,
    category: schema.categories,
  })
    .from(schema.transactions)
    .leftJoin(schema.accounts, eq(schema.transactions.accountId, schema.accounts.id))
    .leftJoin(schema.categories, eq(schema.transactions.categoryId, schema.categories.id))
    .orderBy(desc(schema.transactions.date), desc(schema.transactions.id))
    .$dynamic();
  
  if (options?.accountId) {
    query = query.where(eq(schema.transactions.accountId, options.accountId));
  }
  
  if (options?.startDate) {
    query = query.where(gte(schema.transactions.date, options.startDate));
  }
  
  if (options?.endDate) {
    query = query.where(lte(schema.transactions.date, options.endDate));
  }
  
  if (options?.limit) {
    query = query.limit(options.limit);
  }
  
  if (options?.offset) {
    query = query.offset(options.offset);
  }
  
  return query;
}

export async function createTransaction(data: {
  accountId: number;
  date: string;
  amountCents: number;
  description: string;
  categoryId?: number;
  merchant?: string;
  notes?: string;
  currency?: string;
}) {
  const [transaction] = await db.insert(schema.transactions).values({
    accountId: data.accountId,
    date: data.date,
    amountCents: data.amountCents,
    description: data.description,
    categoryId: data.categoryId,
    merchant: data.merchant,
    notes: data.notes,
    currency: data.currency || 'USD',
    importSource: 'manual',
  }).returning();
  
  // Update account balance
  await db.update(schema.accounts)
    .set({ 
      currentBalance: sql`${schema.accounts.currentBalance} + ${data.amountCents}`,
      updatedAt: new Date()
    })
    .where(eq(schema.accounts.id, data.accountId));
  
  revalidatePath('/transactions');
  revalidatePath('/accounts');
  revalidatePath('/');
  return transaction;
}

export async function importTransactions(transactions: Array<{
  accountId: number;
  date: string;
  amountCents: number;
  description: string;
  merchant?: string;
  currency?: string;
  externalId?: string;
}>) {
  // Insert in chunks to avoid SQLite variable limit
  const CHUNK_SIZE = 50;
  const results = [];
  for (let i = 0; i < transactions.length; i += CHUNK_SIZE) {
    const chunk = transactions.slice(i, i + CHUNK_SIZE);
    const chunkResults = await db.insert(schema.transactions).values(
      chunk.map(t => ({
        ...t,
        importSource: 'csv',
      }))
    ).returning();
    results.push(...chunkResults);
  }
  
  // Update account balances
  const accountTotals = transactions.reduce((acc, t) => {
    acc[t.accountId] = (acc[t.accountId] || 0) + t.amountCents;
    return acc;
  }, {} as Record<number, number>);
  
  for (const [accountId, total] of Object.entries(accountTotals)) {
    await db.update(schema.accounts)
      .set({ 
        currentBalance: sql`${schema.accounts.currentBalance} + ${total}`,
        updatedAt: new Date()
      })
      .where(eq(schema.accounts.id, Number(accountId)));
  }
  
  revalidatePath('/transactions');
  revalidatePath('/accounts');
  revalidatePath('/');
  return results;
}

export async function importTransactionsWithDedup(
  transactions: Array<{
    accountId: number;
    date: string;
    amountCents: number;
    description: string;
    merchant?: string;
    currency?: string;
    externalId?: string;
  }>,
  filename?: string,
  options?: {
    preserveBalance?: boolean; // If true, adjust opening_balance to maintain current balance
  }
) {
  if (transactions.length === 0) {
    return { imported: 0, skipped: 0, batchId: null };
  }
  
  const accountId = transactions[0].accountId;
  
  // Get existing external IDs for deduplication
  const existingTxs = await db.select({ externalId: schema.transactions.externalId })
    .from(schema.transactions)
    .where(sql`${schema.transactions.externalId} IS NOT NULL`);
  
  const existingHashes = new Set(existingTxs.map(t => t.externalId));
  
  // Filter out duplicates
  const newTransactions = transactions.filter(t => 
    t.externalId && !existingHashes.has(t.externalId)
  );
  
  const skipped = transactions.length - newTransactions.length;
  
  if (newTransactions.length === 0) {
    revalidatePath('/transactions');
    return { imported: 0, skipped, batchId: null };
  }
  
  // Create import batch
  const totalAmount = newTransactions.reduce((sum, t) => sum + t.amountCents, 0);
  const [batch] = await db.insert(schema.importBatches).values({
    accountId,
    filename: filename || 'CSV Import',
    transactionCount: newTransactions.length,
    totalAmountCents: totalAmount,
  }).returning();
  
  // Insert new transactions with batch ID (in chunks to avoid SQLite variable limit)
  const CHUNK_SIZE = 50;
  for (let i = 0; i < newTransactions.length; i += CHUNK_SIZE) {
    const chunk = newTransactions.slice(i, i + CHUNK_SIZE);
    await db.insert(schema.transactions).values(
      chunk.map(t => ({
        ...t,
        importSource: 'csv',
        importBatchId: batch.id,
      }))
    );
  }
  
  // Update account balances
  const accountTotals = newTransactions.reduce((acc, t) => {
    acc[t.accountId] = (acc[t.accountId] || 0) + t.amountCents;
    return acc;
  }, {} as Record<number, number>);
  
  for (const [accId, total] of Object.entries(accountTotals)) {
    if (options?.preserveBalance) {
      // Historical import: adjust opening_balance to keep current balance unchanged
      // If we're adding transactions that sum to X, we need to subtract X from opening_balance
      await db.update(schema.accounts)
        .set({ 
          openingBalance: sql`${schema.accounts.openingBalance} - ${total}`,
          updatedAt: new Date()
        })
        .where(eq(schema.accounts.id, Number(accId)));
    } else {
      // Normal import: update current balance
      await db.update(schema.accounts)
        .set({ 
          currentBalance: sql`${schema.accounts.currentBalance} + ${total}`,
          updatedAt: new Date()
        })
        .where(eq(schema.accounts.id, Number(accId)));
    }
  }
  
  revalidatePath('/transactions');
  revalidatePath('/accounts');
  revalidatePath('/');
  
  return { imported: newTransactions.length, skipped, batchId: batch.id };
}

// ============ IMPORT BATCH MANAGEMENT ============

export async function getImportBatches() {
  return db.select({
    batch: schema.importBatches,
    account: schema.accounts,
  })
    .from(schema.importBatches)
    .leftJoin(schema.accounts, eq(schema.importBatches.accountId, schema.accounts.id))
    .orderBy(desc(schema.importBatches.importedAt));
}

export async function deleteImportBatch(batchId: number) {
  // Get transactions in this batch to reverse the balance
  const batchTxs = await db.select()
    .from(schema.transactions)
    .where(eq(schema.transactions.importBatchId, batchId));
  
  if (batchTxs.length === 0) {
    // Just delete the batch record
    await db.delete(schema.importBatches).where(eq(schema.importBatches.id, batchId));
    revalidatePath('/import');
    return { deleted: 0 };
  }
  
  // Calculate balance adjustments per account
  const accountTotals = batchTxs.reduce((acc, t) => {
    acc[t.accountId] = (acc[t.accountId] || 0) + t.amountCents;
    return acc;
  }, {} as Record<number, number>);
  
  // Delete the transactions
  await db.delete(schema.transactions).where(eq(schema.transactions.importBatchId, batchId));
  
  // Reverse the account balances
  for (const [accountId, total] of Object.entries(accountTotals)) {
    await db.update(schema.accounts)
      .set({ 
        currentBalance: sql`${schema.accounts.currentBalance} - ${total}`,
        updatedAt: new Date()
      })
      .where(eq(schema.accounts.id, Number(accountId)));
  }
  
  // Delete the batch record
  await db.delete(schema.importBatches).where(eq(schema.importBatches.id, batchId));
  
  revalidatePath('/transactions');
  revalidatePath('/accounts');
  revalidatePath('/import');
  revalidatePath('/');
  
  return { deleted: batchTxs.length };
}

export async function deleteAllTransactions() {
  // Get all transactions to reverse balances
  const allTxs = await db.select().from(schema.transactions);
  
  // Calculate balance adjustments per account
  const accountTotals = allTxs.reduce((acc, t) => {
    acc[t.accountId] = (acc[t.accountId] || 0) + t.amountCents;
    return acc;
  }, {} as Record<number, number>);
  
  // Delete all transactions
  await db.delete(schema.transactions);
  
  // Delete all import batches
  await db.delete(schema.importBatches);
  
  // Reset account balances
  for (const [accountId, total] of Object.entries(accountTotals)) {
    await db.update(schema.accounts)
      .set({ 
        currentBalance: sql`${schema.accounts.currentBalance} - ${total}`,
        updatedAt: new Date()
      })
      .where(eq(schema.accounts.id, Number(accountId)));
  }
  
  revalidatePath('/transactions');
  revalidatePath('/accounts');
  revalidatePath('/import');
  revalidatePath('/');
  
  return { deleted: allTxs.length };
}

// ============ CATEGORIES ============

export async function getCategories() {
  return db.select().from(schema.categories);
}

export async function createCategory(data: {
  name: string;
  parentId?: number;
  icon?: string;
  color?: string;
  budgetCents?: number;
  isIncome?: boolean;
}) {
  const [category] = await db.insert(schema.categories).values(data).returning();
  revalidatePath('/');
  return category;
}

// ============ MORTGAGES ============

export async function getMortgages() {
  return db.select({
    mortgage: schema.mortgages,
    account: schema.accounts,
  })
    .from(schema.mortgages)
    .leftJoin(schema.accounts, eq(schema.mortgages.accountId, schema.accounts.id));
}

export async function createMortgage(data: {
  accountId: number;
  principalCents: number;
  interestRate: number;
  termMonths: number;
  startDate: string;
  monthlyPaymentCents: number;
  extraPaymentCents?: number;
  propertyAddress?: string;
  propertyValue?: number;
}) {
  const [mortgage] = await db.insert(schema.mortgages).values(data).returning();
  
  // Update account balance to reflect the loan
  await db.update(schema.accounts)
    .set({ 
      currentBalance: -data.principalCents,
      updatedAt: new Date()
    })
    .where(eq(schema.accounts.id, data.accountId));
  
  revalidatePath('/mortgages');
  revalidatePath('/accounts');
  return mortgage;
}

// ============ RECURRING RULES (SUBSCRIPTIONS) ============

export async function getRecurringRules() {
  return db.select({
    rule: schema.recurringRules,
    account: schema.accounts,
    category: schema.categories,
  })
    .from(schema.recurringRules)
    .leftJoin(schema.accounts, eq(schema.recurringRules.accountId, schema.accounts.id))
    .leftJoin(schema.categories, eq(schema.recurringRules.categoryId, schema.categories.id))
    .where(eq(schema.recurringRules.isActive, true));
}

export async function createRecurringRule(data: {
  accountId: number;
  name: string;
  amountCents: number;
  frequency: string;
  startDate: string;
  categoryId?: number;
  dayOfMonth?: number;
  endDate?: string;
}) {
  const nextDate = data.startDate;
  
  const [rule] = await db.insert(schema.recurringRules).values({
    accountId: data.accountId,
    name: data.name,
    amountCents: data.amountCents,
    frequency: data.frequency,
    startDate: data.startDate,
    nextDate,
    categoryId: data.categoryId,
    dayOfMonth: data.dayOfMonth,
    endDate: data.endDate,
    currency: 'EUR',
  }).returning();
  
  revalidatePath('/subscriptions');
  return rule;
}

export async function deleteRecurringRule(id: number) {
  await db.update(schema.recurringRules)
    .set({ isActive: false })
    .where(eq(schema.recurringRules.id, id));
  
  revalidatePath('/subscriptions');
}

// ============ STATS ============

export async function getDashboardStats() {
  const accounts = await db.select().from(schema.accounts).where(eq(schema.accounts.isActive, true));
  
  const totalAssets = accounts
    .filter(a => ['checking', 'savings', 'investment', 'cash'].includes(a.type))
    .reduce((sum, a) => sum + a.currentBalance, 0);
  
  const totalLiabilities = accounts
    .filter(a => ['credit_card', 'loan', 'mortgage'].includes(a.type))
    .reduce((sum, a) => sum + Math.abs(a.currentBalance), 0);
  
  const netWorth = totalAssets - totalLiabilities;
  
  // Get this month's transactions
  const now = new Date();
  const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const endOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()}`;
  
  const monthlyTransactions = await db.select()
    .from(schema.transactions)
    .where(and(
      gte(schema.transactions.date, startOfMonth),
      lte(schema.transactions.date, endOfMonth)
    ));
  
  const monthlyIncome = monthlyTransactions
    .filter(t => t.amountCents > 0)
    .reduce((sum, t) => sum + t.amountCents, 0);
  
  const monthlyExpenses = Math.abs(monthlyTransactions
    .filter(t => t.amountCents < 0)
    .reduce((sum, t) => sum + t.amountCents, 0));
  
  const savingsRate = monthlyIncome > 0 
    ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 
    : 0;
  
  return {
    netWorth,
    monthlyIncome,
    monthlyExpenses,
    savingsRate,
    accounts,
  };
}

export async function getMonthlyTrends(months = 6) {
  const results: Array<{ date: string; income: number; expenses: number }> = [];
  const now = new Date();
  
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const startOfMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
    const endOfMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()}`;
    
    const transactions = await db.select()
      .from(schema.transactions)
      .where(and(
        gte(schema.transactions.date, startOfMonth),
        lte(schema.transactions.date, endOfMonth)
      ));
    
    const income = transactions
      .filter(t => t.amountCents > 0)
      .reduce((sum, t) => sum + t.amountCents, 0);
    
    const expenses = Math.abs(transactions
      .filter(t => t.amountCents < 0)
      .reduce((sum, t) => sum + t.amountCents, 0));
    
    results.push({
      date: date.toLocaleDateString('en-US', { month: 'short' }),
      income,
      expenses,
    });
  }
  
  return results;
}

export async function getCategoryBreakdown(startDate?: string, endDate?: string) {
  const now = new Date();
  const start = startDate || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const end = endDate || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()}`;
  
  const transactions = await db.select({
    transaction: schema.transactions,
    category: schema.categories,
  })
    .from(schema.transactions)
    .leftJoin(schema.categories, eq(schema.transactions.categoryId, schema.categories.id))
    .where(and(
      gte(schema.transactions.date, start),
      lte(schema.transactions.date, end),
      lte(schema.transactions.amountCents, 0) // Only expenses
    ));
  
  const categoryTotals = transactions.reduce((acc, { transaction, category }) => {
    const name = category?.name || 'Uncategorized';
    const color = category?.color || '#6B7280';
    if (!acc[name]) {
      acc[name] = { name, value: 0, color };
    }
    acc[name].value += Math.abs(transaction.amountCents);
    return acc;
  }, {} as Record<string, { name: string; value: number; color: string }>);
  
  return Object.values(categoryTotals).sort((a, b) => b.value - a.value);
}

// ============ CATEGORY RULES ============

export async function getCategoryRules() {
  return db.select({
    rule: schema.categoryRules,
    category: schema.categories,
  })
    .from(schema.categoryRules)
    .leftJoin(schema.categories, eq(schema.categoryRules.categoryId, schema.categories.id))
    .orderBy(desc(schema.categoryRules.priority), schema.categoryRules.pattern);
}

export async function createCategoryRule(data: {
  categoryId: number;
  pattern: string;
  matchType?: string;
  caseSensitive?: boolean;
  priority?: number;
}) {
  const [rule] = await db.insert(schema.categoryRules).values({
    categoryId: data.categoryId,
    pattern: data.pattern,
    matchType: data.matchType || 'contains',
    caseSensitive: data.caseSensitive || false,
    priority: data.priority || 0,
  }).returning();
  
  revalidatePath('/settings');
  return rule;
}

export async function updateCategoryRule(id: number, data: Partial<{
  categoryId: number;
  pattern: string;
  matchType: string;
  caseSensitive: boolean;
  priority: number;
  isActive: boolean;
}>) {
  const [rule] = await db.update(schema.categoryRules)
    .set(data)
    .where(eq(schema.categoryRules.id, id))
    .returning();
  
  revalidatePath('/settings');
  return rule;
}

export async function deleteCategoryRule(id: number) {
  await db.delete(schema.categoryRules).where(eq(schema.categoryRules.id, id));
  revalidatePath('/settings');
}

// Check if text matches a rule pattern
function matchesRule(text: string, pattern: string, matchType: string, caseSensitive: boolean): boolean {
  const haystack = caseSensitive ? text : text.toLowerCase();
  const needle = caseSensitive ? pattern : pattern.toLowerCase();
  
  switch (matchType) {
    case 'exact':
      return haystack === needle;
    case 'starts_with':
      return haystack.startsWith(needle);
    case 'regex':
      try {
        const flags = caseSensitive ? '' : 'i';
        return new RegExp(pattern, flags).test(text);
      } catch {
        return false;
      }
    case 'contains':
    default:
      return haystack.includes(needle);
  }
}

// Apply rules to a single transaction and return matching category ID
export async function findCategoryForTransaction(description: string, merchant?: string): Promise<number | null> {
  const rules = await db.select()
    .from(schema.categoryRules)
    .where(eq(schema.categoryRules.isActive, true))
    .orderBy(desc(schema.categoryRules.priority));
  
  const textToMatch = `${description} ${merchant || ''}`.trim();
  
  for (const rule of rules) {
    if (matchesRule(textToMatch, rule.pattern, rule.matchType, rule.caseSensitive)) {
      return rule.categoryId;
    }
  }
  
  return null;
}

// Apply rules to all uncategorized transactions
export async function applyCategorizationRules() {
  const uncategorized = await db.select()
    .from(schema.transactions)
    .where(sql`${schema.transactions.categoryId} IS NULL`);
  
  const rules = await db.select()
    .from(schema.categoryRules)
    .where(eq(schema.categoryRules.isActive, true))
    .orderBy(desc(schema.categoryRules.priority));
  
  let categorized = 0;
  
  for (const tx of uncategorized) {
    const textToMatch = `${tx.description} ${tx.merchant || ''}`.trim();
    
    for (const rule of rules) {
      if (matchesRule(textToMatch, rule.pattern, rule.matchType, rule.caseSensitive)) {
        await db.update(schema.transactions)
          .set({ categoryId: rule.categoryId })
          .where(eq(schema.transactions.id, tx.id));
        categorized++;
        break;
      }
    }
  }
  
  revalidatePath('/transactions');
  revalidatePath('/');
  return { categorized, total: uncategorized.length };
}

// Get recommendations for new rules based on common uncategorized patterns
export async function getCategoryRecommendations() {
  const uncategorized = await db.select()
    .from(schema.transactions)
    .where(sql`${schema.transactions.categoryId} IS NULL`);
  
  // Group by merchant/description patterns
  const patterns: Record<string, { count: number; totalCents: number; examples: string[] }> = {};
  
  for (const tx of uncategorized) {
    // Extract a clean pattern from the description
    let pattern = (tx.merchant || tx.description || '').trim();
    
    // Clean up common noise
    pattern = pattern
      .replace(/\d{4,}/g, '') // Remove long numbers
      .replace(/[*#]+/g, '') // Remove * and #
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim()
      .split(/[-\/]/)[0] // Take first part before - or /
      .trim();
    
    if (pattern.length < 3) continue;
    
    // Normalize to lowercase for grouping
    const key = pattern.toLowerCase();
    
    if (!patterns[key]) {
      patterns[key] = { count: 0, totalCents: 0, examples: [] };
    }
    patterns[key].count++;
    patterns[key].totalCents += Math.abs(tx.amountCents);
    if (patterns[key].examples.length < 3) {
      patterns[key].examples.push(tx.description);
    }
  }
  
  // Sort by count and return top patterns
  const recommendations = Object.entries(patterns)
    .filter(([_, data]) => data.count >= 2) // At least 2 occurrences
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 20)
    .map(([pattern, data]) => ({
      pattern,
      count: data.count,
      totalCents: data.totalCents,
      examples: data.examples,
    }));
  
  return recommendations;
}

// Get count of uncategorized transactions (for the lightbulb indicator)
export async function getUncategorizedCount() {
  const [result] = await db.select({ count: sql<number>`COUNT(*)` })
    .from(schema.transactions)
    .where(sql`${schema.transactions.categoryId} IS NULL`);
  
  return result?.count || 0;
}
