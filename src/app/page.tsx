import { Card, CardContent } from '@/components/ui/card';
import { getDashboardStats, getTransactions } from '@/lib/actions';
import Link from 'next/link';

function formatCurrency(cents: number, currency = 'EUR') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function formatCurrencyFull(cents: number, currency = 'EUR') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

// Mini sparkline bars component
function MiniSparkline({ positive = true }: { positive?: boolean }) {
  const heights = [40, 60, 35, 80, 55, 70, 45, 90, 65, 75];
  return (
    <div className="flex items-end gap-0.5 h-8">
      {heights.map((h, i) => (
        <div 
          key={i} 
          className={`w-1 rounded-sm ${positive ? 'bg-[#1A1A1A]' : 'bg-[#1A1A1A]/30'}`}
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}

export default async function DashboardPage() {
  const [stats, recentTransactions] = await Promise.all([
    getDashboardStats(),
    getTransactions({ limit: 8 }),
  ]);

  const { netWorth, monthlyIncome, monthlyExpenses, accounts } = stats;
  
  // Calculate YoY change (mock for now)
  const yoyChange = 0.12;

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Dashboard</span>
        <span className="text-muted-foreground">›</span>
        <span className="font-medium">Overview</span>
      </div>

      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-semibold">Welcome back, Diya</h1>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="label-sm mb-3">NET WORTH</p>
                <p className="text-3xl font-semibold tabular-nums">
                  {formatCurrency(netWorth)}
                </p>
              </div>
              <MiniSparkline positive={netWorth >= 0} />
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#10B981]/10 flex items-center justify-center">
                <svg className="w-3 h-3 text-[#10B981]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              </span>
              <span className="text-sm text-[#10B981] font-medium">+{(yoyChange * 100).toFixed(0)}%</span>
              <span className="text-sm text-muted-foreground">vs last year</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="label-sm mb-3">MONTHLY INCOME</p>
                <p className="text-3xl font-semibold tabular-nums text-[#10B981]">
                  {formatCurrency(monthlyIncome)}
                </p>
              </div>
              <MiniSparkline positive />
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#10B981]/10 flex items-center justify-center">
                <svg className="w-3 h-3 text-[#10B981]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              </span>
              <span className="text-sm text-[#10B981] font-medium">+8%</span>
              <span className="text-sm text-muted-foreground">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="label-sm mb-3">MONTHLY EXPENSES</p>
                <p className="text-3xl font-semibold tabular-nums">
                  {formatCurrency(Math.abs(monthlyExpenses))}
                </p>
              </div>
              <MiniSparkline positive={false} />
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-rose-500/10 flex items-center justify-center">
                <svg className="w-3 h-3 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </span>
              <span className="text-sm text-rose-500 font-medium">-3%</span>
              <span className="text-sm text-muted-foreground">vs last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Spending Trend - Block Chart Style */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <p className="label-sm">SPENDING TREND</p>
              <span className="w-4 h-4 rounded-full bg-muted flex items-center justify-center text-xs">?</span>
            </div>
            <div className="flex items-center gap-2">
              {['Weekly', 'Monthly', 'Yearly'].map((period, i) => (
                <button
                  key={period}
                  className={`pill ${i === 1 ? 'pill-active' : 'pill-inactive'}`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-baseline gap-4 mb-6">
            <p className="text-sm text-muted-foreground">Total Spending:</p>
            <p className="text-2xl font-semibold tabular-nums">
              {formatCurrency(Math.abs(monthlyExpenses))}
            </p>
            <div className="flex items-center gap-4 ml-8">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#1A1A1A]/30" />
                <span className="text-sm text-muted-foreground">Essentials</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#1A1A1A]" />
                <span className="text-sm text-muted-foreground">Discretionary</span>
              </div>
            </div>
          </div>

          {/* Block Chart */}
          <div className="relative">
            <div className="flex items-end gap-1 h-48">
              {Array.from({ length: 52 }).map((_, i) => {
                const height = Math.random() * 80 + 20;
                const isDiscretionary = Math.random() > 0.5;
                return (
                  <div key={i} className="flex-1 flex flex-col justify-end gap-0.5">
                    <div 
                      className={`w-full rounded-sm ${isDiscretionary ? 'bg-[#1A1A1A]' : 'bg-[#1A1A1A]/30'}`}
                      style={{ height: `${height * 0.6}%` }}
                    />
                    <div 
                      className={`w-full rounded-sm ${!isDiscretionary ? 'bg-[#1A1A1A]' : 'bg-[#1A1A1A]/30'}`}
                      style={{ height: `${height * 0.4}%` }}
                    />
                  </div>
                );
              })}
            </div>
            {/* X-axis labels */}
            <div className="flex justify-between mt-4 text-xs text-muted-foreground">
              {['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'].map(m => (
                <span key={m}>{m}</span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Section: Accounts & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Accounts */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="label-sm">ACCOUNTS</p>
              <Link href="/accounts" className="text-sm text-[#10B981] hover:underline">
                View all →
              </Link>
            </div>
            <div className="space-y-3">
              {accounts.slice(0, 4).map((account) => (
                <div key={account.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] text-white flex items-center justify-center text-sm font-medium">
                      {account.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{account.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{account.type.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <p className={`font-semibold tabular-nums ${account.currentBalanceCents >= 0 ? '' : 'text-rose-500'}`}>
                    {formatCurrencyFull(account.currentBalanceCents, account.currency)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="label-sm">RECENT TRANSACTIONS</p>
              <Link href="/transactions" className="text-sm text-[#10B981] hover:underline">
                View all →
              </Link>
            </div>
            <div className="space-y-2">
              {recentTransactions.slice(0, 5).map(({ transaction, category }) => (
                <div key={transaction.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-sm">
                      {category?.icon || '💳'}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{transaction.merchant || transaction.description}</p>
                      <p className="text-xs text-muted-foreground">{transaction.date}</p>
                    </div>
                  </div>
                  <p className={`text-sm font-semibold tabular-nums ${transaction.amountCents > 0 ? 'text-[#10B981]' : ''}`}>
                    {transaction.amountCents > 0 ? '+' : ''}{formatCurrencyFull(transaction.amountCents, transaction.currency)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
