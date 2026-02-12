'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { findProbableTransfers, markAsTransfer, getTransferStats } from '@/lib/actions';

interface TransferPair {
  outgoing: { id: number; date: string; amount: number; description: string; accountName: string; accountId: number };
  incoming: { id: number; date: string; amount: number; description: string; accountName: string; accountId: number };
  confidence: 'high' | 'medium';
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(Math.abs(cents) / 100);
}

export function TransferScanner() {
  const router = useRouter();
  const [transfers, setTransfers] = useState<TransferPair[]>([]);
  const [stats, setStats] = useState({ markedTransfers: 0, probableTransfers: 0 });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    const [transferList, transferStats] = await Promise.all([
      findProbableTransfers(),
      getTransferStats(),
    ]);
    setTransfers(transferList);
    setStats(transferStats);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMarkAsTransfer = async (outId: number, incId: number) => {
    const key = `${outId}-${incId}`;
    setProcessing(key);
    await markAsTransfer(outId, incId);
    await loadData();
    setProcessing(null);
    router.refresh();
  };

  const handleIgnore = (outId: number, incId: number) => {
    // Remove from local list (doesn't persist - just hides for this session)
    setTransfers(prev => prev.filter(t => 
      !(t.outgoing.id === outId && t.incoming.id === incId)
    ));
  };

  const handleMarkAllHigh = async () => {
    setProcessing('all-high');
    const highConfidence = transfers.filter(t => t.confidence === 'high');
    for (const transfer of highConfidence) {
      await markAsTransfer(transfer.outgoing.id, transfer.incoming.id);
    }
    await loadData();
    setProcessing(null);
    router.refresh();
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="label-sm">TRANSFER SCANNER</p>
            <p className="text-sm text-muted-foreground mt-1">
              {stats.markedTransfers} transfers marked · {stats.probableTransfers} probable matches found
            </p>
          </div>
          {transfers.filter(t => t.confidence === 'high').length > 0 && (
            <Button
              size="sm"
              onClick={handleMarkAllHigh}
              disabled={processing === 'all-high'}
            >
              {processing === 'all-high' ? 'Processing...' : `Mark All High Confidence (${transfers.filter(t => t.confidence === 'high').length})`}
            </Button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Scanning for transfers...
          </div>
        ) : transfers.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">✅</div>
            <p className="text-muted-foreground">No probable transfers found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {transfers.slice(0, 20).map((transfer) => {
              const key = `${transfer.outgoing.id}-${transfer.incoming.id}`;
              const isProcessing = processing === key;
              
              return (
                <div
                  key={key}
                  className={`p-4 rounded-lg border ${
                    transfer.confidence === 'high' 
                      ? 'border-emerald-500/30 bg-emerald-500/5' 
                      : 'border-border bg-muted/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        transfer.confidence === 'high'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {transfer.confidence === 'high' ? '⚡ High confidence' : '🤔 Medium confidence'}
                      </span>
                      {transfer.outgoing.date !== transfer.incoming.date && (
                        <span className="text-xs text-muted-foreground">
                          {Math.abs(new Date(transfer.outgoing.date).getTime() - new Date(transfer.incoming.date).getTime()) / (1000 * 60 * 60 * 24)} day(s) apart
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleIgnore(transfer.outgoing.id, transfer.incoming.id)}
                        disabled={isProcessing}
                      >
                        Ignore
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleMarkAsTransfer(transfer.outgoing.id, transfer.incoming.id)}
                        disabled={isProcessing}
                      >
                        {isProcessing ? 'Marking...' : 'Mark as Transfer'}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {/* Outgoing */}
                    <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-red-400">↑ OUT</span>
                          <span className="text-sm font-medium">{transfer.outgoing.accountName}</span>
                        </div>
                        <span className="text-sm font-semibold tabular-nums text-red-400">
                          {formatCurrency(transfer.outgoing.amount)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1 line-clamp-2">
                        {transfer.outgoing.description}
                      </p>
                      <p className="text-xs text-muted-foreground">{transfer.outgoing.date}</p>
                    </div>
                    
                    {/* Incoming */}
                    <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-400">↓ IN</span>
                          <span className="text-sm font-medium">{transfer.incoming.accountName}</span>
                        </div>
                        <span className="text-sm font-semibold tabular-nums text-emerald-400">
                          +{formatCurrency(transfer.incoming.amount)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1 line-clamp-2">
                        {transfer.incoming.description}
                      </p>
                      <p className="text-xs text-muted-foreground">{transfer.incoming.date}</p>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {transfers.length > 20 && (
              <p className="text-center text-sm text-muted-foreground">
                Showing 20 of {transfers.length} probable transfers
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
