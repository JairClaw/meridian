import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getTransactions, getAccounts, getUncategorizedCount, getCategories } from '@/lib/actions';
import { AddTransactionForm } from './add-transaction-form';
import { TransactionFilters } from './transaction-filters';

function formatCurrency(cents: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export default async function TransactionsPage() {
  const [transactions, accounts, uncategorizedCount, categories] = await Promise.all([
    getTransactions({ limit: 200 }),
    getAccounts(),
    getUncategorizedCount(),
    getCategories(),
  ]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display">Transactions</h1>
          <p className="text-muted-foreground mt-1">Track your income and expenses</p>
        </div>
        <div className="flex gap-3">
          {uncategorizedCount > 0 && (
            <Link href="/settings#rules">
              <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-yellow-500/50 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 transition-colors">
                <span className="text-lg">💡</span>
                {uncategorizedCount} uncategorized
              </button>
            </Link>
          )}
          <a href="/import">
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Import CSV
            </button>
          </a>
          <AddTransactionForm accounts={accounts} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider">Total Transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold font-display">{transactions.length}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider">Total Income</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold tabular-nums text-emerald-500 font-display">
              {formatCurrency(
                transactions
                  .filter(t => t.transaction.amountCents > 0)
                  .reduce((sum, t) => sum + t.transaction.amountCents, 0)
              )}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider">Total Expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold tabular-nums text-rose-500 font-display">
              {formatCurrency(
                Math.abs(transactions
                  .filter(t => t.transaction.amountCents < 0)
                  .reduce((sum, t) => sum + t.transaction.amountCents, 0))
              )}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display">All Transactions</CardTitle>
          <CardDescription>Your complete transaction history</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📝</div>
              <p className="text-muted-foreground mb-4">No transactions yet. Add your first transaction or import from CSV.</p>
              <div className="flex justify-center gap-3">
                <a href="/import">
                  <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors">
                    Import CSV
                  </button>
                </a>
                <AddTransactionForm accounts={accounts} />
              </div>
            </div>
          ) : (
            <TransactionFilters transactions={transactions} categories={categories} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
