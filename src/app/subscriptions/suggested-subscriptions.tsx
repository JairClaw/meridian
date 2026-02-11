'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { getSuggestedSubscriptions, createRecurringRule, getCategories } from '@/lib/actions';
import type { Category } from '@/db/schema';

const frequencyLabels: Record<string, string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

export function SuggestedSubscriptions() {
  const router = useRouter();
  const [suggestions, setSuggestions] = useState<Array<{
    merchant: string;
    avgAmount: number;
    frequency: string;
    confidence: number;
    occurrences: number;
    accountId: number;
  }>>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    frequency: 'monthly',
    categoryId: '',
    accountId: '',
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    Promise.all([getSuggestedSubscriptions(), getCategories()]).then(([sug, cat]) => {
      setSuggestions(sug);
      setCategories(cat);
    });
  }, []);

  const handleExpand = (index: number, suggestion: typeof suggestions[0]) => {
    if (expandedIndex === index) {
      setExpandedIndex(null);
      return;
    }
    setExpandedIndex(index);
    setFormData({
      name: suggestion.merchant,
      amount: (suggestion.avgAmount / 100).toFixed(2),
      frequency: suggestion.frequency,
      categoryId: '',
      accountId: suggestion.accountId.toString(),
    });
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.amount || !formData.accountId) return;
    setCreating(true);
    try {
      await createRecurringRule({
        name: formData.name,
        accountId: parseInt(formData.accountId),
        amountCents: Math.round(parseFloat(formData.amount) * -100),
        frequency: formData.frequency,
        startDate: new Date().toISOString().split('T')[0],
        categoryId: formData.categoryId ? parseInt(formData.categoryId) : undefined,
      });
      setExpandedIndex(null);
      // Refresh suggestions
      const newSuggestions = await getSuggestedSubscriptions();
      setSuggestions(newSuggestions);
      router.refresh();
    } finally {
      setCreating(false);
    }
  };

  const formatCurrency = (cents: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(cents / 100);

  if (suggestions.length === 0) return null;

  return (
    <div className="space-y-4">
      <Button
        variant="outline"
        className="gap-2"
        onClick={() => setShowSuggestions(!showSuggestions)}
      >
        <span className="text-yellow-500">💡</span>
        {showSuggestions ? 'Hide suggestions' : `${suggestions.length} potential subscriptions found`}
      </Button>

      {showSuggestions && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">💡 Suggested Subscriptions</CardTitle>
            <CardDescription>Based on recurring patterns in your transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {suggestions.map((sug, i) => (
                <div key={i}>
                  <div
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                      expandedIndex === i
                        ? 'bg-muted/70 border border-border'
                        : 'bg-muted/30 hover:bg-muted/50'
                    }`}
                    onClick={() => handleExpand(i, sug)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`transition-transform ${expandedIndex === i ? 'rotate-90' : ''}`}>
                        ▶
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{sug.merchant}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="outline" className="text-xs">
                            {frequencyLabels[sug.frequency]}
                          </Badge>
                          <span>{sug.occurrences} occurrences</span>
                          <span>•</span>
                          <span>{Math.round(sug.confidence * 100)}% match</span>
                        </div>
                      </div>
                    </div>
                    <p className="font-semibold tabular-nums">
                      {formatCurrency(sug.avgAmount)}
                    </p>
                  </div>

                  {expandedIndex === i && (
                    <div className="ml-5 mt-2 mb-4 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                      <p className="text-sm font-medium mb-3">Add as subscription</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="space-y-1 col-span-2">
                          <label className="text-xs text-muted-foreground">Name</label>
                          <Input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground">Amount</label>
                          <Input
                            type="number"
                            step="0.01"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground">Frequency</label>
                          <Select
                            value={formData.frequency}
                            onValueChange={(v) => setFormData({ ...formData, frequency: v })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="yearly">Yearly</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1 col-span-2">
                          <label className="text-xs text-muted-foreground">Category (optional)</label>
                          <Select
                            value={formData.categoryId}
                            onValueChange={(v) => setFormData({ ...formData, categoryId: v })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.filter(c => !c.isIncome).map((cat) => (
                                <SelectItem key={cat.id} value={cat.id.toString()}>
                                  {cat.icon} {cat.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2 flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedIndex(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            className="bg-gold-500 text-navy-950 hover:bg-gold-400"
                            disabled={!formData.name || !formData.amount || creating}
                            onClick={handleCreate}
                          >
                            {creating ? '...' : 'Add Subscription'}
                          </Button>
                        </div>
                      </div>
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
