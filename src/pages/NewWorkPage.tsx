import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { formatCurrency } from '@/lib/helpers';
import {
  PlusCircle,
  User,
  Phone,
  FileText,
  IndianRupee,
  CheckCircle2,
  Sparkles,
  Users,
  AlertCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createTicket } from '@/services/ticketService';

interface NewWorkPageProps {
  onTicketCreated: () => void;
}

export function NewWorkPage({ onTicketCreated }: NewWorkPageProps) {
  const { toast } = useToast();
  
  // Owners Work State
  const [starter, setStarter] = useState<string>('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [purpose, setPurpose] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  
  // Partnered Work State
  const [partneredStarter, setPartneredStarter] = useState<string>('');
  const [partneredTotalAmount, setPartneredTotalAmount] = useState('');
  const [partneredWith, setPartneredWith] = useState('');
  const [partneredClientName, setPartneredClientName] = useState('');
  const [partneredClientPhone, setPartneredClientPhone] = useState('');
  const [partneredPurpose, setPartneredPurpose] = useState('');
  const [partneredRoshanAmount, setPartneredRoshanAmount] = useState('');
  const [partneredAnandAmount, setPartneredAnandAmount] = useState('');
  const [partneredPartnerAmount, setPartneredPartnerAmount] = useState('');
  const [partneredKaamDoneAmount, setPartneredKaamDoneAmount] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Partnered calculation and validation
  const partneredDistribution = useMemo(() => {
    const total = parseFloat(partneredTotalAmount) || 0;
    const roshan = parseFloat(partneredRoshanAmount) || 0;
    const anand = parseFloat(partneredAnandAmount) || 0;
    const partner = parseFloat(partneredPartnerAmount) || 0;
    const kaamDone = parseFloat(partneredKaamDoneAmount) || 0;

    const allocated = Math.round((roshan + anand + partner + kaamDone) * 100) / 100;
    const remaining = Math.round((total - allocated) * 100) / 100;
    const isOver = allocated > total;
    const isExact = total > 0 && allocated === total;
    const isUnder = total > 0 && allocated < total;

    return {
      total,
      roshan,
      anand,
      partner,
      kaamDone,
      allocated,
      remaining,
      isOver,
      isExact,
      isUnder,
    };
  }, [
    partneredTotalAmount,
    partneredRoshanAmount,
    partneredAnandAmount,
    partneredPartnerAmount,
    partneredKaamDoneAmount,
  ]);

  const splitPreview = useMemo(() => {
    const total = parseFloat(totalAmount) || 0;
    if (total <= 0 || !starter) return null;

    const starterAmount = Math.round(total * 0.5 * 100) / 100;
    const remainder = Math.round((total - starterAmount) * 100) / 100;
    const partnerAmount = Math.round(remainder * 0.6 * 100) / 100;
    const kaamDoneAmount = Math.round(remainder * 0.4 * 100) / 100;
    const partner = starter === 'Roshan' ? 'Anand' : 'Roshan';

    return { starterAmount, partnerAmount, kaamDoneAmount, partner, total };
  }, [totalAmount, starter]);

  const handleOwnersSubmit = async () => {
    if (!starter || !clientName || !purpose || !totalAmount) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    const total = parseFloat(totalAmount);
    if (isNaN(total) || total <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount greater than 0.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const data = await createTicket({
        starter,
        clientName,
        clientPhone,
        purpose,
        totalAmount: total,
      });

      setSuccess(true);
      toast({
        title: 'Ticket Opened! 🎫',
        description: `Ticket #${data.ticketNo} created. ${starter} gets ${formatCurrency(data.starterAmount)}.`,
      });

      // Reset form after delay
      setTimeout(() => {
        setStarter('');
        setClientName('');
        setClientPhone('');
        setPurpose('');
        setTotalAmount('');
        setSuccess(false);
        onTicketCreated();
      }, 2000);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create ticket';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePartneredSubmit = async () => {
    if (
      !partneredStarter ||
      !partneredWith.trim() ||
      !partneredClientName.trim() ||
      !partneredPurpose.trim() ||
      !partneredTotalAmount
    ) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    const total = parseFloat(partneredTotalAmount);
    if (isNaN(total) || total <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid total amount greater than 0.',
        variant: 'destructive',
      });
      return;
    }

    if (!partneredDistribution.isExact) {
      if (partneredDistribution.isOver) {
        toast({
          title: 'Over Allocated',
          description: `Distribution total (₹${partneredDistribution.allocated}) exceeds Total Amount (₹${total}) by ₹${Math.abs(partneredDistribution.remaining)}.`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Incomplete Allocation',
          description: `Please allocate the remaining ₹${partneredDistribution.remaining} across the 4 fields so the sum equals the Total Amount.`,
          variant: 'destructive',
        });
      }
      return;
    }

    setSubmitting(true);
    try {
      const data = await createTicket({
        type: 'partnered',
        partneredWith: partneredWith.trim(),
        starter: partneredStarter,
        clientName: partneredClientName.trim(),
        clientPhone: partneredClientPhone.trim(),
        purpose: partneredPurpose.trim(),
        totalAmount: total,
        roshanAmount: partneredDistribution.roshan,
        anandAmount: partneredDistribution.anand,
        partnerWalletAmount: partneredDistribution.partner,
        kaamDoneAmount: partneredDistribution.kaamDone,
      });

      setSuccess(true);
      toast({
        title: 'Partnered Ticket Opened! 🎫',
        description: `Ticket #${data.ticketNo} created and amounts distributed to each wallet.`,
      });

      // Reset form after delay
      setTimeout(() => {
        setPartneredStarter('');
        setPartneredTotalAmount('');
        setPartneredWith('');
        setPartneredClientName('');
        setPartneredClientPhone('');
        setPartneredPurpose('');
        setPartneredRoshanAmount('');
        setPartneredAnandAmount('');
        setPartneredPartnerAmount('');
        setPartneredKaamDoneAmount('');
        setSuccess(false);
        onTicketCreated();
      }, 2000);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create ticket';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex items-center justify-center py-16">
        <Card className="bg-card/80 border-teal/30 glow-teal max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-teal/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-teal" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1">Ticket Opened!</h3>
            <p className="text-sm text-muted-foreground">
              Money has been distributed to wallets.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-teal/15 flex items-center justify-center">
          <PlusCircle className="w-5 h-5 text-teal" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Start New Work</h2>
          <p className="text-xs text-muted-foreground">Create a new ticket and distribute earnings</p>
        </div>
      </div>

      <Tabs defaultValue="owners" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="owners" className="data-[state=active]:bg-gold/20 data-[state=active]:text-gold">
            Owner's Work
          </TabsTrigger>
          <TabsTrigger value="partnered" className="data-[state=active]:bg-teal/20 data-[state=active]:text-teal">
            Partnered Work
          </TabsTrigger>
        </TabsList>

        <TabsContent value="owners">
          {/* Owners Form */}
          <Card className="bg-card/80 border-border/30">
            <CardContent className="p-6 space-y-6">
              {/* Who is starting? */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <User className="w-4 h-4 text-gold" />
                  Who is starting the work?
                </Label>
                <RadioGroup value={starter} onValueChange={setStarter} className="grid grid-cols-2 gap-3">
                  <Label
                    htmlFor="roshan"
                    className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                      starter === 'Roshan'
                        ? 'border-gold/50 bg-gold/10 glow-gold'
                        : 'border-border/30 bg-secondary/20 hover:border-gold/30'
                    }`}
                  >
                    <RadioGroupItem value="Roshan" id="roshan" className="text-gold" />
                    <div>
                      <p className="text-sm font-medium text-gold">Roshan</p>
                      <p className="text-xs text-muted-foreground">Gets 50% as starter</p>
                    </div>
                  </Label>
                  <Label
                    htmlFor="anand"
                    className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                      starter === 'Anand'
                        ? 'border-teal/50 bg-teal/10 glow-teal'
                        : 'border-border/30 bg-secondary/20 hover:border-teal/30'
                    }`}
                  >
                    <RadioGroupItem value="Anand" id="anand" className="text-teal" />
                    <div>
                      <p className="text-sm font-medium text-teal">Anand</p>
                      <p className="text-xs text-muted-foreground">Gets 50% as starter</p>
                    </div>
                  </Label>
                </RadioGroup>
              </div>

              {/* Client Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientName" className="text-sm font-medium text-foreground flex items-center gap-2">
                    <User className="w-4 h-4 text-teal" />
                    Client Name *
                  </Label>
                  <Input
                    id="clientName"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Enter client name"
                    className="bg-secondary/30 border-border/30 focus:border-gold/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientPhone" className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Phone className="w-4 h-4 text-teal" />
                    Phone Number
                  </Label>
                  <Input
                    id="clientPhone"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="Enter phone number"
                    className="bg-secondary/30 border-border/30 focus:border-gold/50"
                  />
                </div>
              </div>

              {/* Purpose */}
              <div className="space-y-2">
                <Label htmlFor="purpose" className="text-sm font-medium text-foreground flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue" />
                  Purpose of Work *
                </Label>
                <Textarea
                  id="purpose"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="Describe the work being done..."
                  rows={3}
                  className="bg-secondary/30 border-border/30 focus:border-gold/50 resize-none"
                />
              </div>

              {/* Total Amount */}
              <div className="space-y-2">
                <Label htmlFor="totalAmount" className="text-sm font-medium text-foreground flex items-center gap-2">
                  <IndianRupee className="w-4 h-4 text-gold" />
                  Total Amount (₹) *
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gold font-medium">₹</span>
                  <Input
                    id="totalAmount"
                    type="number"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    placeholder="0"
                    className="bg-secondary/30 border-border/30 focus:border-gold/50 pl-8 text-lg font-bold"
                    min="0"
                    step="1"
                  />
                </div>
              </div>

              {/* Split Preview */}
              {splitPreview && (
                <Card className="bg-card border-gold/20 gradient-border overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-gold" />
                      Split Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-gold/10 border border-gold/20">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-gold" />
                          <span className="text-sm text-gold font-medium">{starter} (Starter)</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-gold">{formatCurrency(splitPreview.starterAmount)}</p>
                          <p className="text-[10px] text-muted-foreground">50% of total</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-teal/10 border border-teal/20">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-teal" />
                          <span className="text-sm text-teal font-medium">{splitPreview.partner} (Partner)</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-teal">{formatCurrency(splitPreview.partnerAmount)}</p>
                          <p className="text-[10px] text-muted-foreground">60% of remainder</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-blue/10 border border-blue/20">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-blue" />
                          <span className="text-sm text-blue font-medium">Kaam Done</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-blue">{formatCurrency(splitPreview.kaamDoneAmount)}</p>
                          <p className="text-[10px] text-muted-foreground">40% of remainder</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Submit Button */}
              <Button
                onClick={handleOwnersSubmit}
                disabled={submitting || !starter || !clientName || !purpose || !totalAmount}
                className="w-full bg-gradient-to-r from-gold via-teal to-blue text-black font-bold hover:opacity-90 h-12 text-base disabled:opacity-50"
              >
                {submitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Creating Ticket...
                  </div>
                ) : (
                  <>
                    <PlusCircle className="w-5 h-5 mr-2" />
                    Open Ticket
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="partnered">
          {/* Partnered Form */}
          <Card className="bg-card/80 border-border/30">
            <CardContent className="p-6 space-y-6">
              {/* 1. Who started work? */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <User className="w-4 h-4 text-teal" />
                  1. Who started the work? *
                </Label>
                <RadioGroup value={partneredStarter} onValueChange={setPartneredStarter} className="grid grid-cols-2 gap-3">
                  <Label
                    htmlFor="p_roshan"
                    className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                      partneredStarter === 'Roshan'
                        ? 'border-gold/50 bg-gold/10 glow-gold'
                        : 'border-border/30 bg-secondary/20 hover:border-gold/30'
                    }`}
                  >
                    <RadioGroupItem value="Roshan" id="p_roshan" className="text-gold" />
                    <div>
                      <p className="text-sm font-medium text-gold">Roshan</p>
                      <p className="text-xs text-muted-foreground">Started work</p>
                    </div>
                  </Label>
                  <Label
                    htmlFor="p_anand"
                    className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                      partneredStarter === 'Anand'
                        ? 'border-teal/50 bg-teal/10 glow-teal'
                        : 'border-border/30 bg-secondary/20 hover:border-teal/30'
                    }`}
                  >
                    <RadioGroupItem value="Anand" id="p_anand" className="text-teal" />
                    <div>
                      <p className="text-sm font-medium text-teal">Anand</p>
                      <p className="text-xs text-muted-foreground">Started work</p>
                    </div>
                  </Label>
                </RadioGroup>
              </div>

              {/* 2. Total Amount */}
              <div className="space-y-2">
                <Label htmlFor="partneredTotalAmount" className="text-sm font-medium text-foreground flex items-center gap-2">
                  <IndianRupee className="w-4 h-4 text-gold" />
                  2. Total Amount (₹) *
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gold font-medium">₹</span>
                  <Input
                    id="partneredTotalAmount"
                    type="number"
                    value={partneredTotalAmount}
                    onChange={(e) => setPartneredTotalAmount(e.target.value)}
                    placeholder="0"
                    className="bg-secondary/30 border-border/30 focus:border-teal/50 pl-8 text-lg font-bold"
                    min="0"
                    step="1"
                  />
                </div>
              </div>

              {/* 3. Partner's Name */}
              <div className="space-y-2">
                <Label htmlFor="partneredWith" className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-400" />
                  3. Partner’s Name *
                </Label>
                <Input
                  id="partneredWith"
                  value={partneredWith}
                  onChange={(e) => setPartneredWith(e.target.value)}
                  placeholder="Enter partner name (e.g. Rahul, Agency X)"
                  className="bg-secondary/30 border-border/30 focus:border-purple-500/50"
                />
              </div>

              {/* 4. Four Amount Fields (Roshan, Anand, Partner, Kaam Done) */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-teal" />
                    4. Amount Distribution (4 Wallets) *
                  </Label>
                  {partneredDistribution.total > 0 && (
                    <div className="text-xs font-medium">
                      {partneredDistribution.isExact ? (
                        <span className="text-green-400 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/30">
                          ✓ Exact Match (₹{partneredDistribution.total})
                        </span>
                      ) : partneredDistribution.isOver ? (
                        <span className="text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/30 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Exceeds by ₹{Math.abs(partneredDistribution.remaining)}
                        </span>
                      ) : (
                        <span className="text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                          ₹{partneredDistribution.remaining} remaining
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-secondary/10 border border-border/40">
                  {/* Roshan Amount */}
                  <div className="space-y-1.5 p-3 rounded-lg bg-gold/5 border border-gold/20">
                    <Label htmlFor="roshanAmount" className="text-xs font-medium text-gold flex items-center justify-between">
                      <span>👤 Roshan</span>
                      <span className="text-[10px] text-muted-foreground">Roshan Wallet</span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gold text-xs font-medium">₹</span>
                      <Input
                        id="roshanAmount"
                        type="number"
                        value={partneredRoshanAmount}
                        onChange={(e) => setPartneredRoshanAmount(e.target.value)}
                        placeholder="0"
                        className="bg-card/60 border-gold/30 focus:border-gold pl-7 h-9 text-sm font-semibold"
                        min="0"
                        step="1"
                      />
                    </div>
                  </div>

                  {/* Anand Amount */}
                  <div className="space-y-1.5 p-3 rounded-lg bg-teal/5 border border-teal/20">
                    <Label htmlFor="anandAmount" className="text-xs font-medium text-teal flex items-center justify-between">
                      <span>👨‍💼 Anand</span>
                      <span className="text-[10px] text-muted-foreground">Anand Wallet</span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-teal text-xs font-medium">₹</span>
                      <Input
                        id="anandAmount"
                        type="number"
                        value={partneredAnandAmount}
                        onChange={(e) => setPartneredAnandAmount(e.target.value)}
                        placeholder="0"
                        className="bg-card/60 border-teal/30 focus:border-teal pl-7 h-9 text-sm font-semibold"
                        min="0"
                        step="1"
                      />
                    </div>
                  </div>

                  {/* Partner Amount */}
                  <div className="space-y-1.5 p-3 rounded-lg bg-purple-500/5 border border-purple-500/20">
                    <Label htmlFor="partnerWalletAmount" className="text-xs font-medium text-purple-400 flex items-center justify-between">
                      <span>🤝 {partneredWith ? `Partner (${partneredWith})` : 'Partner'}</span>
                      <span className="text-[10px] text-muted-foreground">Partner Wallet</span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-purple-400 text-xs font-medium">₹</span>
                      <Input
                        id="partnerWalletAmount"
                        type="number"
                        value={partneredPartnerAmount}
                        onChange={(e) => setPartneredPartnerAmount(e.target.value)}
                        placeholder="0"
                        className="bg-card/60 border-purple-500/30 focus:border-purple-500 pl-7 h-9 text-sm font-semibold"
                        min="0"
                        step="1"
                      />
                    </div>
                  </div>

                  {/* Kaam Done Amount */}
                  <div className="space-y-1.5 p-3 rounded-lg bg-blue/5 border border-blue/20">
                    <Label htmlFor="kaamDoneAmount" className="text-xs font-medium text-blue flex items-center justify-between">
                      <span>🏢 Kaam Done</span>
                      <span className="text-[10px] text-muted-foreground">Kaam Done Wallet</span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-blue text-xs font-medium">₹</span>
                      <Input
                        id="kaamDoneAmount"
                        type="number"
                        value={partneredKaamDoneAmount}
                        onChange={(e) => setPartneredKaamDoneAmount(e.target.value)}
                        placeholder="0"
                        className="bg-card/60 border-blue/30 focus:border-blue pl-7 h-9 text-sm font-semibold"
                        min="0"
                        step="1"
                      />
                    </div>
                  </div>
                </div>

                {/* Live Distribution Progress Bar */}
                {partneredDistribution.total > 0 && (
                  <div className="p-3 rounded-lg bg-card/60 border border-border/30 space-y-2 text-xs">
                    <div className="flex justify-between items-center text-muted-foreground">
                      <span>
                        Allocated: <strong className="text-foreground">{formatCurrency(partneredDistribution.allocated)}</strong>
                      </span>
                      <span>
                        Total: <strong className="text-foreground">{formatCurrency(partneredDistribution.total)}</strong>
                      </span>
                    </div>

                    <div className="w-full bg-secondary h-2 rounded-full overflow-hidden flex">
                      {partneredDistribution.roshan > 0 && (
                        <div
                          style={{ width: `${(partneredDistribution.roshan / partneredDistribution.total) * 100}%` }}
                          className="bg-gold h-full"
                          title={`Roshan: ${formatCurrency(partneredDistribution.roshan)}`}
                        />
                      )}
                      {partneredDistribution.anand > 0 && (
                        <div
                          style={{ width: `${(partneredDistribution.anand / partneredDistribution.total) * 100}%` }}
                          className="bg-teal h-full"
                          title={`Anand: ${formatCurrency(partneredDistribution.anand)}`}
                        />
                      )}
                      {partneredDistribution.partner > 0 && (
                        <div
                          style={{ width: `${(partneredDistribution.partner / partneredDistribution.total) * 100}%` }}
                          className="bg-purple-500 h-full"
                          title={`Partner: ${formatCurrency(partneredDistribution.partner)}`}
                        />
                      )}
                      {partneredDistribution.kaamDone > 0 && (
                        <div
                          style={{ width: `${(partneredDistribution.kaamDone / partneredDistribution.total) * 100}%` }}
                          className="bg-blue h-full"
                          title={`Kaam Done: ${formatCurrency(partneredDistribution.kaamDone)}`}
                        />
                      )}
                    </div>

                    {partneredDistribution.isOver && (
                      <p className="text-red-400 text-[11px] flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        Sum of the 4 amounts exceeds Total Amount by {formatCurrency(Math.abs(partneredDistribution.remaining))}.
                      </p>
                    )}
                    {partneredDistribution.isUnder && (
                      <p className="text-amber-400 text-[11px] mt-1">
                        Please allocate the remaining {formatCurrency(partneredDistribution.remaining)} across the fields.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* 5. Client Details & Purpose */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border/30">
                <div className="space-y-2">
                  <Label htmlFor="partneredClientName" className="text-sm font-medium text-foreground flex items-center gap-2">
                    <User className="w-4 h-4 text-teal" />
                    5. Client Name *
                  </Label>
                  <Input
                    id="partneredClientName"
                    value={partneredClientName}
                    onChange={(e) => setPartneredClientName(e.target.value)}
                    placeholder="Enter client name"
                    className="bg-secondary/30 border-border/30 focus:border-teal/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="partneredClientPhone" className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Phone className="w-4 h-4 text-teal" />
                    Phone Number
                  </Label>
                  <Input
                    id="partneredClientPhone"
                    value={partneredClientPhone}
                    onChange={(e) => setPartneredClientPhone(e.target.value)}
                    placeholder="Enter phone number"
                    className="bg-secondary/30 border-border/30 focus:border-teal/50"
                  />
                </div>
              </div>

              {/* Purpose */}
              <div className="space-y-2">
                <Label htmlFor="partneredPurpose" className="text-sm font-medium text-foreground flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue" />
                  Purpose / What work we did? *
                </Label>
                <Textarea
                  id="partneredPurpose"
                  value={partneredPurpose}
                  onChange={(e) => setPartneredPurpose(e.target.value)}
                  placeholder="Describe the partnered work..."
                  rows={3}
                  className="bg-secondary/30 border-border/30 focus:border-teal/50 resize-none"
                />
              </div>

              {/* Submit Button */}
              <Button
                onClick={handlePartneredSubmit}
                disabled={
                  submitting ||
                  !partneredStarter ||
                  !partneredWith.trim() ||
                  !partneredClientName.trim() ||
                  !partneredPurpose.trim() ||
                  !partneredTotalAmount ||
                  !partneredDistribution.isExact
                }
                className="w-full bg-gradient-to-r from-teal via-purple-500 to-gold text-black font-bold hover:opacity-90 h-12 text-base disabled:opacity-50"
              >
                {submitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Creating Partnered Ticket...
                  </div>
                ) : (
                  <>
                    <Users className="w-5 h-5 mr-2" />
                    Open Partnered Ticket
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
