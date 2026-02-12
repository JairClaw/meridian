'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PrivateAmount } from '@/components/private-amount';
import { calculateMortgage } from '@/lib/mortgage';
import type { Mortgage, Account } from '@/db/schema';

interface MortgageCardProps {
  mortgage: Mortgage;
  account: Account | null;
}

function formatCurrency(cents: number, currency = 'EUR') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

export function MortgageCard({ mortgage, account }: MortgageCardProps) {
  const calculation = calculateMortgage(
    mortgage.principalCents,
    mortgage.interestRate,
    mortgage.termMonths,
    mortgage.startDate,
    mortgage.extraPaymentCents || 0
  );
  
  // Calculate progress
  const totalPaid = mortgage.principalCents - (account?.currentBalance ? Math.abs(account.currentBalance) : 0);
  const progressPercent = (totalPaid / mortgage.principalCents) * 100;
  
  // Find current month in schedule
  const now = new Date();
  const currentPayment = calculation.schedule.find(row => {
    const paymentDate = new Date(row.date);
    return paymentDate.getMonth() === now.getMonth() && paymentDate.getFullYear() === now.getFullYear();
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
              🏠
            </div>
            <div>
              <CardTitle className="font-display text-lg">{mortgage.propertyAddress || 'Mortgage'}</CardTitle>
              <p className="text-sm text-muted-foreground">{account?.name || 'Linked account'}</p>
            </div>
          </div>
          <Badge variant="outline">{(mortgage.interestRate * 100).toFixed(2)}% APR</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Paid off</span>
            <span className="font-medium">{progressPercent.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-3">
            <div 
              className="h-3 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
              style={{ width: `${Math.min(100, progressPercent)}%` }}
            />
          </div>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Original Amount</p>
            <p className="font-semibold tabular-nums"><PrivateAmount>{formatCurrency(mortgage.principalCents)}</PrivateAmount></p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Remaining</p>
            <p className="font-semibold tabular-nums text-rose-500">
              <PrivateAmount>{formatCurrency(Math.abs(account?.currentBalance || 0))}</PrivateAmount>
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Monthly Payment</p>
            <p className="font-semibold tabular-nums"><PrivateAmount>{formatCurrency(mortgage.monthlyPaymentCents)}</PrivateAmount></p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Payoff Date</p>
            <p className="font-semibold">
              {new Date(calculation.schedule[calculation.schedule.length - 1]?.date || '').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>
        
        {/* Current Month Breakdown */}
        {currentPayment && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
            <div>
              <p className="text-sm font-medium">This month&apos;s payment</p>
              <p className="text-xs text-muted-foreground">
                <span className="text-emerald-500"><PrivateAmount>{formatCurrency(currentPayment.principal)}</PrivateAmount></span> principal + 
                <span className="text-gold-500 ml-1"><PrivateAmount>{formatCurrency(currentPayment.interest)}</PrivateAmount></span> interest
              </p>
            </div>
            <p className="font-semibold tabular-nums"><PrivateAmount>{formatCurrency(currentPayment.payment)}</PrivateAmount></p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
