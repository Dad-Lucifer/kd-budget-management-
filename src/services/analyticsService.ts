import {
  collection,
  getDocs,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AnalyticsData, Transaction } from '@/lib/types';

const timestampToISO = (timestamp: Timestamp | null): string | null => {
  if (!timestamp) return null;
  return timestamp.toDate().toISOString();
};

export async function getAnalytics(period: string = 'all'): Promise<AnalyticsData> {
  try {
    // Get all tickets
    const ticketsQuery = query(collection(db, 'tickets'), orderBy('createdAt', 'desc'));
    const ticketsSnap = await getDocs(ticketsQuery);
    const tickets = ticketsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Get wallets
    const walletsQuery = query(collection(db, 'wallets'));
    const walletsSnap = await getDocs(walletsQuery);
    const wallets = walletsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Get all transactions
    const transactionsQuery = query(collection(db, 'transactions'), orderBy('createdAt', 'desc'));
    const transactionsSnap = await getDocs(transactionsQuery);
    const transactions = transactionsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Filter by period
    const now = new Date();
    let filteredTickets = tickets as any[];
    if (period === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      filteredTickets = tickets.filter((t: any) => {
        const createdAt = (t.createdAt as Timestamp)?.toDate() || new Date();
        return createdAt >= startOfMonth;
      });
    } else if (period === 'week') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      filteredTickets = tickets.filter((t: any) => {
        const createdAt = (t.createdAt as Timestamp)?.toDate() || new Date();
        return createdAt >= startOfWeek;
      });
    }

    // 1. Earnings Comparison - Lifetime earnings by person
    const roshanEarnings = tickets
      .filter((t: any) => t.starter === 'Roshan')
      .reduce((sum: number, t: any) => sum + t.starterAmount, 0);
    const roshanPartnerEarnings = tickets
      .filter((t: any) => t.starter === 'Anand')
      .reduce((sum: number, t: any) => sum + t.partnerAmount, 0);
    const anandEarnings = tickets
      .filter((t: any) => t.starter === 'Anand')
      .reduce((sum: number, t: any) => sum + t.starterAmount, 0);
    const anandPartnerEarnings = tickets
      .filter((t: any) => t.starter === 'Roshan')
      .reduce((sum: number, t: any) => sum + t.partnerAmount, 0);

    // 2. Wallet Growth - Monthly data
    const monthlyData: Record<string, { roshan: number; anand: number; kaamDone: number; total: number }> = {};
    tickets.forEach((t: any) => {
      const date = (t.createdAt as Timestamp)?.toDate() || new Date();
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyData[key]) {
        monthlyData[key] = { roshan: 0, anand: 0, kaamDone: 0, total: 0 };
      }

      if (t.starter === 'Roshan') {
        monthlyData[key].roshan += t.starterAmount;
        monthlyData[key].anand += t.partnerAmount;
      } else {
        monthlyData[key].anand += t.starterAmount;
        monthlyData[key].roshan += t.partnerAmount;
      }
      monthlyData[key].kaamDone += t.kaamDoneAmount;
      monthlyData[key].total += t.totalAmount;
    });

    const monthlyGrowth = Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({ month, ...data }));

    // 3. Project Volume - Ticket count by starter
    const roshanStarted = tickets.filter((t: any) => t.starter === 'Roshan').length;
    const anandStarted = tickets.filter((t: any) => t.starter === 'Anand').length;
    const totalTickets = tickets.length;
    const openTickets = tickets.filter((t: any) => t.status === 'open').length;
    const closedTickets = tickets.filter((t: any) => t.status === 'closed').length;

    // 4. Total revenue
    const totalRevenue = tickets.reduce((sum: number, t: any) => sum + t.totalAmount, 0);
    const filteredRevenue = (filteredTickets as any[]).reduce((sum: number, t: any) => sum + t.totalAmount, 0);

    // 5. Recent transactions for activity feed
    const recentTransactions = transactions.slice(0, 20).map((tx: any) => {
      const wallet = wallets.find((w: any) => w.id === tx.walletId || w.name === tx.walletId);
      return {
        id: tx.id,
        walletId: tx.walletId,
        walletName: (wallet as any)?.name || 'Unknown',
        ticketId: tx.ticketId || undefined,
        type: tx.type,
        amount: tx.amount,
        reason: tx.reason,
        createdAt: timestampToISO(tx.createdAt as Timestamp) || new Date().toISOString(),
      } as Transaction;
    });

    return {
      earnings: {
        roshan: { asStarter: roshanEarnings, asPartner: roshanPartnerEarnings, total: roshanEarnings + roshanPartnerEarnings },
        anand: { asStarter: anandEarnings, asPartner: anandPartnerEarnings, total: anandEarnings + anandPartnerEarnings },
      },
      monthlyGrowth,
      volume: {
        roshanStarted,
        anandStarted,
        totalTickets,
        openTickets,
        closedTickets,
      },
      revenue: {
        total: totalRevenue,
        filtered: filteredRevenue,
        period,
      },
      wallets: wallets.map((w: any) => ({
        name: w.name,
        balance: w.balance,
        totalIn: w.totalIn,
        totalOut: w.totalOut,
      })),
      recentTransactions,
    };
  } catch (error) {
    console.error('Analytics error:', error);
    throw error;
  }
}
