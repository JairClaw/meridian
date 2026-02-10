import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// Account types: checking, savings, credit_card, investment, mortgage, loan, cash
export const accounts = sqliteTable('accounts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  type: text('type').notNull(), // checking, savings, credit_card, investment, mortgage, loan, cash
  currency: text('currency').notNull().default('USD'),
  institution: text('institution'),
  accountNumber: text('account_number'), // last 4 digits only
  currentBalance: integer('current_balance').notNull().default(0), // in cents
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  color: text('color'), // for UI
  icon: text('icon'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  parentId: integer('parent_id').references(() => categories.id),
  icon: text('icon'),
  color: text('color'),
  budgetCents: integer('budget_cents'), // monthly budget
  isIncome: integer('is_income', { mode: 'boolean' }).notNull().default(false),
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
  importSource: text('import_source'), // csv, manual, api
  externalId: text('external_id'), // for deduplication
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

// Types for TypeScript
export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type RecurringRule = typeof recurringRules.$inferSelect;
export type Mortgage = typeof mortgages.$inferSelect;
