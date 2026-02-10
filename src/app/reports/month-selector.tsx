'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getCategoryBreakdown } from '@/lib/actions';
import { CategoryChart } from '@/components/charts/category-chart';

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

export function MonthlyBreakdown() {
  const [offset, setOffset] = useState(0); // 0 = current month, 1 = last month, etc.
  const [categories, setCategories] = useState<Array<{ name: string; value: number; color: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [monthLabel, setMonthLabel] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      const now = new Date();
      const targetDate = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      const startDate = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-01`;
      const endDay = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).getDate();
      const endDate = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${endDay}`;
      
      setMonthLabel(targetDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
      
      const data = await getCategoryBreakdown(startDate, endDate);
      setCategories(data);
      setLoading(false);
    };
    
    loadData();
  }, [offset]);

  const totalSpending = categories.reduce((sum, c) => sum + c.value, 0);

  return (
    <div className="space-y-6">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setOffset(offset + 1)}
        >
          ← Previous
        </Button>
        <div className="text-center">
          <p className="font-display text-lg font-semibold">{monthLabel}</p>
          <p className="text-sm text-muted-foreground">
            Total: {formatCurrency(totalSpending)}
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setOffset(Math.max(0, offset - 1))}
          disabled={offset === 0}
        >
          Next →
        </Button>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display">Spending by Category</CardTitle>
          <CardDescription>{monthLabel} breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              Loading...
            </div>
          ) : categories.length > 0 ? (
            <CategoryChart data={categories} />
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <div className="text-4xl mb-2">🥧</div>
                <p>No expenses in {monthLabel}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Details */}
      {categories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display">Category Details</CardTitle>
            <CardDescription>Spending breakdown for {monthLabel}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {categories.map((category) => {
                const percentage = totalSpending > 0 ? (category.value / totalSpending) * 100 : 0;
                
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
    </div>
  );
}
