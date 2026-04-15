import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ticket = await db.ticket.findUnique({ where: { id } });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    if (ticket.status === 'closed') {
      return NextResponse.json({ error: 'Ticket already closed' }, { status: 400 });
    }

    const updatedTicket = await db.ticket.update({
      where: { id },
      data: {
        status: 'closed',
        closedAt: new Date(),
      },
    });

    return NextResponse.json({ ticket: updatedTicket });
  } catch (error) {
    console.error('Close ticket error:', error);
    return NextResponse.json({ error: 'Failed to close ticket' }, { status: 500 });
  }
}
