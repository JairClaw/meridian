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
  { value: 'checking', label: 'Checking Account' },
  { value: 'savings', label: 'Savings Account' },
  { value: 'investment', label: 'Investment Account' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'cash', label: 'Cash' },
  { value: 'mortgage', label: 'Mortgage' },
  { value: 'loan', label: 'Loan' },
];

const currencies = [
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'GBP', label: 'GBP' },
  { value: 'JPY', label: 'JPY' },
  { value: 'CHF', label: 'CHF' },
  { value: 'CAD', label: 'CAD' },
  { value: 'AUD', label: 'AUD' },
  { value: 'BTC', label: 'BTC' },
  { value: 'ETH', label: 'ETH' },
];

export function AddAccountForm() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    currency: 'EUR',
    institution: '',
    accountNumber: '',
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
        accountNumber: formData.accountNumber || undefined,
        currentBalance: formData.currentBalance 
          ? Math.round(parseFloat(formData.currentBalance) * 100)
          : 0,
      });
      
      setIsOpen(false);
      setFormData({
        name: '',
        type: '',
        currency: 'EUR',
        institution: '',
        accountNumber: '',
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
    <form onSubmit={handleSubmit} className="p-4 rounded-lg bg-muted/50 border border-border space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-medium">New Account</p>
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
          <label className="text-xs text-muted-foreground">Account Name *</label>
          <Input
            placeholder="e.g., Main Checking"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Type *</label>
          <Select
            value={formData.type}
            onValueChange={(value) => setFormData({ ...formData, type: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
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
        
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Currency *</label>
          <Select
            value={formData.currency}
            onValueChange={(value) => setFormData({ ...formData, currency: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((currency) => (
                <SelectItem key={currency.value} value={currency.value}>
                  {currency.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Institution</label>
          <Input
            placeholder="e.g., BBVA, Chase"
            value={formData.institution}
            onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Last 4 Digits</label>
          <Input
            placeholder="1234"
            maxLength={4}
            value={formData.accountNumber}
            onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value.replace(/\D/g, '') })}
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Current Balance</label>
          <Input
            type="number"
            step="0.01"
            placeholder="0.00"
            value={formData.currentBalance}
            onChange={(e) => setFormData({ ...formData, currentBalance: e.target.value })}
          />
        </div>
      </div>
      
      <div className="flex justify-end">
        <Button 
          type="submit" 
          disabled={loading || !formData.name || !formData.type}
          className="bg-gold-500 text-navy-950 hover:bg-gold-400"
        >
          {loading ? 'Adding...' : 'Add Account'}
        </Button>
      </div>
    </form>
  );
}
