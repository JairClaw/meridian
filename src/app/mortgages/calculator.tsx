'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { calculateMortgage, formatAmortizationDate, type AmortizationRow } from '@/lib/mortgage';

function formatCurrency(cents: number, currency = 'EUR') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

export function MortgageCalculator() {
  const [inputs, setInputs] = useState({
    principal: '300000',
    interestRate: '3.5',
    termYears: '30',
    startDate: new Date().toISOString().split('T')[0],
    extraPayment: '0',
  });
  
  const [showSchedule, setShowSchedule] = useState(false);

  const calculation = useMemo(() => {
    const principal = parseFloat(inputs.principal) * 100 || 0;
    const rate = parseFloat(inputs.interestRate) / 100 || 0;
    const termMonths = (parseFloat(inputs.termYears) || 0) * 12;
    const extraPayment = parseFloat(inputs.extraPayment) * 100 || 0;
    
    if (principal <= 0 || rate <= 0 || termMonths <= 0) {
      return null;
    }
    
    return calculateMortgage(principal, rate, termMonths, inputs.startDate, extraPayment);
  }, [inputs]);

  const comparisonWithExtra = useMemo(() => {
    if (!calculation || parseFloat(inputs.extraPayment) <= 0) return null;
    
    const principal = parseFloat(inputs.principal) * 100;
    const rate = parseFloat(inputs.interestRate) / 100;
    const termMonths = parseFloat(inputs.termYears) * 12;
    
    const withoutExtra = calculateMortgage(principal, rate, termMonths, inputs.startDate, 0);
    
    return {
      interestSaved: withoutExtra.totalInterest - calculation.totalInterest,
      monthsSaved: withoutExtra.schedule.length - calculation.schedule.length,
    };
  }, [calculation, inputs]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display">Mortgage Calculator</CardTitle>
        <CardDescription>Calculate payments and view amortization schedule</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Loan Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
              <Input
                type="number"
                value={inputs.principal}
                onChange={(e) => setInputs({ ...inputs, principal: e.target.value })}
                className="pl-8"
                placeholder="300000"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Interest Rate</label>
            <div className="relative">
              <Input
                type="number"
                step="0.1"
                value={inputs.interestRate}
                onChange={(e) => setInputs({ ...inputs, interestRate: e.target.value })}
                className="pr-8"
                placeholder="3.5"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Term (Years)</label>
            <Input
              type="number"
              value={inputs.termYears}
              onChange={(e) => setInputs({ ...inputs, termYears: e.target.value })}
              placeholder="30"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Start Date</label>
            <Input
              type="date"
              value={inputs.startDate}
              onChange={(e) => setInputs({ ...inputs, startDate: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Extra Payment</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
              <Input
                type="number"
                value={inputs.extraPayment}
                onChange={(e) => setInputs({ ...inputs, extraPayment: e.target.value })}
                className="pl-8"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Results */}
        {calculation && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-border">
              <div className="p-4 rounded-lg bg-muted/30">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Monthly Payment</p>
                <p className="text-2xl font-semibold tabular-nums font-display">
                  {formatCurrency(calculation.monthlyPayment + parseFloat(inputs.extraPayment) * 100)}
                </p>
              </div>
              
              <div className="p-4 rounded-lg bg-muted/30">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Total Payment</p>
                <p className="text-2xl font-semibold tabular-nums font-display">
                  {formatCurrency(calculation.totalPayment)}
                </p>
              </div>
              
              <div className="p-4 rounded-lg bg-muted/30">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Total Interest</p>
                <p className="text-2xl font-semibold tabular-nums font-display text-gold-500">
                  {formatCurrency(calculation.totalInterest)}
                </p>
              </div>
              
              <div className="p-4 rounded-lg bg-muted/30">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Payoff Date</p>
                <p className="text-2xl font-semibold font-display">
                  {formatAmortizationDate(calculation.schedule[calculation.schedule.length - 1]?.date || '')}
                </p>
              </div>
            </div>

            {/* Extra Payment Savings */}
            {comparisonWithExtra && (
              <div className="flex items-center gap-4 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div className="text-2xl">💰</div>
                <div>
                  <p className="font-medium text-emerald-500">Extra payments save you money!</p>
                  <p className="text-sm text-muted-foreground">
                    You&apos;ll save <span className="font-semibold text-emerald-500">{formatCurrency(comparisonWithExtra.interestSaved)}</span> in interest 
                    and pay off <span className="font-semibold text-emerald-500">{comparisonWithExtra.monthsSaved} months</span> earlier.
                  </p>
                </div>
              </div>
            )}

            {/* Toggle Schedule */}
            <Button 
              variant="outline" 
              onClick={() => setShowSchedule(!showSchedule)}
              className="w-full"
            >
              {showSchedule ? 'Hide' : 'Show'} Amortization Schedule
              <svg 
                className={`w-4 h-4 ml-2 transition-transform ${showSchedule ? 'rotate-180' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </Button>

            {/* Amortization Schedule */}
            {showSchedule && (
              <Tabs defaultValue="table" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="table">Table View</TabsTrigger>
                  <TabsTrigger value="yearly">Yearly Summary</TabsTrigger>
                </TabsList>
                
                <TabsContent value="table" className="mt-4">
                  <div className="max-h-96 overflow-y-auto rounded-lg border border-border">
                    <table className="w-full">
                      <thead className="sticky top-0 bg-card">
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">#</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground">Payment</th>
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground">Principal</th>
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground">Interest</th>
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground">Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {calculation.schedule.map((row) => (
                          <tr key={row.month} className="border-b border-border/50 hover:bg-muted/30">
                            <td className="py-2 px-4 text-muted-foreground">{row.month}</td>
                            <td className="py-2 px-4">{formatAmortizationDate(row.date)}</td>
                            <td className="py-2 px-4 text-right tabular-nums">{formatCurrency(row.payment)}</td>
                            <td className="py-2 px-4 text-right tabular-nums text-emerald-500">{formatCurrency(row.principal)}</td>
                            <td className="py-2 px-4 text-right tabular-nums text-gold-500">{formatCurrency(row.interest)}</td>
                            <td className="py-2 px-4 text-right tabular-nums font-medium">{formatCurrency(row.balance)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>
                
                <TabsContent value="yearly" className="mt-4">
                  <div className="space-y-2">
                    {getYearlySummary(calculation.schedule).map((year) => (
                      <div key={year.year} className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-4">
                          <Badge variant="outline">{year.year}</Badge>
                          <div>
                            <p className="font-medium">Year {year.yearNumber}</p>
                            <p className="text-sm text-muted-foreground">{year.payments} payments</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-8 text-right">
                          <div>
                            <p className="text-xs text-muted-foreground">Principal</p>
                            <p className="font-semibold tabular-nums text-emerald-500">{formatCurrency(year.principal)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Interest</p>
                            <p className="font-semibold tabular-nums text-gold-500">{formatCurrency(year.interest)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">End Balance</p>
                            <p className="font-semibold tabular-nums">{formatCurrency(year.endBalance)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function getYearlySummary(schedule: AmortizationRow[]) {
  const years: Record<string, { 
    year: string; 
    yearNumber: number;
    payments: number; 
    principal: number; 
    interest: number; 
    endBalance: number 
  }> = {};
  
  schedule.forEach((row, index) => {
    const year = row.date.split('-')[0];
    if (!years[year]) {
      years[year] = { 
        year, 
        yearNumber: Object.keys(years).length + 1,
        payments: 0, 
        principal: 0, 
        interest: 0, 
        endBalance: 0 
      };
    }
    years[year].payments++;
    years[year].principal += row.principal;
    years[year].interest += row.interest;
    years[year].endBalance = row.balance;
  });
  
  return Object.values(years);
}
