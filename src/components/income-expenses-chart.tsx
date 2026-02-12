'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { PrivateAmount } from '@/components/private-amount';

interface MonthData {
  month: string;
  income: number;
  expenses: number;
}

interface IncomeExpensesChartProps {
  monthlyData: MonthData[];
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function IncomeExpensesChart({ monthlyData }: IncomeExpensesChartProps) {
  const [hoveredMonth, setHoveredMonth] = useState<MonthData | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');

  // Calculate max value for scaling
  const maxValue = useMemo(() => {
    return Math.max(...monthlyData.map(d => Math.max(d.income, d.expenses)));
  }, [monthlyData]);

  // Total income and expenses
  const totals = useMemo(() => {
    return monthlyData.reduce(
      (acc, d) => ({
        income: acc.income + d.income,
        expenses: acc.expenses + d.expenses,
      }),
      { income: 0, expenses: 0 }
    );
  }, [monthlyData]);

  const handleMouseEnter = (data: MonthData, e: React.MouseEvent) => {
    setHoveredMonth(data);
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top - 8 });
  };

  // Generate block rows (like GitHub activity but vertical bars)
  const generateBlocks = (value: number, isIncome: boolean) => {
    const maxBlocks = 10;
    const filledBlocks = Math.round((value / maxValue) * maxBlocks);
    
    return Array.from({ length: maxBlocks }).map((_, i) => {
      const isFilled = i < filledBlocks;
      const intensity = isFilled ? (isIncome ? 0.3 + (i / maxBlocks) * 0.7 : 0.2 + (i / maxBlocks) * 0.5) : 0;
      
      return (
        <div
          key={i}
          className="w-full aspect-square rounded-[2px]"
          style={{
            backgroundColor: isFilled
              ? isIncome 
                ? `rgba(255, 255, 255, ${intensity})`
                : `rgba(150, 150, 150, ${intensity})`
              : 'rgba(255, 255, 255, 0.05)',
          }}
        />
      );
    }).reverse(); // Reverse so bars grow upward
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="label-sm">INCOME VS EXPENSES</p>
          <div className="flex items-center gap-2">
            {(['weekly', 'monthly', 'yearly'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`pill text-xs ${period === p ? 'pill-active' : 'pill-inactive'}`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
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

        {/* Block Chart */}
        <div className="flex gap-1">
          {monthlyData.map((data, idx) => (
            <div
              key={idx}
              className="flex-1 cursor-pointer"
              onMouseEnter={(e) => handleMouseEnter(data, e)}
              onMouseLeave={() => setHoveredMonth(null)}
            >
              {/* Two columns per month: income and expenses */}
              <div className="flex gap-[2px]">
                {/* Income column */}
                <div className="flex-1 flex flex-col gap-[2px]">
                  {generateBlocks(data.income, true)}
                </div>
                {/* Expenses column */}
                <div className="flex-1 flex flex-col gap-[2px]">
                  {generateBlocks(data.expenses, false)}
                </div>
              </div>
              {/* Month label */}
              <p className="text-xs text-muted-foreground text-center mt-2">
                {data.month}
              </p>
            </div>
          ))}
        </div>

        {/* Tooltip */}
        {hoveredMonth && (
          <div
            className="fixed z-50 px-3 py-2 text-sm bg-[#1A1A1A] text-white rounded-lg shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full"
            style={{ left: tooltipPos.x, top: tooltipPos.y }}
          >
            <p className="font-medium">{hoveredMonth.month}</p>
            <p>Income: <PrivateAmount>{formatCurrency(hoveredMonth.income)}</PrivateAmount></p>
            <p>Expenses: <PrivateAmount>{formatCurrency(hoveredMonth.expenses)}</PrivateAmount></p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
