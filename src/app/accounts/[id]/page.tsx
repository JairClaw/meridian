import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getAccount, getTransactions } from '@/lib/actions';
import { EditAccountDialog } from './edit-account-dialog';

const accountTypeConfig: Record<string, { label: string; color: string; icon: string }> = {
  checking: { label: 'Checking', color: 'bg-blue-500/10 text-blue-500', icon: '💳' },
  savings: { label: 'Savings', color: 'bg-emerald-500/10 text-emerald-500', icon: '🏦' },
  investment: { label: 'Investment', color: 'bg-purple-500/10 text-purple-500', icon: '📈' },
  credit_card: { label: 'Credit Card', color: 'bg-orange-500/10 text-orange-500', icon: '💳' },
  cash: { label: 'Cash', color: 'bg-green-500/10 text-green-500', icon: '💵' },
  mortgage: { label: 'Mortgage', color: 'bg-red-500/10 text-red-500', icon: '🏠' },
  loan: { label: 'Loan', color: 'bg-yellow-500/10 text-yellow-500', icon: '📋' },
};

function formatCurrency(cents: number, currency = 'EUR') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default async function AccountDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  const accountId = parseInt(id);
  
  if (isNaN(accountId)) {
    notFound();
  }
  
  const account = await getAccount(accountId);
  
  if (!account) {
    notFound();
  }
  
  const transactions = await getTransactions({ accountId, limit: 50 });
  const config = accountTypeConfig[account.type] || { label: account.type, color: 'bg-gray-500/10 text-gray-500', icon: '📄' };
  
  // Calculate stats
  const totalIncome = transactions
    .filter(t => t.transaction.amountCents > 0)
    .reduce((sum, t) => sum + t.transaction.amountCents, 0);
  
  const totalExpenses = Math.abs(transactions
    .filter(t => t.transaction.amountCents < 0)
    .reduce((sum, t) => sum + t.transaction.amountCents, 0));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/accounts" className="text-muted-foreground hover:text-foreground transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${config.color}`}>
            {config.icon}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-display">{account.name}</h1>
              <Badge variant="outline">{config.label}</Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              {account.institution || 'No institution'}
              {account.accountNumber && ` • ••••${account.accountNumber}`}
            </p>
          </div>
        </div>
        <EditAccountDialog account={account} />
      </div>

      {/* Balance Card */}
      <Card className="bg-gradient-to-br from-navy-900 to-navy-950 border-navy-800">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground mb-1">Current Balance</p>
          <p className={`text-4xl font-display font-semibold tabular-nums ${account.currentBalance < 0 ? 'text-rose-500' : 'text-white'}`}>
            {formatCurrency(account.currentBalance, account.currency)}
          </p>
          <p className="text-sm text-muted-foreground mt-2">{account.currency}</p>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Total Income</p>
            <p className="text-xl font-semibold tabular-nums text-emerald-500 font-display">
              {formatCurrency(totalIncome, account.currency)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Total Expenses</p>
            <p className="text-xl font-semibold tabular-nums font-display">
              {formatCurrency(totalExpenses, account.currency)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Transactions</p>
            <p className="text-xl font-semibold font-display">{transactions.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-display">Transactions</CardTitle>
              <CardDescription>Recent activity for this account</CardDescription>
            </div>
            <Link href={`/transactions?account=${account.id}`}>
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📝</div>
              <p className="text-muted-foreground">No transactions for this account yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map(({ transaction, category }) => (
                <div 
                  key={transaction.id} 
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-sm font-medium text-muted-foreground">
                        {(transaction.merchant || transaction.description).charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{transaction.merchant || transaction.description}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(transaction.date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {category && (
                      <Badge variant="outline" className="text-xs">
                        {category.name}
                      </Badge>
                    )}
                    <p className={`font-semibold tabular-nums ${
                      transaction.amountCents > 0 ? 'text-emerald-500' : ''
                    }`}>
                      {transaction.amountCents > 0 ? '+' : ''}
                      {formatCurrency(transaction.amountCents, transaction.currency)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
