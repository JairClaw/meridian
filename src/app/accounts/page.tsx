import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getAccounts } from '@/lib/actions';
import { AddAccountForm } from './add-account-form';

const accountTypeConfig: Record<string, { label: string; color: string; icon: string }> = {
  checking: { label: 'Checking', color: 'bg-blue-500/10 text-blue-500', icon: '💳' },
  savings: { label: 'Savings', color: 'bg-emerald-500/10 text-emerald-500', icon: '🏦' },
  investment: { label: 'Investment', color: 'bg-purple-500/10 text-purple-500', icon: '📈' },
  credit_card: { label: 'Credit Card', color: 'bg-orange-500/10 text-orange-500', icon: '💳' },
  cash: { label: 'Cash', color: 'bg-green-500/10 text-green-500', icon: '💵' },
  mortgage: { label: 'Mortgage', color: 'bg-red-500/10 text-red-500', icon: '🏠' },
  loan: { label: 'Loan', color: 'bg-yellow-500/10 text-yellow-500', icon: '📋' },
};

function formatCurrency(cents: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

export default async function AccountsPage() {
  const accounts = await getAccounts();
  
  const totalByType = accounts.reduce((acc, account) => {
    const type = account.type;
    if (!acc[type]) acc[type] = 0;
    acc[type] += account.currentBalance;
    return acc;
  }, {} as Record<string, number>);
  
  const totalAssets = accounts
    .filter(a => ['checking', 'savings', 'investment', 'cash'].includes(a.type))
    .reduce((sum, a) => sum + a.currentBalance, 0);
  
  const totalLiabilities = accounts
    .filter(a => ['credit_card', 'loan', 'mortgage'].includes(a.type))
    .reduce((sum, a) => sum + Math.abs(a.currentBalance), 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display">Accounts</h1>
          <p className="text-muted-foreground mt-1">Manage your financial accounts</p>
        </div>
        <AddAccountForm />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider">Total Assets</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold tabular-nums text-emerald-500 font-display">
              {formatCurrency(totalAssets)}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider">Total Liabilities</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold tabular-nums text-rose-500 font-display">
              {formatCurrency(totalLiabilities)}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider">Net Worth</CardDescription>
          </CardHeader>
          <CardContent>
            <span className={`text-2xl font-semibold tabular-nums font-display ${totalAssets - totalLiabilities >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {formatCurrency(totalAssets - totalLiabilities)}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Accounts List */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display">All Accounts</CardTitle>
          <CardDescription>{accounts.length} account{accounts.length !== 1 ? 's' : ''} connected</CardDescription>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No accounts yet. Add your first account to get started.</p>
              <AddAccountForm />
            </div>
          ) : (
            <div className="space-y-3">
              {accounts.map((account) => {
                const config = accountTypeConfig[account.type] || { label: account.type, color: 'bg-gray-500/10 text-gray-500', icon: '📄' };
                const isNegative = account.currentBalance < 0;
                
                return (
                  <Link 
                    key={account.id}
                    href={`/accounts/${account.id}`}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer group block"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${config.color}`}>
                        {config.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{account.name}</p>
                          <Badge variant="outline" className="text-xs">
                            {config.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {account.institution || 'No institution'} 
                          {account.accountNumber && ` • ••••${account.accountNumber}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-semibold tabular-nums ${isNegative ? 'text-rose-500' : ''}`}>
                        {formatCurrency(account.currentBalance, account.currency)}
                      </p>
                      <p className="text-xs text-muted-foreground">{account.currency}</p>
                    </div>
                  </Link>
                );
              })}
              
              {/* Add account at bottom of list */}
              <AddAccountForm variant="inline" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
