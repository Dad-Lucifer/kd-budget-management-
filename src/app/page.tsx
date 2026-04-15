'use client';

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
import { DashboardTab } from '@/components/tabs/DashboardTab';
import { NewWorkTab } from '@/components/tabs/NewWorkTab';
import { ActiveTicketsTab } from '@/components/tabs/ActiveTicketsTab';
import { HistoryTab } from '@/components/tabs/HistoryTab';
import { AnalyticsTab } from '@/components/tabs/AnalyticsTab';
import { WithdrawDialog } from '@/components/shared/WithdrawDialog';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/helpers';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabName>('dashboard');
  const [wallets, setWallets] = useState<WalletType[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  // Initialize wallets on first load
  const initWallets = useCallback(async () => {
    try {
      await fetch('/api/init', { method: 'POST' });
    } catch (e) {
      console.error('Init error:', e);
    }
  }, []);

  const fetchWallets = useCallback(async () => {
    try {
      const res = await fetch('/api/wallets');
      const data = await res.json();
      setWallets(data.wallets || []);
    } catch (e) {
      console.error('Fetch wallets error:', e);
    }
  }, []);

  const fetchTickets = useCallback(async (status?: string) => {
    try {
      const url = status ? `/api/tickets?status=${status}` : '/api/tickets';
      const res = await fetch(url);
      const data = await res.json();
      setTickets(data.tickets || []);
    } catch (e) {
      console.error('Fetch tickets error:', e);
    }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch('/api/analytics');
      const data = await res.json();
      setAnalytics(data);
    } catch (e) {
      console.error('Fetch analytics error:', e);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchWallets(), fetchTickets(), fetchAnalytics()]);
    setLoading(false);
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
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gold via-teal to-blue flex items-center justify-center">
              <Wallet className="w-5 h-5 text-black" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground tracking-tight">AgencyBudget</h1>
              <p className="text-[11px] text-muted-foreground -mt-0.5">Smart Split Manager</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 border border-border/50">
              <TrendingUp className="w-3.5 h-3.5 text-gold" />
              <span className="text-xs text-muted-foreground">Total Balance:</span>
              <span className="text-sm font-bold text-gold">{formatCurrency(totalBalance)}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setWithdrawOpen(true)}
              className="border-border/50 text-muted-foreground hover:text-foreground hover:border-gold/50"
            >
              <Wallet className="w-4 h-4 mr-1.5" />
              Withdraw
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabName)} className="space-y-4">
          <TabsList className="bg-card border border-border/50 p-1 h-auto flex-wrap gap-1">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-gold/15 data-[state=active]:text-gold gap-1.5 text-xs sm:text-sm">
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="new-work" className="data-[state=active]:bg-teal/15 data-[state=active]:text-teal gap-1.5 text-xs sm:text-sm">
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">New Work</span>
            </TabsTrigger>
            <TabsTrigger value="active" className="data-[state=active]:bg-blue/15 data-[state=active]:text-blue gap-1.5 text-xs sm:text-sm">
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">Active</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-gold/15 data-[state=active]:text-gold gap-1.5 text-xs sm:text-sm">
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">History</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-teal/15 data-[state=active]:text-teal gap-1.5 text-xs sm:text-sm">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <DashboardTab
              wallets={wallets}
              tickets={tickets}
              analytics={analytics}
              loading={loading}
              onNavigate={setActiveTab}
            />
          </TabsContent>

          <TabsContent value="new-work">
            <NewWorkTab onTicketCreated={refreshAll} />
          </TabsContent>

          <TabsContent value="active">
            <ActiveTicketsTab
              tickets={tickets.filter((t) => t.status === 'open')}
              loading={loading}
              onTicketClosed={refreshAll}
            />
          </TabsContent>

          <TabsContent value="history">
            <HistoryTab
              tickets={tickets.filter((t) => t.status === 'closed')}
              loading={loading}
            />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsTab
              analytics={analytics}
              loading={loading}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/30 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            AgencyBudget © {new Date().getFullYear()}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Split Logic:</span>
            <span className="text-xs text-gold font-medium">Starter 50%</span>
            <span className="text-xs text-muted-foreground">→</span>
            <span className="text-xs text-teal font-medium">Partner 60%r</span>
            <span className="text-xs text-muted-foreground">→</span>
            <span className="text-xs text-blue font-medium">KaamDone 40%r</span>
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
