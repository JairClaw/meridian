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
import { getCategories, createCategoryRule } from '@/lib/actions';
import type { Category, Transaction, Account } from '@/db/schema';

interface TransactionFiltersProps {
  transactions: Array<{ 
    transaction: Transaction; 
    account: Account | null; 
    category: Category | null;
  }>;
  categories: Category[];
}

export function TransactionFilters({ transactions, categories }: TransactionFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [categoryFilter, setCategoryFilter] = useState<string>(searchParams.get('category') || 'all');
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [rulePattern, setRulePattern] = useState('');
  const [ruleCategoryId, setRuleCategoryId] = useState('');
  const [creating, setCreating] = useState(false);

  // Filter transactions
  const filteredTransactions = transactions.filter(({ category }) => {
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
    setShowRuleForm(false);
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
      setShowRuleForm(false);
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

      {/* Quick Rule Creator for Uncategorized */}
      {categoryFilter === 'uncategorized' && uncategorizedCount > 0 && (
        <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
          {!showRuleForm ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-yellow-500">💡 Create a rule to auto-categorize</p>
                <p className="text-sm text-muted-foreground">
                  Set up patterns to automatically categorize similar transactions
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowRuleForm(true)}
              >
                Create Rule
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-medium">Quick Rule</p>
              <div className="flex gap-3 items-end flex-wrap">
                <div className="space-y-1 flex-1 min-w-48">
                  <label className="text-xs text-muted-foreground">Pattern (e.g., merchant name)</label>
                  <Input
                    placeholder="Carrefour, Netflix, etc."
                    value={rulePattern}
                    onChange={(e) => setRulePattern(e.target.value)}
                  />
                </div>
                <div className="space-y-1 w-48">
                  <label className="text-xs text-muted-foreground">Category</label>
                  <Select value={ruleCategoryId} onValueChange={setRuleCategoryId}>
                    <SelectTrigger>
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
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowRuleForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    size="sm"
                    disabled={!rulePattern || !ruleCategoryId || creating}
                    onClick={handleCreateRule}
                    className="bg-gold-500 text-navy-950 hover:bg-gold-400"
                  >
                    {creating ? '...' : 'Create & Apply'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

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
                  <div 
                    key={transaction.id}
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
                            <Badge variant="outline" className="text-xs text-yellow-500 border-yellow-500/50">
                              Uncategorized
                            </Badge>
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
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
