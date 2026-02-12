'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { deleteRecurringRule, updateRecurringRule } from '@/lib/actions';
import type { RecurringRule, Account, Category } from '@/db/schema';

interface SubscriptionCardProps {
  rule: RecurringRule;
  account: Account | null;
  category: Category | null;
  categories: Category[];
  accounts: Account[];
}

const frequencyLabels: Record<string, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

function formatCurrency(cents: number, currency = 'EUR') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

export function SubscriptionCard({ rule, account, category, categories, accounts }: SubscriptionCardProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState({
    name: rule.name,
    amount: (Math.abs(rule.amountCents) / 100).toFixed(2),
    frequency: rule.frequency,
    nextDate: rule.nextDate,
    categoryId: rule.categoryId?.toString() || '',
    accountId: rule.accountId.toString(),
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateRecurringRule(rule.id, {
        name: formData.name,
        amountCents: Math.round(parseFloat(formData.amount) * -100),
        frequency: formData.frequency,
        nextDate: formData.nextDate,
        categoryId: formData.categoryId ? parseInt(formData.categoryId) : null,
        accountId: parseInt(formData.accountId),
      });
      setIsEditing(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this subscription?')) return;
    setDeleting(true);
    try {
      await deleteRecurringRule(rule.id);
      router.refresh();
    } finally {
      setDeleting(false);
    }
  };

  if (isEditing) {
    return (
      <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-4">
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
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Next Date</label>
            <Input
              type="date"
              value={formData.nextDate}
              onChange={(e) => setFormData({ ...formData, nextDate: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Account</label>
            <Select
              value={formData.accountId}
              onValueChange={(v) => setFormData({ ...formData, accountId: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id.toString()}>
                    {acc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 col-span-2">
            <label className="text-xs text-muted-foreground">Category</label>
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
        </div>
        <div className="flex justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-gold-500 text-navy-950 hover:bg-gold-400"
              onClick={handleSave}
              disabled={saving || !formData.name || !formData.amount}
            >
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer group"
      onClick={() => setIsEditing(true)}
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gold-500/10 flex items-center justify-center text-xl">
          {category?.icon || '📱'}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium">{rule.name}</p>
            <Badge variant="outline" className="text-xs">
              {frequencyLabels[rule.frequency] || rule.frequency}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {account?.name || 'Unknown account'}
            {category && ` • ${category.name}`}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-lg font-semibold tabular-nums">
          {formatCurrency(Math.abs(rule.amountCents), rule.currency)}
        </p>
        <p className="text-xs text-muted-foreground">
          Next: {rule.nextDate}
        </p>
      </div>
    </div>
  );
}
