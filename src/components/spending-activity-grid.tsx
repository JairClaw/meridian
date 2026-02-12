'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { PrivateAmount } from '@/components/private-amount';

interface SpendingActivityGridProps {
  yearlyTotal: number;
  dailySpending: Record<string, number>; // date string -> cents spent
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

// Generate 53 weeks of dates ending today, using real spending data
function generateYearGrid(dailySpending: Record<string, number>) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const grid: Array<{ date: Date; spending: number }[]> = [];
  
  // Calculate start: go back ~52 weeks, then align to start of that week (Sunday)
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 52 * 7);
  // Align to Sunday (start of week)
  const dayOfWeek = startDate.getDay();
  startDate.setDate(startDate.getDate() - dayOfWeek);
  
  const currentDate = new Date(startDate);
  
  for (let week = 0; week < 53; week++) {
    const weekDays: Array<{ date: Date; spending: number }> = [];
    for (let day = 0; day < 7; day++) {
      // Get date string in YYYY-MM-DD format
      const dateStr = currentDate.toISOString().split('T')[0];
      // Look up actual spending for this date
      const spending = dailySpending[dateStr] || 0;
      
      weekDays.push({
        date: new Date(currentDate),
        spending,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    grid.push(weekDays);
  }
  
  return grid;
}

function getSpendingLevel(spending: number): number {
  if (spending === 0) return 0;
  if (spending < 5000) return 1;  // < €50
  if (spending < 15000) return 2; // < €150
  if (spending < 30000) return 3; // < €300
  return 4; // >= €300
}

function getMonthLabels(grid: Array<{ date: Date; spending: number }[]>) {
  const months: { name: string; weekIndex: number }[] = [];
  let lastMonth = -1;
  
  grid.forEach((week, weekIdx) => {
    // Use first day of week for month label
    const firstDay = week[0];
    const month = firstDay.date.getMonth();
    if (month !== lastMonth) {
      months.push({
        name: firstDay.date.toLocaleDateString('en-US', { month: 'short' }),
        weekIndex: weekIdx,
      });
      lastMonth = month;
    }
  });
  
  return months;
}

// Less spending = darker (good/saved), More spending = lighter (warning)
// Level 0 = no spending (darkest), 4 = most spending (lightest)
const COLORS = ['#1A1A1A', '#4A4A4A', '#7A7A7A', '#B0B0B0', '#EBEDF0'];

export function SpendingActivityGrid({ yearlyTotal, dailySpending }: SpendingActivityGridProps) {
  const router = useRouter();
  const [hoveredCell, setHoveredCell] = useState<{ date: Date; spending: number } | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  
  // Memoize grid to prevent flickering on re-render
  const grid = useMemo(() => generateYearGrid(dailySpending), [dailySpending]);
  const monthLabels = useMemo(() => getMonthLabels(grid), [grid]);

  const handleMouseEnter = (cell: { date: Date; spending: number }, e: React.MouseEvent) => {
    setHoveredCell(cell);
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top - 8 });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleCellClick = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    router.push(`/transactions?date=${dateStr}`);
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="label-sm">SPENDING ACTIVITY</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Less</span>
            <div className="flex gap-[3px]">
              {['#1A1A1A', '#4A4A4A', '#7A7A7A', '#B0B0B0', '#EBEDF0'].map((color, i) => (
                <div 
                  key={i}
                  className="w-[10px] h-[10px] rounded-[2px]"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">More</span>
          </div>
        </div>

        {/* Grid with month labels */}
        <div className="flex gap-2">
          {/* Day labels - grid matching the activity rows */}
          <div className="grid grid-rows-7 gap-[2px] text-xs text-muted-foreground pr-2" style={{ marginTop: 20 }}>
            <div></div>
            <div className="flex items-center">Mon</div>
            <div></div>
            <div className="flex items-center">Wed</div>
            <div></div>
            <div className="flex items-center">Fri</div>
            <div></div>
          </div>
          
          {/* Activity Grid - Full Width */}
          <div className="flex-1">
            {/* Month labels */}
            <div className="flex mb-1">
              {monthLabels.map((month, i) => {
                const nextMonth = monthLabels[i + 1];
                const weeksInMonth = nextMonth 
                  ? nextMonth.weekIndex - month.weekIndex 
                  : 53 - month.weekIndex;
                return (
                  <span 
                    key={i}
                    className="text-xs text-muted-foreground"
                    style={{ flex: weeksInMonth }}
                  >
                    {month.name}
                  </span>
                );
              })}
            </div>
            
            {/* Grid cells - flex to fill width */}
            <div className="flex gap-[2px]">
              {grid.map((week, weekIdx) => (
                <div key={weekIdx} className="flex-1 flex flex-col gap-[2px]">
                  {week.map((day, dayIdx) => {
                    const level = getSpendingLevel(day.spending);
                    const isInFuture = day.date > new Date();
                    return (
                      <div
                        key={dayIdx}
                        className="aspect-square rounded-[2px] cursor-pointer transition-all hover:ring-2 hover:ring-[#10B981]/50"
                        style={{ 
                          backgroundColor: isInFuture ? 'transparent' : COLORS[level],
                          border: isInFuture ? '1px solid #E5E5E2' : 'none'
                        }}
                        onClick={() => !isInFuture && handleCellClick(day.date)}
                        onMouseEnter={(e) => !isInFuture && handleMouseEnter(day, e)}
                        onMouseLeave={() => setHoveredCell(null)}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tooltip */}
        {hoveredCell && (
          <div 
            className="fixed z-50 px-3 py-2 text-sm bg-[#1A1A1A] text-white rounded-lg shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full"
            style={{ left: tooltipPos.x, top: tooltipPos.y }}
          >
            {hoveredCell.spending === 0 
              ? `No spending on ${formatDate(hoveredCell.date)}`
              : <><PrivateAmount>{formatCurrency(hoveredCell.spending)}</PrivateAmount> spent on {formatDate(hoveredCell.date)}</>
            }
          </div>
        )}

        <div className="flex items-baseline gap-3 mt-4 pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">Total this year:</p>
          <p className="text-xl font-semibold tabular-nums">
            <PrivateAmount>{formatCurrency(yearlyTotal)}</PrivateAmount>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
