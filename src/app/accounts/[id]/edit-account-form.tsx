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
import { updateAccount, deleteAccount } from '@/lib/actions';
import type { Account } from '@/db/schema';

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

interface EditAccountFormProps {
  account: Account;
}

export function EditAccountForm({ account }: EditAccountFormProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [formData, setFormData] = useState({
    name: account.name,
    type: account.type,
    currency: account.currency,
    institution: account.institution || '',
    accountNumber: account.accountNumber || '',
    currentBalance: (account.currentBalance / 100).toFixed(2),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await updateAccount(account.id, {
        name: formData.name,
        type: formData.type,
        currency: formData.currency,
        institution: formData.institution || undefined,
        accountNumber: formData.accountNumber || undefined,
        currentBalance: Math.round(parseFloat(formData.currentBalance) * 100),
      });
      
      setIsOpen(false);
      router.refresh();
    } catch (error) {
      console.error('Failed to update account:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteAccount(account.id);
      router.push('/accounts');
    } catch (error) {
      console.error('Failed to delete account:', error);
      setDeleting(false);
    }
  };

  if (!isOpen) {
    return (
      <Button variant="outline" onClick={() => setIsOpen(true)}>
        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
        </svg>
        Edit
      </Button>
    );
  }

  if (confirmDelete) {
    return (
      <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 space-y-4">
        <div>
          <p className="font-medium text-red-500">⚠️ Delete this account?</p>
          <p className="text-sm text-muted-foreground mt-1">
            This will hide the account from your dashboard. Transactions will be preserved.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setConfirmDelete(false)}>
            Cancel
          </Button>
          <Button 
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Yes, Delete'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 rounded-lg bg-muted/50 border border-border space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-medium">Edit Account</p>
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
      
      <div className="flex justify-between">
        <Button 
          type="button" 
          variant="ghost" 
          className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
          onClick={() => setConfirmDelete(true)}
        >
          Delete Account
        </Button>
        <Button 
          type="submit" 
          disabled={loading || !formData.name || !formData.type}
          className="bg-gold-500 text-navy-950 hover:bg-gold-400"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
