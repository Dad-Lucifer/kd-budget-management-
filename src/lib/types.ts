export interface Wallet {
  id: string;
  name: string;
  balance: number;
  totalIn: number;
  totalOut: number;
  createdAt: string;
  updatedAt: string;
  transactions?: Transaction[];
}

export interface Ticket {
  id: string;
  ticketNo: number;
  starter: string;
  clientName: string;
  clientPhone: string;
  purpose: string;
  totalAmount: number;
  starterAmount: number;
  partnerAmount: number;
  kaamDoneAmount: number;
  status: 'open' | 'closed';
  createdAt: string;
  closedAt: string | null;
  transactions?: Transaction[];
}

export interface Transaction {
  id: string;
  walletId: string;
  walletName?: string;
  ticketId?: string;
  type: 'credit' | 'debit';
  amount: number;
  reason: string;
  createdAt: string;
}

export interface AnalyticsData {
  earnings: {
    roshan: { asStarter: number; asPartner: number; total: number };
    anand: { asStarter: number; asPartner: number; total: number };
  };
  monthlyGrowth: Array<{
    month: string;
    roshan: number;
    anand: number;
    kaamDone: number;
    total: number;
  }>;
  volume: {
    roshanStarted: number;
    anandStarted: number;
    totalTickets: number;
    openTickets: number;
    closedTickets: number;
  };
  revenue: {
    total: number;
    filtered: number;
    period: string;
  };
  wallets: Array<{
    name: string;
    balance: number;
    totalIn: number;
    totalOut: number;
  }>;
  recentTransactions: Transaction[];
}

export type TabName = 'dashboard' | 'new-work' | 'active' | 'history' | 'analytics';
