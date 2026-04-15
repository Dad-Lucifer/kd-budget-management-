import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const wallets = ['Roshan', 'Anand', 'KaamDone'];

    for (const name of wallets) {
      const existing = await db.wallet.findUnique({ where: { name } });
      if (!existing) {
        await db.wallet.create({
          data: { name, balance: 0, totalIn: 0, totalOut: 0 },
        });
      }
    }

    const allWallets = await db.wallet.findMany();
    return NextResponse.json({ wallets: allWallets });
  } catch (error) {
    console.error('Init error:', error);
    return NextResponse.json({ error: 'Failed to initialize wallets' }, { status: 500 });
  }
}
