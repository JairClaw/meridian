import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getMonthlyTrends, getCategoryBreakdown, getDashboardStats } from '@/lib/actions';
import { SpendingChart } from '@/components/charts/spending-chart';
import { CategoryChart } from '@/components/charts/category-chart';

function formatCurrency(cents: number, currency = 'EUR') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

export default async function ReportsPage() {
  const [trends, categories, stats] = await Promise.all([
    getMonthlyTrends(6),
    getCategoryBreakdown(),
    getDashboardStats(),
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
              {formatCurrency(netWorth)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">This Month Income</p>
            <p className="text-xl font-semibold tabular-nums font-display text-emerald-500">
              {formatCurrency(monthlyIncome)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">This Month Expenses</p>
            <p className="text-xl font-semibold tabular-nums font-display">
              {formatCurrency(monthlyExpenses)}
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

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expenses Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display">Income vs Expenses</CardTitle>
            <CardDescription>Last 6 months trend</CardDescription>
          </CardHeader>
          <CardContent>
            {trends.some(t => t.income > 0 || t.expenses > 0) ? (
              <SpendingChart data={trends} />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <div className="text-4xl mb-2">📊</div>
                  <p>No transaction data yet</p>
                  <p className="text-sm">Add transactions to see trends</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Spending by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display">Spending by Category</CardTitle>
            <CardDescription>This month's breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            {categories.length > 0 ? (
              <CategoryChart data={categories} />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <div className="text-4xl mb-2">🥧</div>
                  <p>No categorized expenses yet</p>
                  <p className="text-sm">Categorize transactions to see breakdown</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category Details */}
      {categories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display">Category Details</CardTitle>
            <CardDescription>Spending breakdown by category this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {categories.map((category, index) => {
                const total = categories.reduce((sum, c) => sum + c.value, 0);
                const percentage = total > 0 ? (category.value / total) * 100 : 0;
                
                return (
                  <div key={category.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="font-medium">{category.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">
                          {percentage.toFixed(1)}%
                        </span>
                        <span className="font-semibold tabular-nums min-w-[100px] text-right">
                          {formatCurrency(category.value)}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="h-2 rounded-full transition-all duration-500"
                        style={{ 
                          width: `${percentage}%`,
                          backgroundColor: category.color 
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

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
                      <td className="py-3 px-4 font-medium">{month.date}</td>
                      <td className="py-3 px-4 text-right tabular-nums text-emerald-500">
                        {formatCurrency(month.income)}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums">
                        {formatCurrency(month.expenses)}
                      </td>
                      <td className={`py-3 px-4 text-right tabular-nums font-medium ${net >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {net >= 0 ? '+' : ''}{formatCurrency(net)}
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
