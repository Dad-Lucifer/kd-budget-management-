import { Wallet, Ticket, AnalyticsData, TabName } from '@/lib/types';
import { formatCurrency, formatDate, getWalletColorClasses } from '@/lib/helpers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Wallet as WalletIcon,
  ArrowUpRight,
  ArrowDownRight,
  PlusCircle,
  Clock,
  BarChart3,
  TrendingUp,
  Activity,
} from 'lucide-react';

interface DashboardPageProps {
  wallets: Wallet[];
  tickets: Ticket[];
  analytics: AnalyticsData | null;
  loading: boolean;
  onNavigate: (tab: TabName) => void;
}

export function DashboardPage({ wallets, tickets, analytics, loading, onNavigate }: DashboardPageProps) {
  const openTickets = tickets.filter((t) => t.status === 'open');
  const recentTickets = tickets.slice(0, 5);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 rounded-xl bg-card animate-pulse border border-border/30" />
          ))}
        </div>
        <div className="h-64 rounded-xl bg-card animate-pulse border border-border/30" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-card/80 border-border/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-gold" />
              <span className="text-xs text-muted-foreground">Active Tickets</span>
            </div>
            <p className="text-2xl font-bold text-gold">{openTickets.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/80 border-border/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-teal" />
              <span className="text-xs text-muted-foreground">Total Revenue</span>
            </div>
            <p className="text-2xl font-bold text-teal">
              {formatCurrency(analytics?.revenue.total || 0)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card/80 border-border/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-blue" />
              <span className="text-xs text-muted-foreground">Closed Tickets</span>
            </div>
            <p className="text-2xl font-bold text-blue">
              {analytics?.volume.closedTickets || 0}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card/80 border-border/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <WalletIcon className="w-4 h-4 text-gold" />
              <span className="text-xs text-muted-foreground">Total Tickets</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {analytics?.volume.totalTickets || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Wallet Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {wallets.map((wallet) => {
          const colors = getWalletColorClasses(wallet.name);
          const displayName = wallet.name === 'KaamDone' ? 'Kaam Done' : wallet.name;
          return (
            <Card
              key={wallet.id}
              className={`${colors.bg} ${colors.border} ${colors.glow} transition-all duration-300 ${colors.hover}`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className={`text-sm font-medium ${colors.text}`}>
                    {displayName}&apos;s Wallet
                  </CardTitle>
                  <div className={`w-8 h-8 rounded-full ${colors.badge} flex items-center justify-center`}>
                    <WalletIcon className="w-4 h-4" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className={`text-3xl font-bold ${colors.text}`}>
                  {formatCurrency(wallet.balance)}
                </p>
                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <ArrowUpRight className="w-3 h-3 text-green-400" />
                    <span>In: {formatCurrency(wallet.totalIn)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ArrowDownRight className="w-3 h-3 text-red-400" />
                    <span>Out: {formatCurrency(wallet.totalOut)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Tickets */}
        <div className="lg:col-span-2">
          <Card className="bg-card/80 border-border/30">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-foreground">Recent Tickets</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => onNavigate('history')}
                >
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {recentTickets.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">No tickets yet</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 border-teal/30 text-teal hover:bg-teal/10"
                    onClick={() => onNavigate('new-work')}
                  >
                    <PlusCircle className="w-4 h-4 mr-1.5" />
                    Start New Work
                  </Button>
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {recentTickets.map((ticket) => {
                    const colors = getWalletColorClasses(ticket.starter);
                    return (
                      <div
                        key={ticket.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/20 hover:border-border/40 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full ${colors.badge} flex items-center justify-center text-xs font-bold`}>
                            {ticket.starter[0]}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              #{ticket.ticketNo} - {ticket.clientName}
                            </p>
                            <p className="text-xs text-muted-foreground">{ticket.purpose}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-foreground">
                            {formatCurrency(ticket.totalAmount)}
                          </p>
                          <Badge
                            variant={ticket.status === 'open' ? 'default' : 'secondary'}
                            className={`text-[10px] ${
                              ticket.status === 'open'
                                ? 'bg-teal/20 text-teal'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {ticket.status === 'open' ? 'OPEN' : 'CLOSED'}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <Card className="bg-card/80 border-border/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-foreground">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              <Button
                className="w-full bg-teal/20 text-teal hover:bg-teal/30 border border-teal/30 justify-start"
                variant="outline"
                onClick={() => onNavigate('new-work')}
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                Start New Work
              </Button>
              <Button
                className="w-full bg-blue/20 text-blue hover:bg-blue/30 border border-blue/30 justify-start"
                variant="outline"
                onClick={() => onNavigate('active')}
              >
                <Clock className="w-4 h-4 mr-2" />
                View Active ({openTickets.length})
              </Button>
              <Button
                className="w-full bg-gold/20 text-gold hover:bg-gold/30 border border-gold/30 justify-start"
                variant="outline"
                onClick={() => onNavigate('analytics')}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Analytics
              </Button>
            </CardContent>
          </Card>

          {/* Split Logic Info */}
          <Card className="bg-card/80 border-border/30 gradient-border">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-foreground mb-2">💰 Split Logic</p>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span className="text-gold">Starter</span>
                  <span>50% of Total</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-teal">Partner</span>
                  <span>60% of Remainder</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue">Kaam Done</span>
                  <span>40% of Remainder</span>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-border/30">
                <p className="text-[10px] text-muted-foreground">Example: ₹1,000</p>
                <div className="flex gap-3 mt-1">
                  <span className="text-[10px] text-gold">₹500</span>
                  <span className="text-[10px] text-teal">₹300</span>
                  <span className="text-[10px] text-blue">₹200</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
