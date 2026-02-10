'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
} from '@/lib/actions';
import type { Category, CategoryRule } from '@/db/schema';

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
  const [open, setOpen] = useState(false);
  const [recOpen, setRecOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applyResult, setApplyResult] = useState<{ categorized: number; total: number } | null>(null);
  const [formData, setFormData] = useState({
    pattern: '',
    categoryId: '',
    matchType: 'contains',
  });

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
      
      setOpen(false);
      setFormData({ pattern: '', categoryId: '', matchType: 'contains' });
      loadData();
    } catch (error) {
      console.error('Failed to create rule:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Delete this rule?')) {
      await deleteCategoryRule(id);
      loadData();
    }
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

  const handleCreateFromRec = async (pattern: string) => {
    setFormData({ ...formData, pattern });
    setRecOpen(false);
    setOpen(true);
  };

  const formatCurrency = (cents: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(cents / 100);

  return (
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
              <Dialog open={recOpen} onOpenChange={setRecOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <span className="text-yellow-500">💡</span>
                    {recommendations.length} suggestions
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="font-display">Suggested Rules</DialogTitle>
                    <DialogDescription>
                      Based on your uncategorized transactions
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3 mt-4">
                    {recommendations.map((rec, i) => (
                      <div 
                        key={i}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{rec.pattern}</p>
                          <p className="text-sm text-muted-foreground">
                            {rec.count} transactions • {formatCurrency(rec.totalCents)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            e.g. {rec.examples[0]}
                          </p>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleCreateFromRec(rec.pattern)}
                        >
                          Create Rule
                        </Button>
                      </div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            )}
            
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  Add Rule
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-display">Add Categorization Rule</DialogTitle>
                  <DialogDescription>
                    Transactions matching this pattern will be auto-categorized
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Pattern *</label>
                    <Input
                      placeholder="e.g., Carrefour, NETFLIX, honest greens"
                      value={formData.pattern}
                      onChange={(e) => setFormData({ ...formData, pattern: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Category *</label>
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
                      <label className="text-sm font-medium">Match Type</label>
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
                  
                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={loading || !formData.pattern || !formData.categoryId}
                      className="bg-gold-500 text-navy-950 hover:bg-gold-400"
                    >
                      {loading ? 'Creating...' : 'Create Rule'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
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
                <div className="flex items-center gap-3">
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
  );
}
