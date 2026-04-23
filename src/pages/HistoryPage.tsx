import { useState, useEffect } from 'react';
import { Ticket, Transaction } from '@/lib/types';
import { formatCurrency, formatDate, getWalletColorClasses } from '@/lib/helpers';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  History,
  CheckCircle2,
  ArrowDownRight,
  Wallet,
  Users,
  Calendar,
} from 'lucide-react';

interface HistoryPageProps {
  tickets: Ticket[];
  loading: boolean;
}

type HistoryItem = {
  id: string;
  type: 'ticket' | 'withdrawal';
  date: string;
  amount: number;
  description: string;
  subDescription?: string;
  starter?: string;
  partner?: string;
  kaamDone?: number;
  colors: {
    bg: string;
    border: string;
    text: string;
    badge: string;
  };
  raw: Ticket | Transaction;
};

export function HistoryPage({ tickets, loading }: HistoryPageProps) {
  const [withdrawals, setWithdrawals] = useState<Transaction[]>([]);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(true);
  const [activeView, setActiveView] = useState<'all' | 'tickets' | 'withdrawals'>('all');

  useEffect(() => {
    const fetchWithdrawals = async () => {
      setLoadingWithdrawals(true);
      try {
        const { getWithdrawals } = await import('@/services/walletService');
        const data = await getWithdrawals();
        setWithdrawals(data || []);
      } catch (error) {
        console.error('Fetch withdrawals error:', error);
        setWithdrawals([]);
      } finally {
        setLoadingWithdrawals(false);
      }
    };
    fetchWithdrawals();
  }, [tickets]);

  if (loading || loadingWithdrawals) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 rounded-lg bg-card animate-pulse border border-border/30" />
        ))}
      </div>
    );
  }

  if (tickets.length === 0 && withdrawals.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 rounded-full bg-gold/15 flex items-center justify-center mx-auto mb-4">
          <History className="w-8 h-8 text-gold" />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-1">No History Yet</h3>
        <p className="text-sm text-muted-foreground">Closed tickets and withdrawals will appear here.</p>
      </div>
    );
  }

  const totalRevenue = tickets.reduce((sum, t) => sum + t.totalAmount, 0);
  const totalWithdrawn = withdrawals.reduce((sum, w) => sum + w.amount, 0);

  const ticketItems: HistoryItem[] = tickets.map((ticket) => {
    const colors = getWalletColorClasses(ticket.starter);
    const partner = ticket.starter === 'Roshan' ? 'Anand' : 'Roshan';
    return {
      id: ticket.id,
      type: 'ticket',
      date: ticket.closedAt || ticket.createdAt,
      amount: ticket.totalAmount,
      description: `${ticket.clientName}`,
      subDescription: ticket.purpose,
      starter: ticket.starter,
      partner: partner,
      kaamDone: ticket.kaamDoneAmount,
      colors,
      raw: ticket,
    };
  });

  const withdrawalItems: HistoryItem[] = withdrawals.map((withdrawal) => {
    const withdrawnBy = withdrawal.reason.includes('by Roshan') ? 'Roshan' :
                       withdrawal.reason.includes('by Anand') ? 'Anand' : 'Unknown';
    const colors = getWalletColorClasses(withdrawnBy);
    return {
      id: withdrawal.id,
      type: 'withdrawal',
      date: withdrawal.createdAt,
      amount: withdrawal.amount,
      description: `Withdrawn by ${withdrawnBy}`,
      subDescription: withdrawal.reason && !withdrawal.reason.startsWith('Withdrawal by') ? withdrawal.reason : undefined,
      colors,
      raw: withdrawal,
    };
  });

  const allItems: HistoryItem[] = [...ticketItems, ...withdrawalItems].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const getFilteredItems = () => {
    if (activeView === 'tickets') return ticketItems;
    if (activeView === 'withdrawals') return withdrawalItems;
    return allItems;
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-card/80 border-gold/20">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <History className="w-3 h-3 text-gold" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Closed</span>
            </div>
            <p className="text-xl font-bold text-gold">{tickets.length}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{formatCurrency(totalRevenue)}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/80 border-teal/20">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <ArrowDownRight className="w-3 h-3 text-red-400" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Withdrawn</span>
            </div>
            <p className="text-xl font-bold text-red-400">{withdrawals.length}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{formatCurrency(totalWithdrawn)}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/80 border-blue/20">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="w-3 h-3 text-blue" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Net</span>
            </div>
            <p className="text-xl font-bold text-blue">{formatCurrency(totalRevenue - totalWithdrawn)}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">In wallet</p>
          </CardContent>
        </Card>
        <Card className="bg-card/80 border-border/30">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Period</span>
            </div>
            <p className="text-sm font-medium text-foreground">
              {allItems.length > 0 ? (
                <>
                  {new Date(allItems[allItems.length - 1].date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                  <span className="text-muted-foreground"> - </span>
                  {new Date(allItems[0].date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: '2-digit' })}
                </>
              ) : '-'}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{allItems.length} events</p>
          </CardContent>
        </Card>
      </div>

      {/* View Toggle */}
      <Tabs value={activeView} onValueChange={(v) => setActiveView(v as typeof activeView)}>
        <TabsList className="w-full justify-start h-auto p-1 bg-card/50 border border-border/30">
          <TabsTrigger value="all" className="text-xs px-3 py-1.5">
            All Activity
          </TabsTrigger>
          <TabsTrigger value="tickets" className="text-xs px-3 py-1.5">
            Tickets Only
          </TabsTrigger>
          <TabsTrigger value="withdrawals" className="text-xs px-3 py-1.5">
            Withdrawals Only
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeView} className="mt-4 space-y-3">
          {getFilteredItems().length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No items to display</div>
          ) : (
            getFilteredItems().map((item, index) => (
              <Card
                key={item.id}
                className={`bg-card/60 border-l-2 ${item.type === 'ticket' ? 'border-l-gold' : 'border-l-red-400'} hover:bg-card/80 transition-colors`}
              >
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.colors.bg}`}>
                      {item.type === 'ticket' ? (
                        <CheckCircle2 className={`w-4 h-4 ${item.colors.text}`} />
                      ) : (
                        <ArrowDownRight className={`w-4 h-4 ${item.colors.text}`} />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="text-sm font-medium text-foreground truncate">
                          {item.type === 'ticket' ? (
                            <>Ticket #{((item.raw as Ticket).ticketNo)}</>
                          ) : (
                            item.description
                          )}
                        </p>
                        <p className={`text-sm font-bold shrink-0 ${item.type === 'ticket' ? 'text-gold' : 'text-red-400'}`}>
                          {item.type === 'ticket' ? (
                            <>+{formatCurrency(item.amount)}</>
                          ) : (
                            <>-{formatCurrency(item.amount)}</>
                          )}
                        </p>
                      </div>

                      {item.type === 'ticket' ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <Users className="w-3 h-3" />
                            <span className={item.colors.text}>{(item.raw as Ticket).starter}</span>
                            <span>→</span>
                            <span className="text-teal">{item.partner}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <span>Client:</span>
                            <span className="text-foreground">{(item.raw as Ticket).clientName}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <span>Splits:</span>
                            <span className="text-gold">{(item.raw as Ticket).starterAmount}</span>
                            <span className="text-teal">{(item.raw as Ticket).partnerAmount}</span>
                            <span className="text-blue">{(item.raw as Ticket).kaamDoneAmount}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {item.subDescription && (
                            <p className="text-[10px] text-muted-foreground truncate">{item.subDescription}</p>
                          )}
                          <p className="text-[10px] text-muted-foreground">Kaam Done Wallet</p>
                        </div>
                      )}
                    </div>

                    {/* Date */}
                    <div className="text-[10px] text-muted-foreground shrink-0 text-right">
                      {new Date(item.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                      <br />
                      {new Date(item.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}