import { sqliteTable, text, integer, real, AnySQLiteColumn } from 'drizzle-orm/sqlite-core';

// Account types: checking, savings, credit_card, investment, mortgage, loan, cash
export const accounts = sqliteTable('accounts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  type: text('type').notNull(), // checking, savings, credit_card, investment, mortgage, loan, cash
  currency: text('currency').notNull().default('USD'),
  institution: text('institution'),
  accountNumber: text('account_number'), // last 4 digits only
  openingBalance: integer('opening_balance').notNull().default(0), // in cents - balance before any tracked transactions
  currentBalance: integer('current_balance').notNull().default(0), // in cents - computed: opening + sum(txs)
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  color: text('color'), // for UI
  icon: text('icon'),
  linkedToAccountId: integer('linked_to_account_id'), // for grouping (e.g., home + mortgage = equity)
  hideFromDashboard: integer('hide_from_dashboard', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  parentId: integer('parent_id').references((): AnySQLiteColumn => categories.id),
  icon: text('icon'),
  color: text('color'),
  budgetCents: integer('budget_cents'), // monthly budget
  isIncome: integer('is_income', { mode: 'boolean' }).notNull().default(false),
});

export const importBatches = sqliteTable('import_batches', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  accountId: integer('account_id').notNull().references(() => accounts.id),
  filename: text('filename'),
  transactionCount: integer('transaction_count').notNull().default(0),
  totalAmountCents: integer('total_amount_cents').notNull().default(0),
  importedAt: integer('imported_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const importProfiles = sqliteTable('import_profiles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(), // e.g. "Wise EUR", "La Caixa"
  description: text('description'),
  // Column mappings (0-indexed column numbers, or -1 for none)
  dateColumn: integer('date_column').notNull(),
  descriptionColumn: integer('description_column').notNull(),
  amountColumn: integer('amount_column').notNull(),
  merchantColumn: integer('merchant_column'), // optional
  directionColumn: integer('direction_column'), // optional, for IN/OUT style
  // Settings
  hasHeaders: integer('has_headers', { mode: 'boolean' }).notNull().default(true),
  dateFormat: text('date_format').default('YYYY-MM-DD'), // or DD/MM/YYYY, MM/DD/YYYY
  amountInCents: integer('amount_in_cents', { mode: 'boolean' }).notNull().default(false),
  negativeExpenses: integer('negative_expenses', { mode: 'boolean' }).notNull().default(true), // expenses are negative
  defaultAccountId: integer('default_account_id').references(() => accounts.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const transactions = sqliteTable('transactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  accountId: integer('account_id').notNull().references(() => accounts.id),
  categoryId: integer('category_id').references(() => categories.id),
  date: text('date').notNull(), // ISO date string YYYY-MM-DD
  amountCents: integer('amount_cents').notNull(), // positive = income, negative = expense
  currency: text('currency').notNull().default('USD'),
  description: text('description').notNull(),
  merchant: text('merchant'),
  notes: text('notes'),
  isRecurring: integer('is_recurring', { mode: 'boolean' }).notNull().default(false),
  recurringRuleId: integer('recurring_rule_id').references(() => recurringRules.id),
  isTransfer: integer('is_transfer', { mode: 'boolean' }).notNull().default(false), // exclude from spending/income
  linkedTransactionId: integer('linked_transaction_id'), // links outgoing to incoming transfer
  importSource: text('import_source'), // csv, manual, api
  externalId: text('external_id'), // for deduplication
  importBatchId: integer('import_batch_id').references(() => importBatches.id), // for batch undo
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const recurringRules = sqliteTable('recurring_rules', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  accountId: integer('account_id').notNull().references(() => accounts.id),
  categoryId: integer('category_id').references(() => categories.id),
  name: text('name').notNull(),
  amountCents: integer('amount_cents').notNull(),
  currency: text('currency').notNull().default('USD'),
  frequency: text('frequency').notNull(), // daily, weekly, monthly, yearly
  dayOfMonth: integer('day_of_month'), // for monthly
  dayOfWeek: integer('day_of_week'), // for weekly (0-6)
  startDate: text('start_date').notNull(),
  endDate: text('end_date'),
  nextDate: text('next_date').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const mortgages = sqliteTable('mortgages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  accountId: integer('account_id').notNull().references(() => accounts.id),
  principalCents: integer('principal_cents').notNull(),
  interestRate: real('interest_rate').notNull(), // annual rate as decimal (0.065 = 6.5%)
  termMonths: integer('term_months').notNull(),
  startDate: text('start_date').notNull(),
  monthlyPaymentCents: integer('monthly_payment_cents').notNull(),
  extraPaymentCents: integer('extra_payment_cents').default(0),
  propertyValue: integer('property_value_cents'),
  propertyAddress: text('property_address'),
});

export const exchangeRates = sqliteTable('exchange_rates', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  date: text('date').notNull(),
  fromCurrency: text('from_currency').notNull(),
  toCurrency: text('to_currency').notNull(),
  rate: real('rate').notNull(),
});

// User preferences
export const settings = sqliteTable('settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
});

// Category rules for auto-categorization
export const categoryRules = sqliteTable('category_rules', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  categoryId: integer('category_id').notNull().references(() => categories.id),
  pattern: text('pattern').notNull(), // Text pattern to match
  matchType: text('match_type').notNull().default('contains'), // contains, starts_with, exact, regex
  caseSensitive: integer('case_sensitive', { mode: 'boolean' }).notNull().default(false),
  priority: integer('priority').notNull().default(0), // Higher = checked first
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Types for TypeScript
export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type RecurringRule = typeof recurringRules.$inferSelect;
export type Mortgage = typeof mortgages.$inferSelect;
export type ImportBatch = typeof importBatches.$inferSelect;
export type CategoryRule = typeof categoryRules.$inferSelect;
export type ImportProfile = typeof importProfiles.$inferSelect;
