'use client';

import { useState } from 'react';
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
import { createAccount } from '@/lib/actions';

const accountTypes = [
  { value: 'checking', label: 'Checking' },
  { value: 'savings', label: 'Savings' },
  { value: 'investment', label: 'Investment' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'cash', label: 'Cash' },
  { value: 'mortgage', label: 'Mortgage' },
  { value: 'loan', label: 'Loan' },
];

const currencies = [
  { value: 'EUR', label: 'EUR' },
  { value: 'USD', label: 'USD' },
  { value: 'GBP', label: 'GBP' },
  { value: 'CHF', label: 'CHF' },
  { value: 'BTC', label: 'BTC' },
];

interface AddAccountFormProps {
  variant?: 'button' | 'inline';
}

export function AddAccountForm({ variant = 'button' }: AddAccountFormProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'checking',
    currency: 'EUR',
    institution: '',
    currentBalance: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await createAccount({
        name: formData.name,
        type: formData.type,
        currency: formData.currency,
        institution: formData.institution || undefined,
        currentBalance: formData.currentBalance 
          ? Math.round(parseFloat(formData.currentBalance) * 100)
          : 0,
      });
      
      setIsOpen(false);
      setFormData({
        name: '',
        type: 'checking',
        currency: 'EUR',
        institution: '',
        currentBalance: '',
      });
      router.refresh();
    } catch (error) {
      console.error('Failed to create account:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    if (variant === 'inline') {
      return (
        <button 
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors p-4"
        >
          <span className="w-6 h-6 rounded-full border border-dashed border-muted-foreground/50 flex items-center justify-center text-xs">+</span>
          Add account
        </button>
      );
    }
    
    return (
      <Button 
        onClick={() => setIsOpen(true)}
        className="bg-gold-500 text-navy-950 hover:bg-gold-400"
      >
        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Add Account
      </Button>
    );
  }

  return (
    <div className={variant === 'inline' ? 'border-t border-border' : ''}>
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">New Account</p>
          <button 
            type="button"
            onClick={() => setIsOpen(false)}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="space-y-1.5 col-span-2">
            <label className="text-xs text-muted-foreground">Name</label>
            <Input
              placeholder="Account name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Type</label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {accountTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Currency</label>
            <Select
              value={formData.currency}
              onValueChange={(value) => setFormData({ ...formData, currency: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Institution</label>
            <Input
              placeholder="Bank name"
              value={formData.institution}
              onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Balance</label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.currentBalance}
              onChange={(e) => setFormData({ ...formData, currentBalance: e.target.value })}
            />
          </div>
          
          <div className="col-span-2 flex justify-end items-end">
            <Button 
              type="submit" 
              disabled={loading || !formData.name}
              className="bg-gold-500 text-navy-950 hover:bg-gold-400"
            >
              {loading ? 'Adding...' : 'Add Account'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
