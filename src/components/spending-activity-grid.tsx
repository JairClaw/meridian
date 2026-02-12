'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface SpendingActivityGridProps {
  yearlyTotal: number;
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

// Seeded random for consistent results
function seededRandom(seed: number) {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
}

// Generate 53 weeks of dates ending today
function generateYearGrid() {
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
      // Use date as seed for consistent random
      const seed = currentDate.getFullYear() * 10000 + (currentDate.getMonth() + 1) * 100 + currentDate.getDate();
      const rand = seededRandom(seed);
      const spending = rand < 0.25 ? 0 : Math.floor(rand * 50000);
      
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

// Inverted: Less spending = darker (good), More spending = lighter (warning)
const COLORS = ['#EBEDF0', '#1A1A1A', '#4A4A4A', '#8C8C8C', '#C6C6C6'];

export function SpendingActivityGrid({ yearlyTotal }: SpendingActivityGridProps) {
  const [hoveredCell, setHoveredCell] = useState<{ date: Date; spending: number } | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  
  // Memoize grid to prevent flickering on re-render
  const grid = useMemo(() => generateYearGrid(), []);
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

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="label-sm">SPENDING ACTIVITY</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Less</span>
            <div className="flex gap-[3px]">
              {['#EBEDF0', '#1A1A1A', '#4A4A4A', '#8C8C8C', '#C6C6C6'].map((color, i) => (
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

        {/* Month labels */}
        <div className="relative ml-8 mb-2 h-4">
          {monthLabels.map((month, i) => (
            <span 
              key={i}
              className="absolute text-xs text-muted-foreground"
              style={{ left: `${(month.weekIndex / 53) * 100}%` }}
            >
              {month.name}
            </span>
          ))}
        </div>

        {/* Grid */}
        <div className="flex gap-2">
          {/* Day labels */}
          <div className="flex flex-col justify-around text-xs text-muted-foreground pr-1" style={{ height: 82 }}>
            <span>Mon</span>
            <span>Wed</span>
            <span>Fri</span>
          </div>
          
          {/* Activity Grid */}
          <div className="flex-1 overflow-x-auto">
            <div className="flex gap-[3px]" style={{ width: 'max-content' }}>
              {grid.map((week, weekIdx) => (
                <div key={weekIdx} className="flex flex-col gap-[3px]">
                  {week.map((day, dayIdx) => {
                    const level = getSpendingLevel(day.spending);
                    const isInFuture = day.date > new Date();
                    return (
                      <div
                        key={dayIdx}
                        className="w-[10px] h-[10px] rounded-[2px] cursor-pointer transition-all hover:ring-2 hover:ring-offset-1 hover:ring-[#1A1A1A]/30"
                        style={{ 
                          backgroundColor: isInFuture ? 'transparent' : COLORS[level],
                          border: isInFuture ? '1px solid #E5E5E2' : 'none'
                        }}
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
              : `${formatCurrency(hoveredCell.spending)} spent on ${formatDate(hoveredCell.date)}`
            }
          </div>
        )}

        <div className="flex items-baseline gap-3 mt-4 pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">Total this year:</p>
          <p className="text-xl font-semibold tabular-nums">
            {formatCurrency(yearlyTotal)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
