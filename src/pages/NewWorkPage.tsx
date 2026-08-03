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
  const [partneredWith, setPartneredWith] = useState('');
  const [partneredClientName, setPartneredClientName] = useState('');
  const [partneredPurpose, setPartneredPurpose] = useState('');
  const [partneredTotalAmount, setPartneredTotalAmount] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const partneredSplitPreview = useMemo(() => {
    const total = parseFloat(partneredTotalAmount) || 0;
    if (total <= 0 || !partneredStarter) return null;

    const percentages = [40, 20, 20, 20];
    let results = percentages.map(p => (total * p) / 100);
    results = results.map(val => Math.floor(val));

    let totalCalculated = results.reduce((a, b) => a + b, 0);
    let remainder = total - totalCalculated;

    let i = 0;
    while (remainder > 0) {
      results[i]++;
      remainder--;
      i = (i + 1) % results.length;
    }

    const partner = partneredStarter === 'Roshan' ? 'Anand' : 'Roshan';

    return {
      starterAmount: results[0],
      partnerWalletAmount: results[1],
      partnerAmount: results[2],
      kaamDoneAmount: results[3],
      partner,
      total
    };
  }, [partneredTotalAmount, partneredStarter]);

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
    if (!partneredStarter || !partneredWith || !partneredClientName || !partneredPurpose || !partneredTotalAmount) {
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
        description: 'Please enter a valid amount greater than 0.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const data = await createTicket({
        type: 'partnered',
        partneredWith,
        starter: partneredStarter,
        clientName: partneredClientName,
        clientPhone: '',
        purpose: partneredPurpose,
        totalAmount: total,
      });

      setSuccess(true);
      toast({
        title: 'Partnered Ticket Opened! 🎫',
        description: `Ticket #${data.ticketNo} created. ${partneredStarter} gets ${formatCurrency(data.starterAmount)}.`,
      });

      // Reset form after delay
      setTimeout(() => {
        setPartneredStarter('');
        setPartneredWith('');
        setPartneredClientName('');
        setPartneredPurpose('');
        setPartneredTotalAmount('');
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
              {/* Who started work? */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <User className="w-4 h-4 text-teal" />
                  Who started work?
                </Label>
                <RadioGroup value={partneredStarter} onValueChange={setPartneredStarter} className="grid grid-cols-2 gap-3">
                  <Label
                    htmlFor="p_roshan"
                    className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                      partneredStarter === 'Roshan'
                        ? 'border-teal/50 bg-teal/10 glow-teal'
                        : 'border-border/30 bg-secondary/20 hover:border-teal/30'
                    }`}
                  >
                    <RadioGroupItem value="Roshan" id="p_roshan" className="text-teal" />
                    <p className="text-sm font-medium text-teal">Roshan</p>
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
                    <p className="text-sm font-medium text-teal">Anand</p>
                  </Label>
                </RadioGroup>
              </div>

              {/* With whom we partnered? */}
              <div className="space-y-2">
                <Label htmlFor="partneredWith" className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue" />
                  With whom we Partnered? *
                </Label>
                <Input
                  id="partneredWith"
                  value={partneredWith}
                  onChange={(e) => setPartneredWith(e.target.value)}
                  placeholder="Enter partner name"
                  className="bg-secondary/30 border-border/30 focus:border-teal/50"
                />
              </div>

              {/* Client Name */}
              <div className="space-y-2">
                <Label htmlFor="partneredClientName" className="text-sm font-medium text-foreground flex items-center gap-2">
                  <User className="w-4 h-4 text-teal" />
                  Client Name *
                </Label>
                <Input
                  id="partneredClientName"
                  value={partneredClientName}
                  onChange={(e) => setPartneredClientName(e.target.value)}
                  placeholder="Enter client name"
                  className="bg-secondary/30 border-border/30 focus:border-teal/50"
                />
              </div>

              {/* Purpose */}
              <div className="space-y-2">
                <Label htmlFor="partneredPurpose" className="text-sm font-medium text-foreground flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue" />
                  What work we did? *
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

              {/* Total Amount */}
              <div className="space-y-2">
                <Label htmlFor="partneredTotalAmount" className="text-sm font-medium text-foreground flex items-center gap-2">
                  <IndianRupee className="w-4 h-4 text-gold" />
                  Total Amount (₹) *
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

              {/* Split Preview */}
              {partneredSplitPreview && (
                <Card className="bg-card border-gold/20 gradient-border overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-gold" />
                      Partnered Split Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-gold/10 border border-gold/20">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-gold" />
                          <span className="text-sm text-gold font-medium">{partneredStarter} (Starter)</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-gold">{formatCurrency(partneredSplitPreview.starterAmount)}</p>
                          <p className="text-[10px] text-muted-foreground">40% of total</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-purple-500" />
                          <span className="text-sm text-purple-500 font-medium">Partner Wallet</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-purple-500">{formatCurrency(partneredSplitPreview.partnerWalletAmount)}</p>
                          <p className="text-[10px] text-muted-foreground">20% of total</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-teal/10 border border-teal/20">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-teal" />
                          <span className="text-sm text-teal font-medium">{partneredSplitPreview.partner} (Other Owner)</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-teal">{formatCurrency(partneredSplitPreview.partnerAmount)}</p>
                          <p className="text-[10px] text-muted-foreground">20% of total</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-blue/10 border border-blue/20">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-blue" />
                          <span className="text-sm text-blue font-medium">Kaam Done</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-blue">{formatCurrency(partneredSplitPreview.kaamDoneAmount)}</p>
                          <p className="text-[10px] text-muted-foreground">20% of total</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Submit Button */}
              <Button
                onClick={handlePartneredSubmit}
                disabled={submitting || !partneredStarter || !partneredWith || !partneredClientName || !partneredPurpose || !partneredTotalAmount}
                className="w-full bg-gradient-to-r from-teal via-blue to-gold text-black font-bold hover:opacity-90 h-12 text-base disabled:opacity-50"
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
