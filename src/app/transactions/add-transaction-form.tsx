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
import { createTransaction, getCategories } from '@/lib/actions';
import type { Account, Category } from '@/db/schema';

interface AddTransactionFormProps {
  accounts: Account[];
}

export function AddTransactionForm({ accounts }: AddTransactionFormProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    accountId: '',
    date: new Date().toISOString().split('T')[0],
    amount: '',
    type: 'expense',
    description: '',
    merchant: '',
    categoryId: '',
  });

  useEffect(() => {
    getCategories().then(setCategories);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const amount = parseFloat(formData.amount);
      const amountCents = Math.round(Math.abs(amount) * 100) * (formData.type === 'expense' ? -1 : 1);
      
      await createTransaction({
        accountId: parseInt(formData.accountId),
        date: formData.date,
        amountCents,
        description: formData.description,
        merchant: formData.merchant || undefined,
        categoryId: formData.categoryId ? parseInt(formData.categoryId) : undefined,
        currency: accounts.find(a => a.id === parseInt(formData.accountId))?.currency || 'EUR',
      });
      
      setIsOpen(false);
      setFormData({
        accountId: formData.accountId, // Keep the account selected
        date: new Date().toISOString().split('T')[0],
        amount: '',
        type: 'expense',
        description: '',
        merchant: '',
        categoryId: '',
      });
      router.refresh();
    } catch (error) {
      console.error('Failed to create transaction:', error);
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
        Add Transaction
      </Button>
    );
  }

  const expenseCategories = categories.filter(c => !c.isIncome);
  const incomeCategories = categories.filter(c => c.isIncome);
  const relevantCategories = formData.type === 'expense' ? expenseCategories : incomeCategories;

  return (
    <form onSubmit={handleSubmit} className="p-4 rounded-lg bg-muted/50 border border-border space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-medium">New Transaction</p>
        <Button 
          type="button" 
          variant="ghost" 
          size="sm"
          onClick={() => setIsOpen(false)}
        >
          Cancel
        </Button>
      </div>
      
      {/* Type Toggle */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant={formData.type === 'expense' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFormData({ ...formData, type: 'expense', categoryId: '' })}
          className={formData.type === 'expense' ? 'bg-rose-500 hover:bg-rose-600' : ''}
        >
          Expense
        </Button>
        <Button
          type="button"
          variant={formData.type === 'income' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFormData({ ...formData, type: 'income', categoryId: '' })}
          className={formData.type === 'income' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
        >
          Income
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
          <label className="text-xs text-muted-foreground">Date *</label>
          <Input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Amount *</label>
          <Input
            type="number"
            step="0.01"
            placeholder="0.00"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
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
              {relevantCategories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id.toString()}>
                  {cat.icon} {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2 md:col-span-2">
          <label className="text-xs text-muted-foreground">Description *</label>
          <Input
            placeholder="What was this for?"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
          />
        </div>
        
        <div className="space-y-2 md:col-span-2">
          <label className="text-xs text-muted-foreground">Merchant</label>
          <Input
            placeholder="e.g., Amazon, Carrefour"
            value={formData.merchant}
            onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
          />
        </div>
      </div>
      
      <div className="flex justify-end">
        <Button 
          type="submit" 
          disabled={loading || !formData.accountId || !formData.amount || !formData.description}
          className="bg-gold-500 text-navy-950 hover:bg-gold-400"
        >
          {loading ? 'Adding...' : 'Add Transaction'}
        </Button>
      </div>
    </form>
  );
}
