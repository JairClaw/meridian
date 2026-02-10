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
  const [account] = await db.insert(schema.accounts).values({
    name: data.name,
    type: data.type,
    currency: data.currency,
    institution: data.institution,
    accountNumber: data.accountNumber,
    currentBalance: data.currentBalance || 0,
    color: data.color,
  }).returning();
  
  revalidatePath('/accounts');
  revalidatePath('/');
  return account;
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
  const results = await db.insert(schema.transactions).values(
    transactions.map(t => ({
      ...t,
      importSource: 'csv',
    }))
  ).returning();
  
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
