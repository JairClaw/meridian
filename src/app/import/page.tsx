'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { importTransactionsWithDedup, getAccounts } from '@/lib/actions';
import type { Account } from '@/db/schema';

// Auto-detect column mappings based on common header names
function autoDetectMapping(headers: string[]): {
  date: string;
  description: string;
  amount: string;
  merchant: string;
  direction: string;
} {
  const lowerHeaders = headers.map(h => h.toLowerCase());
  
  const findMatch = (patterns: string[]): string => {
    for (const pattern of patterns) {
      const idx = lowerHeaders.findIndex(h => h.includes(pattern));
      if (idx >= 0) return headers[idx];
    }
    return '';
  };
  
  // Find exact match first, then partial
  const findExactOrPartial = (patterns: string[]): string => {
    // Try exact match first
    for (const pattern of patterns) {
      const idx = lowerHeaders.findIndex(h => h === pattern);
      if (idx >= 0) return headers[idx];
    }
    // Then try partial match
    for (const pattern of patterns) {
      const idx = lowerHeaders.findIndex(h => h.includes(pattern));
      if (idx >= 0) return headers[idx];
    }
    return '';
  };
  
  return {
    date: findMatch(['created on', 'date', 'posted', 'transaction date', 'time']),
    description: findMatch(['reference', 'description', 'memo', 'note', 'details', 'narrative']),
    amount: findMatch(['target amount', 'amount', 'value', 'sum', 'total', 'debit', 'credit']),
    merchant: findMatch(['target name', 'merchant', 'payee', 'vendor', 'recipient', 'beneficiary', 'counterparty']),
    direction: findExactOrPartial(['direction', 'type', 'in/out', 'transaction type']),
  };
}

// Generate a hash for deduplication
function hashRow(date: string, amount: number, description: string): string {
  const str = `${date}|${amount.toFixed(2)}|${description.toLowerCase().trim()}`;
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(16);
}
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ParsedRow {
  date: string;
  description: string;
  amount: number;
  merchant?: string;
  hash: string;
  raw: Record<string, string>;
}

interface ColumnMapping {
  date: string;
  description: string;
  amount: string;
  merchant?: string;
  direction?: string; // IN/OUT for sign
}

