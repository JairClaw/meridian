'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { PrivateAmount } from '@/components/private-amount';

interface WeekData {
  week: string;
  startDate: string;
  endDate: string;
  income: number;
  expenses: number;
}

interface IncomeExpensesChartProps {
  weeklyData: WeekData[];
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function IncomeExpensesChart({ weeklyData }: IncomeExpensesChartProps) {
  const router = useRouter();
  const [hoveredWeek, setHoveredWeek] = useState<WeekData | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const handleWeekClick = (data: WeekData) => {
    router.push(`/transactions?from=${data.startDate}&to=${data.endDate}`);
  };

  // Calculate max value for scaling
  const maxValue = useMemo(() => {
    return Math.max(...weeklyData.map(d => Math.max(d.income, d.expenses)), 1);
  }, [weeklyData]);

  // Total income and expenses
  const totals = useMemo(() => {
    return weeklyData.reduce(
      (acc, d) => ({
        income: acc.income + d.income,
        expenses: acc.expenses + d.expenses,
      }),
      { income: 0, expenses: 0 }
    );
  }, [weeklyData]);

  const handleMouseEnter = (data: WeekData, e: React.MouseEvent) => {
    setHoveredWeek(data);
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top - 8 });
  };

  // Generate block rows (like GitHub activity but vertical bars)
  const generateBlocks = (value: number, isIncome: boolean) => {
    const maxBlocks = 20; // Taller chart
    const filledBlocks = Math.round((value / maxValue) * maxBlocks);
    
    return Array.from({ length: maxBlocks }).map((_, i) => {
      const isFilled = i < filledBlocks;
      const intensity = isFilled ? (isIncome ? 0.4 + (i / maxBlocks) * 0.6 : 0.25 + (i / maxBlocks) * 0.45) : 0;
      
      return (
        <div
          key={i}
          className="aspect-square rounded-[2px]"
          style={{
            backgroundColor: isFilled
              ? isIncome 
                ? `rgba(255, 255, 255, ${intensity})`
                : `rgba(150, 150, 150, ${intensity})`
              : 'rgba(255, 255, 255, 0.03)',
          }}
        />
      );
    }).reverse(); // Reverse so bars grow upward
  };

  return (
    <Card className="border-0 shadow-sm w-full flex flex-col">
      <CardContent className="p-6 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <p className="label-sm">INCOME VS EXPENSES</p>
          <span className="text-xs text-muted-foreground">Weekly · Past Year</span>
        </div>

        <div className="flex items-baseline gap-6 mb-6">
          <div>
            <span className="text-sm text-muted-foreground">Income: </span>
            <span className="text-xl font-semibold tabular-nums">
              <PrivateAmount>{formatCurrency(totals.income)}</PrivateAmount>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-white/80" />
              <span className="text-sm text-muted-foreground">Income</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-white/30" />
              <span className="text-sm text-muted-foreground">Expenses</span>
            </div>
          </div>
        </div>

        {/* Block Chart - weekly, tight spacing */}
        <div className="flex-1 flex flex-col justify-end">
          <div className="flex gap-[2px] items-end">
            {weeklyData.map((data, idx) => (
              <div
                key={idx}
                className="cursor-pointer flex-1 hover:opacity-80 transition-opacity"
                onMouseEnter={(e) => handleMouseEnter(data, e)}
                onMouseLeave={() => setHoveredWeek(null)}
                onClick={() => handleWeekClick(data)}
              >
                {/* Two columns per week: income and expenses */}
                <div className="flex gap-[1px]">
                  {/* Income column */}
                  <div className="flex flex-col gap-[1px] flex-1">
                    {generateBlocks(data.income, true)}
                  </div>
                  {/* Expenses column */}
                  <div className="flex flex-col gap-[1px] flex-1">
                    {generateBlocks(data.expenses, false)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Month labels below chart */}
          <div className="flex mt-2">
            {weeklyData.map((data, idx) => {
              // Show label every 4 weeks
              const showLabel = idx % 4 === 0;
              return (
                <div key={idx} className="flex-1 text-center">
                  {showLabel && (
                    <span className="text-[10px] text-muted-foreground">{data.week.split(' ')[0]}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Tooltip */}
        {hoveredWeek && (
          <div
            className="fixed z-50 px-3 py-2 text-sm bg-[#1A1A1A] text-white rounded-lg shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full"
            style={{ left: tooltipPos.x, top: tooltipPos.y }}
          >
            <p className="font-medium">Week of {hoveredWeek.week}</p>
            <p>Income: <PrivateAmount>{formatCurrency(hoveredWeek.income)}</PrivateAmount></p>
            <p>Expenses: <PrivateAmount>{formatCurrency(hoveredWeek.expenses)}</PrivateAmount></p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
