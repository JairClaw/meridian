'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { updateAccount } from '@/lib/actions';
import type { Account } from '@/db/schema';

interface AccountLinkingProps {
  account: Account;
  allAccounts: Account[];
}

export function AccountLinking({ account, allAccounts }: AccountLinkingProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [linkedTo, setLinkedTo] = useState<string>(account.linkedToAccountId?.toString() || 'none');
  const [hideFromDashboard, setHideFromDashboard] = useState(account.hideFromDashboard || false);
  const [saving, setSaving] = useState(false);

  // Get accounts that can be linked to (exclude self and accounts already linked to this one)
  const linkableAccounts = allAccounts.filter(a => 
    a.id !== account.id && 
    a.linkedToAccountId !== account.id
  );

  // Find accounts that are linked TO this account
  const linkedAccounts = allAccounts.filter(a => a.linkedToAccountId === account.id);

  // Find the account this is linked to
  const linkedToAccount = linkedTo && linkedTo !== 'none' ? allAccounts.find(a => a.id === parseInt(linkedTo)) : null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateAccount(account.id, {
        linkedToAccountId: linkedTo && linkedTo !== 'none' ? parseInt(linkedTo) : null,
        hideFromDashboard,
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const handleUnlink = async () => {
    setSaving(true);
    try {
      await updateAccount(account.id, {
        linkedToAccountId: null,
      });
      setLinkedTo('none');
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (cents: number, currency = 'EUR') => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100);

  // Liability types should be treated as negative for net value
  const LIABILITY_TYPES = ['mortgage', 'loan', 'credit_card'];
  
  const getNetBalance = (a: Account) => {
    const balance = a.currentBalance;
    // If it's a liability and stored as positive, make it negative
    if (LIABILITY_TYPES.includes(a.type) && balance > 0) {
      return -balance;
    }
    return balance;
  };

  // Calculate net value if there are linked accounts
  const netValue = linkedAccounts.reduce((sum, a) => sum + getNetBalance(a), getNetBalance(account));

  // Check if there's any linking configured
  const hasLinking = account.linkedToAccountId || linkedAccounts.length > 0 || account.hideFromDashboard;

  return (
    <div className="border-t border-border pt-4 mt-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <span className="flex items-center gap-2">
          <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          Advanced: Account Linking
          {hasLinking && <span className="w-2 h-2 rounded-full bg-[#10B981]" />}
        </span>
      </button>

      {isOpen && (
        <div className="mt-4 pl-6 space-y-6">
          {/* Linked TO section */}
          <div>
            <p className="text-sm font-medium mb-2">Link this account to:</p>
            <p className="text-xs text-muted-foreground mb-3">
              Link accounts to combine their balances (e.g., link a mortgage to a property to show net equity)
            </p>
            
            <div className="flex items-center gap-3">
              <Select value={linkedTo} onValueChange={setLinkedTo}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Not linked" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not linked</SelectItem>
                  {linkableAccounts.map(a => (
                    <SelectItem key={a.id} value={a.id.toString()}>
                      {a.name} ({formatCurrency(a.currentBalance, a.currency)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {linkedTo !== 'none' && linkedTo !== (account.linkedToAccountId?.toString() || 'none') && (
                <Button onClick={handleSave} disabled={saving} size="sm">
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              )}
              
              {account.linkedToAccountId && (
                <Button variant="outline" onClick={handleUnlink} disabled={saving} size="sm">
                  Unlink
                </Button>
              )}
            </div>

            {linkedToAccount && (
              <div className="mt-3 p-3 rounded-lg bg-muted/30 text-sm">
                <p className="text-muted-foreground">
                  This account's balance will be added to <strong>{linkedToAccount.name}</strong> on the dashboard.
                </p>
              </div>
            )}
          </div>

          {/* Accounts linked TO this account */}
          {linkedAccounts.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Accounts linked to this one:</p>
              <div className="space-y-2">
                {linkedAccounts.map(a => {
                  const displayBalance = getNetBalance(a);
                  return (
                    <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <span className="text-sm">{a.name} {LIABILITY_TYPES.includes(a.type) && '(liability)'}</span>
                      <span className={`text-sm tabular-nums ${displayBalance < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {formatCurrency(displayBalance, a.currency)}
                      </span>
                    </div>
                  );
                })}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                  <span className="text-sm font-medium">Net Value</span>
                  <span className={`text-sm font-semibold tabular-nums ${netValue < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {formatCurrency(netValue, account.currency)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Hide from dashboard */}
          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Hide from dashboard</p>
                <p className="text-xs text-muted-foreground">
                  Don't show this account separately in the dashboard grid
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={hideFromDashboard}
                  onChange={(e) => {
                    setHideFromDashboard(e.target.checked);
                    // Auto-save on toggle
                    updateAccount(account.id, { hideFromDashboard: e.target.checked })
                      .then(() => router.refresh());
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-[#10B981] peer-focus:ring-2 peer-focus:ring-[#10B981]/20 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