export default function ImportPage() {
  const [step, setStep] = useState<'upload' | 'map' | 'preview' | 'complete'>('upload');
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({
    date: '',
    description: '',
    amount: '',
    merchant: '',
    direction: '',
  });
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [accountId, setAccountId] = useState<string>('');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [importing, setImporting] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  
  useEffect(() => {
    getAccounts().then(setAccounts);
  }, []);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const rows = text.split('\n').map(row => {
        // Handle quoted CSV fields
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < row.length; i++) {
          const char = row[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      }).filter(row => row.some(cell => cell.length > 0));
      
      if (rows.length > 0) {
        const detectedHeaders = rows[0];
        setHeaders(detectedHeaders);
        setCsvData(rows.slice(1));
        
        // Auto-detect column mappings
        const detected = autoDetectMapping(detectedHeaders);
        setMapping(detected);
        
        setStep('map');
      }
    };
    reader.readAsText(file);
  }, []);

  const handleMapping = () => {
    const parsed: ParsedRow[] = csvData.map(row => {
      const rawObj: Record<string, string> = {};
      headers.forEach((h, i) => {
        rawObj[h] = row[i] || '';
      });
      
      const dateIdx = headers.indexOf(mapping.date);
      const descIdx = headers.indexOf(mapping.description);
      const amountIdx = headers.indexOf(mapping.amount);
      const merchantIdx = mapping.merchant ? headers.indexOf(mapping.merchant) : -1;
      const directionIdx = mapping.direction ? headers.indexOf(mapping.direction) : -1;
      
      let amount = parseFloat(row[amountIdx]?.replace(/[^0-9.-]/g, '') || '0');
      
      // Handle direction (IN = positive, OUT = negative, NEUTRAL = skip or 0)
      if (directionIdx >= 0) {
        const direction = row[directionIdx]?.trim().toUpperCase();
        if (direction === 'OUT') {
          // Expenses are negative
          amount = -Math.abs(amount);
        } else if (direction === 'IN') {
          // Income is positive
          amount = Math.abs(amount);
        } else if (direction === 'NEUTRAL') {
          // Currency conversions - set to 0 (or could skip)
          amount = 0;
        }
      }
      
      const date = row[dateIdx] || '';
      const description = row[descIdx] || '';
      
      return {
        date,
        description,
        amount,
        merchant: merchantIdx >= 0 ? row[merchantIdx] : undefined,
        hash: hashRow(date, amount, description),
        raw: rawObj,
      };
    }).filter(row => row.date && row.description && !isNaN(row.amount) && row.amount !== 0);
    
    setParsedRows(parsed);
    setStep('preview');
  };

  const handleImport = async () => {
    setImporting(true);
    
    try {
      const selectedAccount = accounts.find(a => a.id === parseInt(accountId));
      const transactions = parsedRows.map(row => ({
        accountId: parseInt(accountId),
        date: formatDate(row.date),
        amountCents: Math.round(row.amount * 100),
        description: row.description,
        merchant: row.merchant,
        currency: selectedAccount?.currency || 'EUR',
        externalId: row.hash, // For deduplication
      }));
      
      const result = await importTransactionsWithDedup(transactions);
      
      setImportedCount(result.imported);
      setSkippedCount(result.skipped);
      setStep('complete');
    } catch (error) {
      console.error('Import failed:', error);
    } finally {
      setImporting(false);
    }
  };

  const formatDate = (dateStr: string): string => {
    // Try to parse various date formats
    const formats = [
      /(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
      /(\d{2})\/(\d{2})\/(\d{4})/, // DD/MM/YYYY or MM/DD/YYYY
      /(\d{2})-(\d{2})-(\d{4})/, // DD-MM-YYYY
    ];
    
    for (const format of formats) {
      const match = dateStr.match(format);
      if (match) {
        // Assume YYYY-MM-DD if it looks like that
        if (dateStr.match(/^\d{4}-/)) {
          return dateStr.split('T')[0];
        }
        // Otherwise assume DD/MM/YYYY for European format
        const [, d, m, y] = match;
        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      }
    }
    
    return dateStr;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display">Import Transactions</h1>
        <p className="text-muted-foreground mt-1">Import transactions from a CSV file</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-4">
        {['Upload', 'Map Columns', 'Preview', 'Complete'].map((label, i) => {
          const stepIndex = ['upload', 'map', 'preview', 'complete'].indexOf(step);
          const isActive = i === stepIndex;
          const isComplete = i < stepIndex;
          
          return (
            <div key={label} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                isActive ? 'bg-gold-500 text-navy-950' :
                isComplete ? 'bg-emerald-500 text-white' :
                'bg-muted text-muted-foreground'
              }`}>
                {isComplete ? '✓' : i + 1}
              </div>
              <span className={`text-sm ${isActive ? 'font-medium' : 'text-muted-foreground'}`}>
                {label}
              </span>
              {i < 3 && <div className="w-8 h-px bg-border" />}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      {step === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display">Upload CSV File</CardTitle>
            <CardDescription>Select a CSV file exported from your bank or financial app</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-gold-500/50 transition-colors">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload" className="cursor-pointer">
                <div className="text-4xl mb-4">📄</div>
                <p className="font-medium mb-2">Drop your CSV file here or click to browse</p>
                <p className="text-sm text-muted-foreground">Supports most bank export formats</p>
              </label>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'map' && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display">Map Columns</CardTitle>
            <CardDescription>Tell us which columns contain which data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Date Column *</label>
                <Select value={mapping.date} onValueChange={(v) => setMapping({ ...mapping, date: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    {headers.map((h) => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Description Column *</label>
                <Select value={mapping.description} onValueChange={(v) => setMapping({ ...mapping, description: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    {headers.map((h) => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount Column *</label>
                <Select value={mapping.amount} onValueChange={(v) => setMapping({ ...mapping, amount: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    {headers.map((h) => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Merchant Column (optional)</label>
                <Select value={mapping.merchant || '__none__'} onValueChange={(v) => setMapping({ ...mapping, merchant: v === '__none__' ? '' : v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {headers.map((h) => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Direction Column (optional)</label>
                <Select value={mapping.direction || '__none__'} onValueChange={(v) => setMapping({ ...mapping, direction: v === '__none__' ? '' : v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {headers.map((h) => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Use for Wise exports (IN/OUT)</p>
              </div>
            </div>

            {/* Preview of first few rows */}
            <div>
              <p className="text-sm font-medium mb-2">Preview (first 5 rows)</p>
              <div className="overflow-x-auto rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {headers.map((h) => (
                        <TableHead key={h} className="whitespace-nowrap">{h}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {csvData.slice(0, 5).map((row, i) => (
                      <TableRow key={i}>
                        {row.map((cell, j) => (
                          <TableCell key={j} className="whitespace-nowrap">{cell}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setStep('upload')}>Back</Button>
              <Button 
                onClick={handleMapping}
                disabled={!mapping.date || !mapping.description || !mapping.amount}
                className="bg-gold-500 text-navy-950 hover:bg-gold-400"
              >
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'preview' && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display">Preview Import</CardTitle>
            <CardDescription>Review the transactions before importing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
              <Badge variant="secondary">{parsedRows.length} transactions</Badge>
              <span className="text-sm text-muted-foreground">
                Total: {formatCurrency(parsedRows.reduce((sum, r) => sum + r.amount, 0))}
              </span>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Import to Account *</label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id.toString()}>
                      {account.name} ({account.currency})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="overflow-x-auto rounded-lg border border-border max-h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Merchant</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedRows.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="whitespace-nowrap">{row.date}</TableCell>
                      <TableCell>{row.description}</TableCell>
                      <TableCell className="text-muted-foreground">{row.merchant || '-'}</TableCell>
                      <TableCell className={`text-right tabular-nums ${row.amount >= 0 ? 'text-emerald-500' : ''}`}>
                        {formatCurrency(row.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setStep('map')}>Back</Button>
              <Button 
                onClick={handleImport}
                disabled={!accountId || importing}
                className="bg-gold-500 text-navy-950 hover:bg-gold-400"
              >
                {importing ? 'Importing...' : `Import ${parsedRows.length} Transactions`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'complete' && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-2xl font-display mb-2">Import Complete!</h2>
            <div className="flex justify-center gap-4 mb-6">
              <div className="text-center">
                <p className="text-3xl font-semibold text-emerald-500">{importedCount}</p>
                <p className="text-sm text-muted-foreground">imported</p>
              </div>
              {skippedCount > 0 && (
                <div className="text-center">
                  <p className="text-3xl font-semibold text-muted-foreground">{skippedCount}</p>
                  <p className="text-sm text-muted-foreground">duplicates skipped</p>
                </div>
              )}
            </div>
            {skippedCount > 0 && (
              <p className="text-sm text-muted-foreground mb-6">
                {skippedCount} transactions were already in the database and skipped.
              </p>
            )}
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={() => {
                setStep('upload');
                setCsvData([]);
                setHeaders([]);
                setParsedRows([]);
                setSkippedCount(0);
                setImportedCount(0);
              }}>
                Import More
              </Button>
              <a href="/transactions">
                <Button className="bg-gold-500 text-navy-950 hover:bg-gold-400">
                  View Transactions
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
