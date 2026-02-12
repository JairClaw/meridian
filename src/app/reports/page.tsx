import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getMonthlyTrends, getDashboardStats, getWeeklyIncomeExpenses } from '@/lib/actions';
import { MonthlyBreakdown } from './month-selector';
import { IncomeExpensesChart } from '@/components/income-expenses-chart';
import { PrivateAmount } from '@/components/private-amount';

function formatCurrency(cents: number, currency = 'EUR') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

export default async function ReportsPage() {
  // Get date range for past 12 months
  const now = new Date();
  const yearAgo = new Date(now);
  yearAgo.setFullYear(yearAgo.getFullYear() - 1);
  const startDate = `${yearAgo.getFullYear()}-${String(yearAgo.getMonth() + 1).padStart(2, '0')}-01`;
  const endDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()}`;
  
  const [trends, stats, weeklyData] = await Promise.all([
    getMonthlyTrends(6),
    getDashboardStats(),
    getWeeklyIncomeExpenses(52),
  ]);
  
  const { netWorth, monthlyIncome, monthlyExpenses, savingsRate } = stats;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display">Reports</h1>
        <p className="text-muted-foreground mt-1">Insights into your financial health</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Net Worth</p>
            <p className={`text-xl font-semibold tabular-nums font-display ${netWorth >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              <PrivateAmount>{formatCurrency(netWorth)}</PrivateAmount>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">This Month Income</p>
            <p className="text-xl font-semibold tabular-nums font-display text-emerald-500">
              <PrivateAmount>{formatCurrency(monthlyIncome)}</PrivateAmount>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">This Month Expenses</p>
            <p className="text-xl font-semibold tabular-nums font-display">
              <PrivateAmount>{formatCurrency(monthlyExpenses)}</PrivateAmount>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Savings Rate</p>
            <p className={`text-xl font-semibold tabular-nums font-display ${savingsRate >= 20 ? 'text-emerald-500' : savingsRate >= 0 ? 'text-gold-500' : 'text-rose-500'}`}>
              {savingsRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Income vs Expenses - Full Width */}
      <IncomeExpensesChart weeklyData={weeklyData} />

      {/* Monthly Breakdown with Month Selector */}
      <MonthlyBreakdown />

      {/* Monthly Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display">Monthly Summary</CardTitle>
          <CardDescription>Last 6 months at a glance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Month</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Income</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Expenses</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Net</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Savings Rate</th>
                </tr>
              </thead>
              <tbody>
                {trends.map((month) => {
                  const net = month.income - month.expenses;
                  const rate = month.income > 0 ? (net / month.income) * 100 : 0;
                  
                  return (
                    <tr key={month.date} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-medium">
                        <Link href={`/transactions?from=${month.startDate}&to=${month.endDate}`} className="hover:text-[#10B981] transition-colors">
                          {month.date} →
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums text-emerald-500">
                        <PrivateAmount>{formatCurrency(month.income)}</PrivateAmount>
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums">
                        <PrivateAmount>{formatCurrency(month.expenses)}</PrivateAmount>
                      </td>
                      <td className={`py-3 px-4 text-right tabular-nums font-medium ${net >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        <PrivateAmount>{net >= 0 ? '+' : ''}{formatCurrency(net)}</PrivateAmount>
                      </td>
                      <td className={`py-3 px-4 text-right tabular-nums ${rate >= 20 ? 'text-emerald-500' : rate >= 0 ? '' : 'text-rose-500'}`}>
                        {rate.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
