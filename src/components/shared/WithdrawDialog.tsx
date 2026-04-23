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
import { withdrawFromWallet } from '@/services/walletService';

interface WithdrawDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wallets: Wallet[];
  onWithdraw: () => void;
}

export function WithdrawDialog({ open, onOpenChange, wallets, onWithdraw }: WithdrawDialogProps) {
  const { toast } = useToast();
  const [withdrawnBy, setWithdrawnBy] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const kaamDoneWallet = wallets.find((w) => w.name === 'KaamDone');
  const selectedWalletData = wallets.find((w) => w.name === 'KaamDone');

  const handleSubmit = async () => {
    if (!withdrawnBy || !amount) {
      toast({
        title: 'Missing Fields',
        description: 'Please select who is withdrawing and enter an amount.',
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
      const withdrawReason = reason || `Withdrawal by ${withdrawnBy}`;
      const data = await withdrawFromWallet('KaamDone', withdrawAmount, withdrawReason);

      toast({
        title: 'Withdrawal Processed ✅',
        description: `${formatCurrency(withdrawAmount)} withdrawn from Kaam Done wallet by ${withdrawnBy}.`,
      });

      setWithdrawnBy('');
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
            Withdraw money from the Kaam Done wallet only.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Select Who Is Withdrawing */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Who is withdrawing?</Label>
            <RadioGroup value={withdrawnBy} onValueChange={setWithdrawnBy} className="grid grid-cols-2 gap-2">
              {[
                { name: 'Roshan', color: 'gold', icon: '👤' },
                { name: 'Anand', color: 'teal', icon: '👨‍💼' },
              ].map((person) => {
                const colors = getWalletColorClasses(person.name);
                return (
                  <Label
                    key={person.name}
                    htmlFor={`withdraw-${person.name}`}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      withdrawnBy === person.name
                        ? `${colors.bg} ${colors.border}`
                        : 'border-border/30 bg-secondary/20'
                    }`}
                  >
                    <RadioGroupItem value={person.name} id={`withdraw-${person.name}`} />
                    <div>
                      <p className={`text-sm font-medium ${withdrawnBy === person.name ? colors.text : 'text-foreground'}`}>
                        <span className="mr-1">{person.icon}</span> {person.name}
                      </p>
                    </div>
                  </Label>
                );
              })}
            </RadioGroup>
          </div>

          {/* KaamDone Wallet Info */}
          {kaamDoneWallet && (
            <div className="p-3 rounded-lg bg-blue/10 border border-blue/20">
              <p className="text-xs text-muted-foreground mb-1">Withdrawing from:</p>
              <p className="text-sm font-medium text-blue">Kaam Done Wallet</p>
              <p className="text-xs text-muted-foreground">
                Available: {formatCurrency(kaamDoneWallet.balance)}
              </p>
            </div>
          )}

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
            disabled={submitting || !withdrawnBy || !amount}
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
