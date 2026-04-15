'use client';

import { useState } from 'react';
import { Wallet } from '@/lib/types';
import { formatCurrency, getWalletColorClasses } from '@/lib/helpers';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Wallet as WalletIcon, IndianRupee, ArrowDownRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WithdrawDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wallets: Wallet[];
  onWithdraw: () => void;
}

export function WithdrawDialog({ open, onOpenChange, wallets, onWithdraw }: WithdrawDialogProps) {
  const { toast } = useToast();
  const [selectedWallet, setSelectedWallet] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const personalWallets = wallets.filter((w) => w.name !== 'KaamDone');
  const selectedWalletData = wallets.find((w) => w.name === selectedWallet);

  const handleSubmit = async () => {
    if (!selectedWallet || !amount) {
      toast({
        title: 'Missing Fields',
        description: 'Please select a wallet and enter an amount.',
        variant: 'destructive',
      });
      return;
    }

    const withdrawAmount = parseFloat(amount);
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount.',
        variant: 'destructive',
      });
      return;
    }

    if (selectedWalletData && withdrawAmount > selectedWalletData.balance) {
      toast({
        title: 'Insufficient Balance',
        description: `Maximum withdrawable: ${formatCurrency(selectedWalletData.balance)}`,
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/wallets/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletName: selectedWallet,
          amount: withdrawAmount,
          reason: reason || 'Withdrawal',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to process withdrawal');
      }

      toast({
        title: 'Withdrawal Processed ✅',
        description: `${formatCurrency(withdrawAmount)} withdrawn from ${selectedWallet}'s wallet.`,
      });

      setSelectedWallet('');
      setAmount('');
      setReason('');
      onOpenChange(false);
      onWithdraw();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to process withdrawal';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border/50 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <WalletIcon className="w-5 h-5 text-gold" />
            Withdraw from Wallet
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Withdraw money from a personal wallet. Kaam Done wallet is not withdrawable.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Select Wallet */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Select Wallet</Label>
            <RadioGroup value={selectedWallet} onValueChange={setSelectedWallet} className="grid grid-cols-2 gap-2">
              {personalWallets.map((wallet) => {
                const colors = getWalletColorClasses(wallet.name);
                return (
                  <Label
                    key={wallet.id}
                    htmlFor={`withdraw-${wallet.name}`}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedWallet === wallet.name
                        ? `${colors.bg} ${colors.border}`
                        : 'border-border/30 bg-secondary/20'
                    }`}
                  >
                    <RadioGroupItem value={wallet.name} id={`withdraw-${wallet.name}`} />
                    <div>
                      <p className={`text-sm font-medium ${selectedWallet === wallet.name ? colors.text : 'text-foreground'}`}>
                        {wallet.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Balance: {formatCurrency(wallet.balance)}
                      </p>
                    </div>
                  </Label>
                );
              })}
            </RadioGroup>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="withdrawAmount" className="text-sm font-medium flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-gold" />
              Amount (₹)
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gold font-medium">₹</span>
              <Input
                id="withdrawAmount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="bg-secondary/30 border-border/30 focus:border-gold/50 pl-8"
                max={selectedWalletData?.balance || 0}
                min="0"
              />
            </div>
            {selectedWalletData && (
              <p className="text-xs text-muted-foreground">
                Available: {formatCurrency(selectedWalletData.balance)}
              </p>
            )}
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="withdrawReason" className="text-sm font-medium">Reason (optional)</Label>
            <Textarea
              id="withdrawReason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why are you withdrawing?"
              rows={2}
              className="bg-secondary/30 border-border/30 focus:border-gold/50 resize-none"
            />
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={submitting || !selectedWallet || !amount}
            className="w-full bg-gradient-to-r from-gold to-gold-dark text-black font-bold hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Processing...
              </div>
            ) : (
              <>
                <ArrowDownRight className="w-4 h-4 mr-2" />
                Withdraw {amount ? formatCurrency(parseFloat(amount) || 0) : ''}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
