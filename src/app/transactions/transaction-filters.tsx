'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getCategories, createCategoryRule, applyCategorizationRules } from '@/lib/actions';
import type { Category, Transaction, Account } from '@/db/schema';

interface TransactionFiltersProps {
  transactions: Array<{ 
    transaction: Transaction; 
    account: Account | null; 
    category: Category | null;
  }>;
  categories: Category[];
  initialDate?: string;
}

export function TransactionFilters({ transactions, categories, initialDate }: TransactionFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [categoryFilter, setCategoryFilter] = useState<string>(searchParams.get('category') || 'all');
  const [dateFilter, setDateFilter] = useState<string>(initialDate || '');
  const [ruleForTxId, setRuleForTxId] = useState<number | null>(null);
  const [rulePattern, setRulePattern] = useState('');
  const [ruleCategoryId, setRuleCategoryId] = useState('');
  const [creating, setCreating] = useState(false);

  // Filter transactions
  const filteredTransactions = transactions.filter(({ transaction, category }) => {
    // Date filter - compare just the date part (handles timestamps like "2026-01-03 13:15:08")
    if (dateFilter && !transaction.date.startsWith(dateFilter)) return false;
    // Category filter
    if (categoryFilter === 'all') return true;
    if (categoryFilter === 'uncategorized') return !category;
    return category?.id.toString() === categoryFilter;
  });

  // Group by date
  const groupedByDate = filteredTransactions.reduce((acc, item) => {
    const date = item.transaction.date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(item);
    return acc;
  }, {} as Record<string, typeof filteredTransactions>);

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value);
    setRuleForTxId(null);
  };

  const handleStartRule = (txId: number, merchant: string | null, description: string) => {
    setRuleForTxId(txId);
    // Use merchant if available, otherwise first part of description
    setRulePattern(merchant || description.split(/[-\/]/)[0].trim());
    setRuleCategoryId('');
  };

  const handleCreateRule = async () => {
    if (!rulePattern || !ruleCategoryId) return;
    setCreating(true);
    try {
      await createCategoryRule({
        pattern: rulePattern,
        categoryId: parseInt(ruleCategoryId),
        matchType: 'contains',
      });
      // Apply rules to categorize matching transactions
      await applyCategorizationRules();
      setRuleForTxId(null);
      setRulePattern('');
      setRuleCategoryId('');
      router.refresh();
    } finally {
      setCreating(false);
    }
  };

  const formatCurrency = (cents: number, currency = 'EUR') => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const uncategorizedCount = transactions.filter(t => !t.category).length;

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm text-muted-foreground">Filter:</span>
        
        {/* Date filter pill */}
        {dateFilter && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#10B981]/10 text-[#10B981] text-sm font-medium">
            <span>📅 {formatDate(dateFilter)}</span>
            <button 
              onClick={() => {
                setDateFilter('');
                router.push('/transactions');
              }}
              className="hover:bg-[#10B981]/20 rounded-full p-0.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        
        <Select value={categoryFilter} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            <SelectItem value="uncategorized">
              ⚪ Uncategorized ({uncategorizedCount})
            </SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id.toString()}>
                {cat.icon} {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <span className="text-sm text-muted-foreground">
          {filteredTransactions.length} transactions
        </span>
      </div>

      {/* Transactions List */}
      {sortedDates.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No transactions found</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((date) => (
            <div key={date}>
              <p className="text-sm font-medium text-muted-foreground mb-3">
                {formatDate(date)}
              </p>
              <div className="space-y-2">
                {groupedByDate[date].map(({ transaction, account, category }) => (
                  <div key={transaction.id}>
                    <div 
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                          {category?.icon || (
                            <span className="text-muted-foreground text-lg">?</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">
                            {transaction.merchant || transaction.description}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{account?.name}</span>
                            {category ? (
                              <Badge variant="outline" className="text-xs">
                                {category.name}
                              </Badge>
                            ) : (
                              <button
                                onClick={() => handleStartRule(transaction.id, transaction.merchant, transaction.description)}
                                className="inline-flex items-center gap-1 text-xs text-yellow-500 border border-yellow-500/50 rounded px-2 py-0.5 hover:bg-yellow-500/10 transition-colors"
                              >
                                <span>💡</span> Create rule
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      <p className={`font-semibold tabular-nums flex-shrink-0 ${
                        transaction.amountCents > 0 ? 'text-emerald-500' : ''
                      }`}>
                        {transaction.amountCents > 0 ? '+' : ''}
                        {formatCurrency(transaction.amountCents, transaction.currency)}
                      </p>
                    </div>
                    
                    {/* Inline rule creator for this transaction */}
                    {ruleForTxId === transaction.id && (
                      <div className="ml-14 mr-4 mb-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                        <div className="flex gap-3 items-end flex-wrap">
                          <div className="space-y-1 flex-1 min-w-32">
                            <label className="text-xs text-muted-foreground">Pattern</label>
                            <Input
                              value={rulePattern}
                              onChange={(e) => setRulePattern(e.target.value)}
                              className="h-8"
                            />
                          </div>
                          <div className="space-y-1 w-40">
                            <label className="text-xs text-muted-foreground">Category</label>
                            <Select value={ruleCategoryId} onValueChange={setRuleCategoryId}>
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                              <SelectContent>
                                {categories.map((cat) => (
                                  <SelectItem key={cat.id} value={cat.id.toString()}>
                                    {cat.icon} {cat.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8"
                            onClick={() => setRuleForTxId(null)}
                          >
                            Cancel
                          </Button>
                          <Button 
                            size="sm"
                            className="h-8 bg-gold-500 text-navy-950 hover:bg-gold-400"
                            disabled={!rulePattern || !ruleCategoryId || creating}
                            onClick={handleCreateRule}
                          >
                            {creating ? '...' : 'Create'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
