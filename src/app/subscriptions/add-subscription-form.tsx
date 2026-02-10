'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createRecurringRule, getAccounts, getCategories } from '@/lib/actions';
import type { Account, Category } from '@/db/schema';

const frequencies = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

export function AddSubscriptionForm() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    accountId: '',
    amount: '',
    frequency: 'monthly',
    startDate: new Date().toISOString().split('T')[0],
    categoryId: '',
  });

  useEffect(() => {
    Promise.all([getAccounts(), getCategories()]).then(([acc, cat]) => {
      setAccounts(acc);
      setCategories(cat);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await createRecurringRule({
        name: formData.name,
        accountId: parseInt(formData.accountId),
        amountCents: Math.round(parseFloat(formData.amount) * -100), // Subscriptions are expenses
        frequency: formData.frequency,
        startDate: formData.startDate,
        categoryId: formData.categoryId ? parseInt(formData.categoryId) : undefined,
      });
      
      setIsOpen(false);
      setFormData({
        name: '',
        accountId: formData.accountId,
        amount: '',
        frequency: 'monthly',
        startDate: new Date().toISOString().split('T')[0],
        categoryId: '',
      });
      router.refresh();
    } catch (error) {
      console.error('Failed to create subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <Button 
        onClick={() => setIsOpen(true)}
        className="bg-gold-500 text-navy-950 hover:bg-gold-400"
      >
        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Add Subscription
      </Button>
    );
  }

  const expenseCategories = categories.filter(c => !c.isIncome);

  return (
    <form onSubmit={handleSubmit} className="p-4 rounded-lg bg-muted/50 border border-border space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-medium">New Subscription</p>
        <Button 
          type="button" 
          variant="ghost" 
          size="sm"
          onClick={() => setIsOpen(false)}
        >
          Cancel
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Name *</label>
          <Input
            placeholder="e.g., Netflix, Spotify"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Account *</label>
          <Select
            value={formData.accountId}
            onValueChange={(value) => setFormData({ ...formData, accountId: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select account" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id.toString()}>
                  {account.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Amount *</label>
          <Input
            type="number"
            step="0.01"
            placeholder="9.99"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            required
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Frequency *</label>
          <Select
            value={formData.frequency}
            onValueChange={(value) => setFormData({ ...formData, frequency: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {frequencies.map((freq) => (
                <SelectItem key={freq.value} value={freq.value}>
                  {freq.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Start Date *</label>
          <Input
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            required
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Category</label>
          <Select
            value={formData.categoryId}
            onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {expenseCategories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id.toString()}>
                  {cat.icon} {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="flex justify-end">
        <Button 
          type="submit" 
          disabled={loading || !formData.name || !formData.accountId || !formData.amount}
          className="bg-gold-500 text-navy-950 hover:bg-gold-400"
        >
          {loading ? 'Adding...' : 'Add Subscription'}
        </Button>
      </div>
    </form>
  );
}
