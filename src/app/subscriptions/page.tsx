import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getRecurringRules, getAccounts } from '@/lib/actions';
import { AddSubscriptionForm } from './add-subscription-form';
import { SuggestedSubscriptions } from './suggested-subscriptions';

function formatCurrency(cents: number, currency = 'EUR') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

const frequencyLabels: Record<string, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

const frequencyMultipliers: Record<string, number> = {
  daily: 30,
  weekly: 4.33,
  monthly: 1,
  yearly: 1/12,
};

export default async function SubscriptionsPage() {
  const [subscriptions, accounts] = await Promise.all([
    getRecurringRules(),
    getAccounts(),
  ]);
  
  // Calculate monthly total
  const monthlyTotal = subscriptions.reduce((sum, { rule }) => {
    const multiplier = frequencyMultipliers[rule.frequency] || 1;
    return sum + Math.abs(rule.amountCents) * multiplier;
  }, 0);
  
  // Calculate yearly total
  const yearlyTotal = monthlyTotal * 12;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display">Subscriptions</h1>
          <p className="text-muted-foreground mt-1">Track your recurring payments</p>
        </div>
        <AddSubscriptionForm />
      </div>

      {/* Suggested Subscriptions */}
      <SuggestedSubscriptions />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider">Active Subscriptions</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold font-display">{subscriptions.length}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider">Monthly Cost</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold tabular-nums text-rose-500 font-display">
              {formatCurrency(monthlyTotal)}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider">Yearly Cost</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold tabular-nums text-rose-500 font-display">
              {formatCurrency(yearlyTotal)}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Subscriptions List */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display">Active Subscriptions</CardTitle>
          <CardDescription>Your recurring payments and subscriptions</CardDescription>
        </CardHeader>
        <CardContent>
          {subscriptions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🔄</div>
              <p className="text-muted-foreground mb-4">No subscriptions tracked yet.</p>
              <AddSubscriptionForm accounts={accounts} />
            </div>
          ) : (
            <div className="space-y-3">
              {subscriptions.map(({ rule, account, category }) => (
                <div 
                  key={rule.id} 
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gold-500/10 flex items-center justify-center text-xl">
                      {category?.icon || '📱'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{rule.name}</p>
                        <Badge variant="outline" className="text-xs">
                          {frequencyLabels[rule.frequency] || rule.frequency}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {account?.name || 'Unknown account'}
                        {category && ` • ${category.name}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold tabular-nums">
                      {formatCurrency(Math.abs(rule.amountCents), rule.currency)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Next: {rule.nextDate}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Payments */}
      {subscriptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display">Upcoming This Month</CardTitle>
            <CardDescription>Payments due soon</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {subscriptions
                .filter(({ rule }) => {
                  const nextDate = new Date(rule.nextDate);
                  const now = new Date();
                  return nextDate.getMonth() === now.getMonth() && nextDate.getFullYear() === now.getFullYear();
                })
                .sort((a, b) => a.rule.nextDate.localeCompare(b.rule.nextDate))
                .map(({ rule }) => (
                  <div key={rule.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm">
                        {new Date(rule.nextDate).getDate()}
                      </div>
                      <span className="font-medium">{rule.name}</span>
                    </div>
                    <span className="font-semibold tabular-nums">
                      {formatCurrency(Math.abs(rule.amountCents), rule.currency)}
                    </span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
