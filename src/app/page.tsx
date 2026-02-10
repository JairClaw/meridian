import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getDashboardStats, getTransactions } from '@/lib/actions';
import Link from 'next/link';

const accountTypeConfig: Record<string, { color: string; icon: React.ReactNode }> = {
  checking: { 
    color: 'bg-blue-500/10 text-blue-500',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg>
  },
  savings: { 
    color: 'bg-emerald-500/10 text-emerald-500',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" /></svg>
  },
  investment: { 
    color: 'bg-purple-500/10 text-purple-500',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>
  },
  credit_card: {
    color: 'bg-orange-500/10 text-orange-500',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg>
  },
  cash: {
    color: 'bg-green-500/10 text-green-500',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>
  },
};

function formatCurrency(cents: number, currency = 'EUR') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default async function DashboardPage() {
  const [stats, recentTransactions] = await Promise.all([
    getDashboardStats(),
    getTransactions({ limit: 5 }),
  ]);

  const { netWorth, monthlyIncome, monthlyExpenses, savingsRate, accounts } = stats;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{getGreeting()}</p>
          <h1 className="text-3xl font-display">Financial Overview</h1>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="card-hover">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider">Net Worth</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-semibold tabular-nums font-display ${netWorth >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {formatCurrency(netWorth)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total assets minus liabilities</p>
          </CardContent>
        </Card>
        
        <Card className="card-hover">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider">Monthly Income</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold tabular-nums font-display text-emerald-500">
                {formatCurrency(monthlyIncome)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>
        
        <Card className="card-hover">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider">Monthly Expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold tabular-nums font-display">
                {formatCurrency(monthlyExpenses)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>
        
        <Card className="card-hover">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider">Savings Rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-semibold tabular-nums font-display ${savingsRate >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {savingsRate.toFixed(1)}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Income saved</p>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Accounts */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-display">Accounts</CardTitle>
                <CardDescription>Your connected accounts</CardDescription>
              </div>
              <Link href="/accounts" className="text-sm text-gold-500 hover:text-gold-400 transition-colors">
                View all →
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {accounts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm mb-3">No accounts yet</p>
                <Link href="/accounts" className="text-gold-500 text-sm hover:text-gold-400">
                  Add your first account →
                </Link>
              </div>
            ) : (
              accounts.slice(0, 4).map((account) => {
                const config = accountTypeConfig[account.type] || { 
                  color: 'bg-gray-500/10 text-gray-500', 
                  icon: <span>📄</span> 
                };
                
                return (
                  <Link
                    key={account.id}
                    href={`/accounts/${account.id}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${config.color}`}>
                        {config.icon}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{account.name}</p>
                        <p className="text-xs text-muted-foreground">{account.institution || account.type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold tabular-nums ${account.currentBalance < 0 ? 'text-rose-500' : ''}`}>
                        {formatCurrency(account.currentBalance, account.currency)}
                      </p>
                      <p className="text-xs text-muted-foreground">{account.currency}</p>
                    </div>
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-display">Recent Transactions</CardTitle>
                <CardDescription>Your latest activity</CardDescription>
              </div>
              <Link href="/transactions" className="text-sm text-gold-500 hover:text-gold-400 transition-colors">
                View all →
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentTransactions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm mb-3">No transactions yet</p>
                <Link href="/transactions" className="text-gold-500 text-sm hover:text-gold-400">
                  Add your first transaction →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTransactions.map(({ transaction, account, category }) => (
                  <div 
                    key={transaction.id} 
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-sm font-medium text-muted-foreground">
                          {(transaction.merchant || transaction.description).charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{transaction.merchant || transaction.description}</p>
                        <p className="text-xs text-muted-foreground">{transaction.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {category && (
                        <Badge variant="outline" className="text-xs">
                          {category.name}
                        </Badge>
                      )}
                      <div className="text-right min-w-[100px]">
                        <p className={`text-sm font-semibold tabular-nums ${
                          transaction.amountCents > 0 ? 'text-emerald-500' : ''
                        }`}>
                          {transaction.amountCents > 0 ? '+' : ''}{formatCurrency(transaction.amountCents, transaction.currency)}
                        </p>
                        <p className="text-xs text-muted-foreground">{transaction.date}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Add Transaction', icon: '＋', href: '/transactions' },
          { label: 'Import CSV', icon: '↑', href: '/import' },
          { label: 'New Account', icon: '⊕', href: '/accounts' },
          { label: 'View Reports', icon: '◎', href: '/reports' },
        ].map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-gold-500/50 hover:bg-gold-500/5 transition-all duration-200"
          >
            <span className="text-xl text-gold-500">{action.icon}</span>
            <span className="text-sm font-medium">{action.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
