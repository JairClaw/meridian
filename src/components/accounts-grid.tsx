'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { PrivateAmount } from '@/components/private-amount';
import Link from 'next/link';

interface Account {
  id: number;
  name: string;
  type: string;
  currency: string;
  currentBalance: number;
  color: string | null;
  linkedToAccountId?: number | null;
  hideFromDashboard?: boolean;
}

interface AccountsGridProps {
  accounts: Account[];
}

// Colorful palette - purple, green, red, blue, orange
const CATEGORY_COLORS = [
  '#A855F7', // purple
  '#10B981', // green
  '#EF4444', // red
  '#3B82F6', // blue
  '#F97316', // orange
  '#14B8A6', // teal
  '#EC4899', // pink
  '#8B5CF6', // violet
  '#F59E0B', // amber
  '#6B7280', // gray
];

function formatCurrency(cents: number, currency = 'EUR') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
  account: Account;
  color: string;
}

// Squarified treemap algorithm
function squarifiedTreemap(
  items: Array<{ account: Account; value: number; color: string }>,
  x: number,
  y: number,
  width: number,
  height: number
): Rect[] {
  if (items.length === 0) return [];
  if (items.length === 1) {
    return [{
      x, y, width, height,
      account: items[0].account,
      color: items[0].color,
    }];
  }

  const total = items.reduce((sum, item) => sum + item.value, 0);
  
  // Sort by value descending
  const sorted = [...items].sort((a, b) => b.value - a.value);
  
  // Determine layout direction (lay out along shorter side)
  const isHorizontal = width >= height;
  const side = isHorizontal ? height : width;
  
  // Find the best split point
  let row: typeof sorted = [];
  let rowValue = 0;
  let remaining = [...sorted];
  
  const worstRatio = (row: typeof sorted, side: number, totalRowValue: number) => {
    if (row.length === 0) return Infinity;
    const rowArea = (totalRowValue / total) * width * height;
    const rowSide = rowArea / side;
    
    let worst = 0;
    for (const item of row) {
      const itemArea = (item.value / total) * width * height;
      const itemSide = itemArea / rowSide;
      const ratio = Math.max(rowSide / itemSide, itemSide / rowSide);
      worst = Math.max(worst, ratio);
    }
    return worst;
  };
  
  // Greedily add items to row while aspect ratio improves
  for (let i = 0; i < sorted.length; i++) {
    const item = sorted[i];
    const newRow = [...row, item];
    const newRowValue = rowValue + item.value;
    
    const currentWorst = worstRatio(row, side, rowValue);
    const newWorst = worstRatio(newRow, side, newRowValue);
    
    if (row.length === 0 || newWorst <= currentWorst) {
      row.push(item);
      rowValue = newRowValue;
      remaining = sorted.slice(i + 1);
    } else {
      break;
    }
  }
  
  // Layout the row
  const rowFraction = rowValue / total;
  const rects: Rect[] = [];
  
  if (isHorizontal) {
    const rowWidth = width * rowFraction;
    let currentY = y;
    
    for (const item of row) {
      const itemHeight = height * (item.value / rowValue);
      rects.push({
        x, y: currentY, width: rowWidth, height: itemHeight,
        account: item.account,
        color: item.color,
      });
      currentY += itemHeight;
    }
    
    // Recurse on remaining
    if (remaining.length > 0) {
      rects.push(...squarifiedTreemap(remaining, x + rowWidth, y, width - rowWidth, height));
    }
  } else {
    const rowHeight = height * rowFraction;
    let currentX = x;
    
    for (const item of row) {
      const itemWidth = width * (item.value / rowValue);
      rects.push({
        x: currentX, y, width: itemWidth, height: rowHeight,
        account: item.account,
        color: item.color,
      });
      currentX += itemWidth;
    }
    
    // Recurse on remaining
    if (remaining.length > 0) {
      rects.push(...squarifiedTreemap(remaining, x, y + rowHeight, width, height - rowHeight));
    }
  }
  
  return rects;
}

