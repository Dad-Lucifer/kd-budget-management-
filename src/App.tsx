import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LayoutDashboard,
  PlusCircle,
  Clock,
  History,
  BarChart3,
  Wallet,
  TrendingUp,
} from 'lucide-react';
import { TabName, Wallet as WalletType, Ticket, AnalyticsData } from '@/lib/types';
import { DashboardPage } from '@/pages/DashboardPage';
import { NewWorkPage } from '@/pages/NewWorkPage';
import { ActiveTicketsPage } from '@/pages/ActiveTicketsPage';
import { HistoryPage } from '@/pages/HistoryPage';
import { AnalyticsPage } from '@/pages/AnalyticsPage';
import { WithdrawDialog } from '@/components/shared/WithdrawDialog';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/helpers';
import { initializeWallets, getWallets } from '@/services/walletService';
import { getTickets } from '@/services/ticketService';
import { getAnalytics } from '@/services/analyticsService';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabName>('dashboard');
  const [wallets, setWallets] = useState<WalletType[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  // Initialize wallets on first load
  const initWallets = useCallback(async () => {
    try {
      await initializeWallets();
    } catch (e) {
      console.error('Init error:', e);
    }
  }, []);

  const fetchWallets = useCallback(async () => {
    try {
      const data = await getWallets();
      setWallets(data || []);
    } catch (e) {
      console.error('Fetch wallets error:', e);
    }
  }, []);

  const fetchTickets = useCallback(async (status?: string) => {
    try {
      const data = await getTickets(status);
      setTickets(data || []);
    } catch (e) {
      console.error('Fetch tickets error:', e);
    }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    try {
      const data = await getAnalytics('all');
      setAnalytics(data);
    } catch (e) {
      console.error('Fetch analytics error:', e);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    try {
      await fetchWallets();
      await new Promise(resolve => setTimeout(resolve, 500));
      await fetchTickets();
      await fetchAnalytics();
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchWallets, fetchTickets, fetchAnalytics]);

  useEffect(() => {
    const init = async () => {
      await initWallets();
      await refreshAll();
    };
    init();
  }, [initWallets, refreshAll]);

  const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <img src="/money.png" alt="AgencyBudget" className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg object-cover shrink-0" />
            <div className="min-w-0">
              <h1 className="text-sm sm:text-lg font-bold text-foreground tracking-tight truncate">AgencyBudget</h1>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground -mt-0.5 hidden xs:block sm:block truncate">Smart Split Manager</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-secondary/50 border border-border/50">
              <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gold shrink-0" />
              <span className="text-[10px] sm:text-xs text-muted-foreground hidden sm:inline">Total:</span>
              <span className="text-xs sm:text-sm font-bold text-gold whitespace-nowrap">{formatCurrency(totalBalance)}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setWithdrawOpen(true)}
              className="border-border/50 text-muted-foreground hover:text-foreground hover:border-gold/50 h-8 sm:h-9 px-2 sm:px-3 text-xs"
            >
              <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Withdraw</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-3 sm:py-4 pb-20 sm:pb-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabName)} className="space-y-4">
          <TabsList className="bg-card/80 border border-border/50 p-1 h-auto grid grid-cols-5 w-full gap-1 sticky top-14 sm:static z-40 backdrop-blur-md">
            <TabsTrigger
              value="dashboard"
              className="data-[state=active]:bg-gold/15 data-[state=active]:text-gold flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 py-1.5 sm:py-2 px-1 text-[10px] sm:text-xs min-w-0"
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span className="truncate">Home</span>
            </TabsTrigger>
            <TabsTrigger
              value="new-work"
              className="data-[state=active]:bg-teal/15 data-[state=active]:text-teal flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 py-1.5 sm:py-2 px-1 text-[10px] sm:text-xs min-w-0"
            >
              <PlusCircle className="w-4 h-4 shrink-0" />
              <span className="truncate">New</span>
            </TabsTrigger>
            <TabsTrigger
              value="active"
              className="data-[state=active]:bg-blue/15 data-[state=active]:text-blue flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 py-1.5 sm:py-2 px-1 text-[10px] sm:text-xs min-w-0"
            >
              <Clock className="w-4 h-4 shrink-0" />
              <span className="truncate">Active</span>
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="data-[state=active]:bg-gold/15 data-[state=active]:text-gold flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 py-1.5 sm:py-2 px-1 text-[10px] sm:text-xs min-w-0"
            >
              <History className="w-4 h-4 shrink-0" />
              <span className="truncate">History</span>
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="data-[state=active]:bg-teal/15 data-[state=active]:text-teal flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 py-1.5 sm:py-2 px-1 text-[10px] sm:text-xs min-w-0"
            >
              <BarChart3 className="w-4 h-4 shrink-0" />
              <span className="truncate">Stats</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <DashboardPage
              wallets={wallets}
              tickets={tickets}
              analytics={analytics}
              loading={loading}
              onNavigate={setActiveTab}
            />
          </TabsContent>

          <TabsContent value="new-work">
            <NewWorkPage onTicketCreated={refreshAll} />
          </TabsContent>

          <TabsContent value="active">
            <ActiveTicketsPage
              tickets={tickets.filter((t) => t.status === 'open')}
              loading={loading}
              onTicketClosed={refreshAll}
            />
          </TabsContent>

          <TabsContent value="history">
            <HistoryPage
              tickets={tickets.filter((t) => t.status === 'closed')}
              loading={loading}
            />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsPage
              analytics={analytics}
              loading={loading}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/30 mt-auto">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <p className="text-[11px] sm:text-xs text-muted-foreground">
            AgencyBudget © {new Date().getFullYear()}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
            <span className="text-[11px] sm:text-xs text-muted-foreground">Split Logic:</span>
            <span className="text-[11px] sm:text-xs text-gold font-medium">Starter 50%</span>
            <span className="text-[11px] sm:text-xs text-muted-foreground">→</span>
            <span className="text-[11px] sm:text-xs text-teal font-medium">Partner 60%r</span>
            <span className="text-[11px] sm:text-xs text-muted-foreground">→</span>
            <span className="text-[11px] sm:text-xs text-blue font-medium">KaamDone 40%r</span>
          </div>
        </div>
      </footer>

      {/* Withdraw Dialog */}
      <WithdrawDialog
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
        wallets={wallets}
        onWithdraw={refreshAll}
      />
    </div>
  );
}
