import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getRecurringRules, getAccounts, getCategories } from '@/lib/actions';
import { AddSubscriptionForm } from './add-subscription-form';
import { SuggestedSubscriptions } from './suggested-subscriptions';
import { SubscriptionCard } from './subscription-card';

function formatCurrency(cents: number, currency = 'EUR') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

const frequencyMultipliers: Record<string, number> = {
  daily: 30,
  weekly: 4.33,
  monthly: 1,
  yearly: 1/12,
};

export default async function SubscriptionsPage() {
  const [subscriptions, accounts, categories] = await Promise.all([
    getRecurringRules(),
    getAccounts(),
    getCategories(),
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
              <AddSubscriptionForm />
            </div>
          ) : (
            <div className="space-y-3">
              {subscriptions.map(({ rule, account, category }) => (
                <SubscriptionCard
                  key={rule.id}
                  rule={rule}
                  account={account}
                  category={category}
                  categories={categories}
                  accounts={accounts}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