export function AccountsGrid({ accounts }: AccountsGridProps) {
  const [hoveredAccount, setHoveredAccount] = useState<Account | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  
  const gridSize = 25;
  
  // Liability types should be treated as negative for net value
  const LIABILITY_TYPES = ['mortgage', 'loan', 'credit_card'];
  
  const getNetBalance = (a: Account) => {
    const balance = a.currentBalance;
    // If it's a liability and stored as positive, make it negative
    if (LIABILITY_TYPES.includes(a.type) && balance > 0) {
      return -balance;
    }
    return balance;
  };

  // Prepare accounts with colors and absolute values for sizing
  // Group linked accounts together and sum their balances
  const accountsData = useMemo(() => {
    // First, build a map of parent accounts with their linked children's balances
    const parentAccounts = new Map<number, { account: Account; totalBalance: number }>();
    const linkedAccountIds = new Set<number>();
    
    // Find all linked accounts
    for (const account of accounts) {
      if (account.linkedToAccountId) {
        linkedAccountIds.add(account.id);
      }
    }
    
    // Process accounts
    for (const account of accounts) {
      // Skip hidden accounts
      if (account.hideFromDashboard) continue;
      
      // Skip accounts that are linked to another (they'll be summed into parent)
      if (account.linkedToAccountId) continue;
      
      // This is a parent account - sum any linked accounts (treating liabilities as negative)
      let totalBalance = getNetBalance(account);
      
      // Find accounts linked to this one and sum their balances
      for (const linkedAccount of accounts) {
        if (linkedAccount.linkedToAccountId === account.id) {
          totalBalance += getNetBalance(linkedAccount);
        }
      }
      
      parentAccounts.set(account.id, { account, totalBalance });
    }
    
    // Convert to array and filter/sort
    const data = Array.from(parentAccounts.values())
      .filter(({ totalBalance }) => totalBalance !== 0)
      .map(({ account, totalBalance }, idx) => ({
        account: { ...account, currentBalance: totalBalance },
        value: Math.abs(totalBalance),
        color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value);
    
    return data;
  }, [accounts]);
  
  // Generate treemap layout
  const layout = useMemo(() => {
    if (accountsData.length === 0) return [];
    return squarifiedTreemap(accountsData, 0, 0, gridSize, gridSize);
  }, [accountsData]);
  
  // Create a grid representation from the treemap rectangles
  const grid = useMemo(() => {
    const cells: Array<{ account: Account; color: string } | null> = Array(gridSize * gridSize).fill(null);
    
    for (const rect of layout) {
      const startX = Math.floor(rect.x);
      const startY = Math.floor(rect.y);
      const endX = Math.ceil(rect.x + rect.width);
      const endY = Math.ceil(rect.y + rect.height);
      
      for (let y = startY; y < endY && y < gridSize; y++) {
        for (let x = startX; x < endX && x < gridSize; x++) {
          const idx = y * gridSize + x;
          if (cells[idx] === null) {
            cells[idx] = { account: rect.account, color: rect.color };
          }
        }
      }
    }
    
    // Fill any remaining empty cells with the largest account
    if (accountsData.length > 0) {
      const largest = accountsData[0];
      for (let i = 0; i < cells.length; i++) {
        if (cells[i] === null) {
          cells[i] = { account: largest.account, color: largest.color };
        }
      }
    }
    
    return cells;
  }, [layout, accountsData]);
  
  // Total from processed accounts (after linking)
  const totalBalance = accountsData.reduce((sum, a) => sum + a.value, 0);
  
  const handleMouseEnter = (account: Account, e: React.MouseEvent) => {
    setHoveredAccount(account);
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top - 8 });
  };

  if (accountsData.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="label-sm">ACCOUNTS</p>
            <Link href="/accounts" className="text-sm text-[#10B981] hover:underline">
              View all →
            </Link>
          </div>
          <div className="text-center py-8 text-muted-foreground">
            No accounts with balance
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="label-sm">ACCOUNTS</p>
          <Link href="/accounts" className="text-sm text-[#10B981] hover:underline">
            View all →
          </Link>
        </div>
        
        {/* Grid */}
        <div 
          className="grid gap-[2px]"
          style={{ 
            gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
            aspectRatio: '1 / 1',
          }}
        >
          {grid.map((cell, idx) => (
            <div
              key={idx}
              className="rounded-[2px] transition-opacity cursor-pointer"
              style={{
                backgroundColor: cell ? cell.color : 'rgba(255,255,255,0.03)',
                opacity: hoveredAccount && cell?.account.id !== hoveredAccount.id ? 0.15 : 0.45,
              }}
              onMouseEnter={(e) => cell && handleMouseEnter(cell.account, e)}
              onMouseLeave={() => setHoveredAccount(null)}
            />
          ))}
        </div>
        
        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-border">
          {accountsData.map(({ account, value, color }) => {
            const percentage = totalBalance > 0 
              ? ((value / totalBalance) * 100).toFixed(0)
              : '0';
            return (
              <div 
                key={account.id} 
                className="flex items-center gap-2 text-sm cursor-pointer"
                onMouseEnter={(e) => handleMouseEnter(account, e)}
                onMouseLeave={() => setHoveredAccount(null)}
              >
                <div 
                  className="w-3 h-3 rounded-sm" 
                  style={{ backgroundColor: color }}
                />
                <span className="text-muted-foreground">{account.name}</span>
                <span className="tabular-nums">{percentage}%</span>
              </div>
            );
          })}
        </div>

        {/* Tooltip */}
        {hoveredAccount && (
          <div
            className="fixed z-50 px-3 py-2 text-sm bg-[#1A1A1A] text-white rounded-lg shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full"
            style={{ left: tooltipPos.x, top: tooltipPos.y }}
          >
            <p className="font-medium">{hoveredAccount.name}</p>
            <p className="text-muted-foreground capitalize">{hoveredAccount.type.replace('_', ' ')}</p>
            <p className={hoveredAccount.currentBalance >= 0 ? 'text-emerald-400' : 'text-red-400'}>
              <PrivateAmount>{formatCurrency(hoveredAccount.currentBalance, hoveredAccount.currency)}</PrivateAmount>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
