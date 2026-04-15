import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where = status ? { status } : {};

    const tickets = await db.ticket.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { transactions: true },
    });

    return NextResponse.json({ tickets });
  } catch (error) {
    console.error('Get tickets error:', error);
    return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { starter, clientName, clientPhone, purpose, totalAmount } = body;

    if (!starter || !clientName || !purpose || !totalAmount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const total = parseFloat(totalAmount);
    if (isNaN(total) || total <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    // Nested Split Logic:
    // Starter gets 50% of total
    // Partner gets 60% of remainder
    // KaamDone gets 40% of remainder
    const starterAmount = Math.round(total * 0.5 * 100) / 100;
    const remainder = Math.round((total - starterAmount) * 100) / 100;
    const partnerAmount = Math.round(remainder * 0.6 * 100) / 100;
    const kaamDoneAmount = Math.round(remainder * 0.4 * 100) / 100;

    // Determine partner based on starter
    const partner = starter === 'Roshan' ? 'Anand' : 'Roshan';

    // Get next ticket number
    const lastTicket = await db.ticket.findFirst({
      orderBy: { ticketNo: 'desc' },
      select: { ticketNo: true },
    });
    const ticketNo = (lastTicket?.ticketNo || 0) + 1;

    // Create ticket and update wallets in a transaction
    const result = await db.$transaction(async (tx) => {
      const ticket = await tx.ticket.create({
        data: {
          ticketNo,
          starter,
          clientName,
          clientPhone: clientPhone || '',
          purpose,
          totalAmount: total,
          starterAmount,
          partnerAmount,
          kaamDoneAmount,
          status: 'open',
        },
      });

      // Credit starter wallet
      const starterWallet = await tx.wallet.findUnique({ where: { name: starter } });
      if (starterWallet) {
        await tx.wallet.update({
          where: { name: starter },
          data: {
            balance: starterWallet.balance + starterAmount,
            totalIn: starterWallet.totalIn + starterAmount,
          },
        });
        await tx.transaction.create({
          data: {
            walletId: starterWallet.id,
            ticketId: ticket.id,
            type: 'credit',
            amount: starterAmount,
            reason: 'ticket_split',
          },
        });
      }

      // Credit partner wallet
      const partnerWallet = await tx.wallet.findUnique({ where: { name: partner } });
      if (partnerWallet) {
        await tx.wallet.update({
          where: { name: partner },
          data: {
            balance: partnerWallet.balance + partnerAmount,
            totalIn: partnerWallet.totalIn + partnerAmount,
          },
        });
        await tx.transaction.create({
          data: {
            walletId: partnerWallet.id,
            ticketId: ticket.id,
            type: 'credit',
            amount: partnerAmount,
            reason: 'ticket_split',
          },
        });
      }

      // Credit KaamDone wallet
      const kaamDoneWallet = await tx.wallet.findUnique({ where: { name: 'KaamDone' } });
      if (kaamDoneWallet) {
        await tx.wallet.update({
          where: { name: 'KaamDone' },
          data: {
            balance: kaamDoneWallet.balance + kaamDoneAmount,
            totalIn: kaamDoneWallet.totalIn + kaamDoneAmount,
          },
        });
        await tx.transaction.create({
          data: {
            walletId: kaamDoneWallet.id,
            ticketId: ticket.id,
            type: 'credit',
            amount: kaamDoneAmount,
            reason: 'ticket_split',
          },
        });
      }

      return ticket;
    });

    return NextResponse.json({ ticket: result }, { status: 201 });
  } catch (error) {
    console.error('Create ticket error:', error);
    return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 });
  }
}
