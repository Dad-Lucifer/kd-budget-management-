import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletName, amount, reason } = body;

    if (!walletName || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const withdrawAmount = parseFloat(amount);
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const wallet = await db.wallet.findUnique({ where: { name: walletName } });
    if (!wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }

    if (wallet.balance < withdrawAmount) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
    }

    const result = await db.$transaction(async (tx) => {
      const updatedWallet = await tx.wallet.update({
        where: { name: walletName },
        data: {
          balance: wallet.balance - withdrawAmount,
          totalOut: wallet.totalOut + withdrawAmount,
        },
      });

      const transaction = await tx.transaction.create({
        data: {
          walletId: wallet.id,
          type: 'debit',
          amount: withdrawAmount,
          reason: reason || 'withdrawal',
        },
      });

      return { wallet: updatedWallet, transaction };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Withdraw error:', error);
    return NextResponse.json({ error: 'Failed to process withdrawal' }, { status: 500 });
  }
}
