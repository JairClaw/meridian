'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getCategoryBreakdown, getCategories } from '@/lib/actions';
import { PrivateAmount } from '@/components/private-amount';

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

// Generate horizontal blocks for a category
function generateBlocks(percentage: number, color: string) {
  const maxBlocks = 30;
  const filledBlocks = Math.round((percentage / 100) * maxBlocks);
  
  return (
    <div className="flex gap-[2px]">
      {Array.from({ length: maxBlocks }).map((_, i) => {
        const isFilled = i < filledBlocks;
        const intensity = isFilled ? 0.4 + (i / maxBlocks) * 0.6 : 0;
        
        return (
          <div
            key={i}
            className="w-[10px] h-[10px] rounded-[2px]"
            style={{
              backgroundColor: isFilled ? color : 'rgba(255, 255, 255, 0.03)',
              opacity: isFilled ? intensity : 1,
            }}
          />
        );
      })}
    </div>
  );
}

export function MonthlyBreakdown() {
  const router = useRouter();
  const [offset, setOffset] = useState(0); // 0 = current month, 1 = last month, etc.
  const [categories, setCategories] = useState<Array<{ id: number | null; name: string; value: number; color: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [monthLabel, setMonthLabel] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      const now = new Date();
      const targetDate = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      const startDate = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-01`;
      const endDay = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).getDate();
      const endDate = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${endDay}`;
      
      setMonthLabel(targetDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
      setDateRange({ start: startDate, end: endDate });
      
      const data = await getCategoryBreakdown(startDate, endDate);
      setCategories(data);
      setLoading(false);
    };
    
    loadData();
  }, [offset]);

  const handleCategoryClick = (categoryId: number | null) => {
    const categoryParam = categoryId === null ? 'uncategorized' : categoryId.toString();
    router.push(`/transactions?from=${dateRange.start}&to=${dateRange.end}&category=${categoryParam}`);
  };

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

      {/* Category Details with Block Style */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <p className="label-sm">SPENDING BY CATEGORY</p>
            <span className="text-xs text-muted-foreground">{monthLabel}</span>
          </div>
          
          {loading ? (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              Loading...
            </div>
          ) : categories.length > 0 ? (
            <div className="space-y-4">
              {categories.map((category) => {
                const percentage = totalSpending > 0 ? (category.value / totalSpending) * 100 : 0;
                
                return (
                  <div 
                    key={category.name}
                    className="cursor-pointer hover:bg-muted/30 -mx-2 px-2 py-1 rounded-lg transition-colors"
                    onClick={() => handleCategoryClick(category.id)}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm">{category.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {percentage.toFixed(0)}%
                        </span>
                        <span className="text-sm font-medium tabular-nums min-w-[80px] text-right">
                          <PrivateAmount>{formatCurrency(category.value)}</PrivateAmount>
                        </span>
                      </div>
                    </div>
                    {generateBlocks(percentage, category.color || '#FFFFFF')}
                  </div>
                );
              })}
              
              {/* Total */}
              <div className="pt-4 mt-2 border-t border-border">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-muted-foreground">Total spent</span>
                  <span className="text-lg font-semibold tabular-nums">
                    <PrivateAmount>{formatCurrency(totalSpending)}</PrivateAmount>
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <div className="text-4xl mb-2">📊</div>
                <p>No expenses in {monthLabel}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
