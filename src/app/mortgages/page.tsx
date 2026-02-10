import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { db, schema } from '@/db';
import { eq } from 'drizzle-orm';
import { MortgageCalculator } from './calculator';
import { MortgageCard } from './mortgage-card';

async function getMortgages() {
  return db.select({
    mortgage: schema.mortgages,
    account: schema.accounts,
  })
    .from(schema.mortgages)
    .leftJoin(schema.accounts, eq(schema.mortgages.accountId, schema.accounts.id));
}

export default async function MortgagesPage() {
  const mortgages = await getMortgages();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display">Mortgages</h1>
        <p className="text-muted-foreground mt-1">Track loans and calculate amortization schedules</p>
      </div>

      {/* Calculator */}
      <MortgageCalculator />

      {/* Existing Mortgages */}
      {mortgages.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-display">Your Mortgages</h2>
          <div className="grid gap-4">
            {mortgages.map(({ mortgage, account }) => (
              <MortgageCard key={mortgage.id} mortgage={mortgage} account={account} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
