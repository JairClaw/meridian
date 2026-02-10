'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  getCategoryRules, 
  getCategories, 
  createCategoryRule, 
  deleteCategoryRule,
  applyCategorizationRules,
  getCategoryRecommendations,
  getTransactionsMatchingPattern,
} from '@/lib/actions';
import type { Category, CategoryRule, Transaction, Account } from '@/db/schema';

const matchTypes = [
  { value: 'contains', label: 'Contains' },
  { value: 'starts_with', label: 'Starts with' },
  { value: 'exact', label: 'Exact match' },
  { value: 'regex', label: 'Regex' },
];

export function CategoryRulesManager() {
  const [rules, setRules] = useState<Array<{ rule: CategoryRule; category: Category | null }>>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [recommendations, setRecommendations] = useState<Array<{
    pattern: string;
    count: number;
    totalCents: number;
    examples: string[];
  }>>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applyResult, setApplyResult] = useState<{ categorized: number; total: number } | null>(null);
  const [formData, setFormData] = useState({
    pattern: '',
    categoryId: '',
    matchType: 'contains',
  });
  const [expandedPattern, setExpandedPattern] = useState<string | null>(null);
  const [matchingTxs, setMatchingTxs] = useState<Array<{ transaction: Transaction; account: Account | null }>>([]);
  const [loadingTxs, setLoadingTxs] = useState(false);

  const loadData = async () => {
    const [rulesData, categoriesData, recsData] = await Promise.all([
      getCategoryRules(),
      getCategories(),
      getCategoryRecommendations(),
    ]);
    setRules(rulesData);
    setCategories(categoriesData);
    setRecommendations(recsData);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await createCategoryRule({
        pattern: formData.pattern,
        categoryId: parseInt(formData.categoryId),
        matchType: formData.matchType,
      });
      
      setShowAddForm(false);
      setFormData({ pattern: '', categoryId: '', matchType: 'contains' });
      setExpandedPattern(null);
      loadData();
    } catch (error) {
      console.error('Failed to create rule:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    await deleteCategoryRule(id);
    loadData();
  };

  const handleApplyRules = async () => {
    setApplying(true);
    try {
      const result = await applyCategorizationRules();
      setApplyResult(result);
      loadData();
    } finally {
      setApplying(false);
    }
  };

  const handleCreateFromRec = (pattern: string) => {
    setFormData({ ...formData, pattern });
    setShowSuggestions(false);
    setShowAddForm(true);
    setExpandedPattern(null);
  };

  const handleExpandPattern = async (pattern: string) => {
    if (expandedPattern === pattern) {
      setExpandedPattern(null);
      setMatchingTxs([]);
      return;
    }
    
    setExpandedPattern(pattern);
    setLoadingTxs(true);
    try {
      const txs = await getTransactionsMatchingPattern(pattern);
      setMatchingTxs(txs);
    } finally {
      setLoadingTxs(false);
    }
  };

  const formatCurrency = (cents: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(cents / 100);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-6" id="rules">
      {/* Main Rules Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-display">Auto-Categorization Rules</CardTitle>
              <CardDescription>
                {rules.length} rules • Automatically categorize transactions
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {recommendations.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                  onClick={() => setShowSuggestions(!showSuggestions)}
                >
                  <span className="text-yellow-500">💡</span>
                  {showSuggestions ? 'Hide' : `${recommendations.length} suggestions`}
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowAddForm(!showAddForm)}
              >
                {showAddForm ? 'Cancel' : 'Add Rule'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Inline Add Form */}
          {showAddForm && (
            <form onSubmit={handleSubmit} className="p-4 rounded-lg bg-muted/50 border border-border space-y-4">
              <p className="text-sm font-medium">New Categorization Rule</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Pattern</label>
                  <Input
                    placeholder="e.g., Carrefour"
                    value={formData.pattern}
                    onChange={(e) => setFormData({ ...formData, pattern: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Category</label>
                  <Select
                    value={formData.categoryId}
                    onValueChange={(v) => setFormData({ ...formData, categoryId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
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
                
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Match Type</label>
                  <Select
                    value={formData.matchType}
                    onValueChange={(v) => setFormData({ ...formData, matchType: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {matchTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={loading || !formData.pattern || !formData.categoryId}
                  className="bg-gold-500 text-navy-950 hover:bg-gold-400"
                >
                  {loading ? 'Creating...' : 'Create Rule'}
                </Button>
              </div>
            </form>
          )}

          {/* Apply Rules Button */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
            <div>
              <p className="font-medium">Apply Rules to Uncategorized</p>
              <p className="text-sm text-muted-foreground">
                Run all rules against transactions without categories
              </p>
              {applyResult && (
                <p className="text-sm text-emerald-500 mt-1">
                  ✓ Categorized {applyResult.categorized} of {applyResult.total} transactions
                </p>
              )}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleApplyRules}
              disabled={applying}
            >
              {applying ? 'Applying...' : 'Apply Rules'}
            </Button>
          </div>

          {/* Rules List */}
          {rules.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No rules yet. Add a rule or check the suggestions!
            </p>
          ) : (
            <div className="space-y-2">
              {rules.map(({ rule, category }) => (
                <div 
                  key={rule.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 group"
                >
                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge variant="outline" className="font-mono">
                      {rule.pattern}
                    </Badge>
                    <span className="text-muted-foreground">→</span>
                    <Badge variant="secondary">
                      {category?.icon} {category?.name}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      ({rule.matchType})
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                    onClick={() => handleDelete(rule.id)}
                  >
                    Delete
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Suggestions Section */}
      {showSuggestions && recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">💡 Suggested Rules</CardTitle>
            <CardDescription>Click a pattern to see matching transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recommendations.map((rec, i) => (
                <div key={i}>
                  <div 
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                      expandedPattern === rec.pattern 
                        ? 'bg-muted/70 border border-border' 
                        : 'bg-muted/30 hover:bg-muted/50'
                    }`}
                    onClick={() => handleExpandPattern(rec.pattern)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`transition-transform ${expandedPattern === rec.pattern ? 'rotate-90' : ''}`}>
                          ▶
                        </span>
                        <p className="font-medium truncate">{rec.pattern}</p>
                      </div>
                      <p className="text-sm text-muted-foreground ml-5">
                        {rec.count} transactions • {formatCurrency(rec.totalCents)}
                      </p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCreateFromRec(rec.pattern);
                      }}
                    >
                      Create Rule
                    </Button>
                  </div>
                  
                  {/* Expanded transactions list */}
                  {expandedPattern === rec.pattern && (
                    <div className="ml-5 mt-2 mb-4 border-l-2 border-border pl-4 space-y-1">
                      {loadingTxs ? (
                        <p className="text-sm text-muted-foreground py-2">Loading...</p>
                      ) : matchingTxs.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-2">No matching transactions</p>
                      ) : (
                        matchingTxs.slice(0, 10).map(({ transaction, account }) => (
                          <div 
                            key={transaction.id}
                            className="flex items-center justify-between py-1.5 text-sm"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="text-muted-foreground w-16 flex-shrink-0">
                                {formatDate(transaction.date)}
                              </span>
                              <span className="truncate">
                                {transaction.merchant || transaction.description}
                              </span>
                            </div>
                            <span className={`tabular-nums flex-shrink-0 ${
                              transaction.amountCents < 0 ? '' : 'text-emerald-500'
                            }`}>
                              {formatCurrency(transaction.amountCents)}
                            </span>
                          </div>
                        ))
                      )}
                      {matchingTxs.length > 10 && (
                        <p className="text-xs text-muted-foreground pt-1">
                          + {matchingTxs.length - 10} more transactions
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
