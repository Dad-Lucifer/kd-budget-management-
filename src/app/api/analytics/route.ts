import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'all'; // 'month', 'week', 'all'

    // Get all tickets
    const tickets = await db.ticket.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Get wallets
    const wallets = await db.wallet.findMany();

    // Get all transactions
    const transactions = await db.transaction.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Filter by period
    const now = new Date();
    let filteredTickets = tickets;
    if (period === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      filteredTickets = tickets.filter((t) => new Date(t.createdAt) >= startOfMonth);
    } else if (period === 'week') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      filteredTickets = tickets.filter((t) => new Date(t.createdAt) >= startOfWeek);
    }

    // 1. Earnings Comparison - Lifetime earnings by person
    const roshanEarnings = tickets
      .filter((t) => t.starter === 'Roshan')
      .reduce((sum, t) => sum + t.starterAmount, 0);
    const roshanPartnerEarnings = tickets
      .filter((t) => t.starter === 'Anand')
      .reduce((sum, t) => sum + t.partnerAmount, 0);
    const anandEarnings = tickets
      .filter((t) => t.starter === 'Anand')
      .reduce((sum, t) => sum + t.starterAmount, 0);
    const anandPartnerEarnings = tickets
      .filter((t) => t.starter === 'Roshan')
      .reduce((sum, t) => sum + t.partnerAmount, 0);

    // 2. Wallet Growth - Monthly data for Kaam Done
    const monthlyData: Record<string, { roshan: number; anand: number; kaamDone: number; total: number }> = {};
    tickets.forEach((t) => {
      const date = new Date(t.createdAt);
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
    const roshanStarted = tickets.filter((t) => t.starter === 'Roshan').length;
    const anandStarted = tickets.filter((t) => t.starter === 'Anand').length;
    const totalTickets = tickets.length;
    const openTickets = tickets.filter((t) => t.status === 'open').length;
    const closedTickets = tickets.filter((t) => t.status === 'closed').length;

    // 4. Total revenue
    const totalRevenue = tickets.reduce((sum, t) => sum + t.totalAmount, 0);
    const filteredRevenue = filteredTickets.reduce((sum, t) => sum + t.totalAmount, 0);

    // 5. Recent transactions for activity feed
    const recentTransactions = transactions.slice(0, 20).map((tx) => {
      const wallet = wallets.find((w) => w.id === tx.walletId);
      return {
        ...tx,
        walletName: wallet?.name || 'Unknown',
      };
    });

    return NextResponse.json({
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
      wallets: wallets.map((w) => ({
        name: w.name,
        balance: w.balance,
        totalIn: w.totalIn,
        totalOut: w.totalOut,
      })),
      recentTransactions,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
