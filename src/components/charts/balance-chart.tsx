'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface BalanceChartProps {
  data: Array<{
    name: string;
    balance: number;
    type: string;
  }>;
}

const typeColors: Record<string, string> = {
  checking: '#3B82F6',
  savings: '#10B981',
  investment: '#8B5CF6',
  credit_card: '#F97316',
  cash: '#22C55E',
  mortgage: '#EF4444',
  loan: '#F59E0B',
};

export function BalanceChart({ data }: BalanceChartProps) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} horizontal={false} />
        <XAxis 
          type="number"
          stroke="#6B7280" 
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `€${(value / 100 / 1000).toFixed(0)}k`}
        />
        <YAxis 
          type="category"
          dataKey="name"
          stroke="#6B7280" 
          fontSize={12}
          tickLine={false}
          axisLine={false}
          width={100}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1F2937',
            border: '1px solid #374151',
            borderRadius: '8px',
            fontSize: '12px',
          }}
          formatter={(value) => [`€${((value as number) / 100).toFixed(2)}`, 'Balance']}
        />
        <Bar dataKey="balance" radius={[0, 4, 4, 0]}>
          {data.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={typeColors[entry.type] || '#6B7280'} 
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
