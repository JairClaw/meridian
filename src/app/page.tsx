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

      {/* Spending Activity - GitHub Style */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <p className="label-sm">SPENDING ACTIVITY</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Less</span>
              <div className="flex gap-[3px]">
                {[0, 1, 2, 3, 4].map((level) => (
                  <div 
                    key={level}
                    className="w-[10px] h-[10px] rounded-[2px]"
                    style={{ 
                      backgroundColor: level === 0 
                        ? '#EBEDF0' 
                        : `rgba(26, 26, 26, ${0.15 + level * 0.22})` 
                    }}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">More</span>
            </div>
          </div>

          {/* Month labels */}
          <div className="flex mb-2 ml-8 text-xs text-muted-foreground">
            {['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'].map((m) => (
              <span key={m} className="flex-1">{m}</span>
            ))}
          </div>

          {/* GitHub-style Activity Grid */}
          <div className="flex gap-2">
            {/* Day labels */}
            <div className="flex flex-col justify-around text-xs text-muted-foreground pr-1" style={{ height: 82 }}>
              <span>Mon</span>
              <span>Wed</span>
              <span>Fri</span>
            </div>
            
            {/* Grid */}
            <div className="flex-1 overflow-x-auto">
              <div className="flex gap-[3px]" style={{ width: 'max-content' }}>
                {/* 53 weeks */}
                {Array.from({ length: 53 }).map((_, weekIdx) => (
                  <div key={weekIdx} className="flex flex-col gap-[3px]">
                    {/* 7 days */}
                    {Array.from({ length: 7 }).map((_, dayIdx) => {
                      // Generate spending intensity (0-4) with some randomness
                      const seed = Math.sin(weekIdx * 7 + dayIdx + 1) * 10000;
                      const rand = seed - Math.floor(seed);
                      const level = rand < 0.3 ? 0 : rand < 0.5 ? 1 : rand < 0.7 ? 2 : rand < 0.85 ? 3 : 4;
                      return (
                        <div
                          key={dayIdx}
                          className="w-[10px] h-[10px] rounded-[2px]"
                          style={{ 
                            backgroundColor: level === 0 
                              ? '#EBEDF0' 
                              : `rgba(26, 26, 26, ${0.15 + level * 0.22})` 
                          }}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-baseline gap-3 mt-4 pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">Total this year:</p>
            <p className="text-xl font-semibold tabular-nums">
              {formatCurrency(Math.abs(monthlyExpenses) * 12)}
            </p>
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
