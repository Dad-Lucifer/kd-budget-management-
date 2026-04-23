import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  runTransaction,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Ticket } from '@/lib/types';

const timestampToISO = (timestamp: Timestamp | null): string | null => {
  if (!timestamp) return null;
  return timestamp.toDate().toISOString();
};

const docToTicket = (doc: any): Ticket => {
  const data = doc.data();
  return {
    id: doc.id,
    ticketNo: data.ticketNo,
    starter: data.starter,
    clientName: data.clientName,
    clientPhone: data.clientPhone || '',
    purpose: data.purpose,
    totalAmount: data.totalAmount,
    starterAmount: data.starterAmount,
    partnerAmount: data.partnerAmount,
    kaamDoneAmount: data.kaamDoneAmount,
    status: data.status,
    createdAt: timestampToISO(data.createdAt) || new Date().toISOString(),
    closedAt: timestampToISO(data.closedAt),
    transactions: [],
  };
};

export async function createTicket(data: {
  starter: string;
  clientName: string;
  clientPhone: string;
  purpose: string;
  totalAmount: number;
}): Promise<Ticket> {
  try {
    const { starter, clientName, clientPhone, purpose, totalAmount } = data;
    const total = parseFloat(totalAmount.toString());

    if (isNaN(total) || total <= 0) {
      throw new Error('Invalid amount');
    }

    // Nested Split Logic
    const starterAmount = Math.round(total * 0.5 * 100) / 100;
    const remainder = Math.round((total - starterAmount) * 100) / 100;
    const partnerAmount = Math.round(remainder * 0.6 * 100) / 100;
    const kaamDoneAmount = Math.round(remainder * 0.4 * 100) / 100;

    const partner = starter === 'Roshan' ? 'Anand' : 'Roshan';

    // Get next ticket number BEFORE transaction
    const ticketsQuery = query(collection(db, 'tickets'), orderBy('ticketNo', 'desc'));
    const ticketsSnap = await getDocs(ticketsQuery);
    const lastTicketNo = ticketsSnap.docs.length > 0 ? ticketsSnap.docs[0].data().ticketNo : 0;
    const ticketNo = lastTicketNo + 1;

    // Create ticket and update wallets in a transaction
    const result = await runTransaction(db, async (transaction) => {
      // Read all wallets FIRST (before any writes)
      const starterWalletRef = doc(db, 'wallets', starter);
      const partnerWalletRef = doc(db, 'wallets', partner);
      const kaamDoneWalletRef = doc(db, 'wallets', 'KaamDone');

      const starterWalletSnap = await transaction.get(starterWalletRef);
      const partnerWalletSnap = await transaction.get(partnerWalletRef);
      const kaamDoneWalletSnap = await transaction.get(kaamDoneWalletRef);

      // Now perform all WRITES after all reads
      // Create ticket
      const ticketRef = doc(collection(db, 'tickets'));
      const ticketData = {
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
        createdAt: serverTimestamp(),
        closedAt: null,
      };
      transaction.set(ticketRef, ticketData);

      // Credit starter wallet
      if (starterWalletSnap.exists()) {
        const starterData = starterWalletSnap.data();
        transaction.update(starterWalletRef, {
          balance: starterData.balance + starterAmount,
          totalIn: starterData.totalIn + starterAmount,
          updatedAt: serverTimestamp(),
        });

        // Create transaction record
        const starterTxRef = doc(collection(db, 'transactions'));
        transaction.set(starterTxRef, {
          walletId: starter,
          ticketId: ticketRef.id,
          type: 'credit',
          amount: starterAmount,
          reason: 'ticket_split',
          createdAt: serverTimestamp(),
        });
      }

      // Credit partner wallet
      if (partnerWalletSnap.exists()) {
        const partnerData = partnerWalletSnap.data();
        transaction.update(partnerWalletRef, {
          balance: partnerData.balance + partnerAmount,
          totalIn: partnerData.totalIn + partnerAmount,
          updatedAt: serverTimestamp(),
        });

        const partnerTxRef = doc(collection(db, 'transactions'));
        transaction.set(partnerTxRef, {
          walletId: partner,
          ticketId: ticketRef.id,
          type: 'credit',
          amount: partnerAmount,
          reason: 'ticket_split',
          createdAt: serverTimestamp(),
        });
      }

      // Credit KaamDone wallet
      if (kaamDoneWalletSnap.exists()) {
        const kaamDoneData = kaamDoneWalletSnap.data();
        transaction.update(kaamDoneWalletRef, {
          balance: kaamDoneData.balance + kaamDoneAmount,
          totalIn: kaamDoneData.totalIn + kaamDoneAmount,
          updatedAt: serverTimestamp(),
        });

        const kaamDoneTxRef = doc(collection(db, 'transactions'));
        transaction.set(kaamDoneTxRef, {
          walletId: 'KaamDone',
          ticketId: ticketRef.id,
          type: 'credit',
          amount: kaamDoneAmount,
          reason: 'ticket_split',
          createdAt: serverTimestamp(),
        });
      }

      return { ticketRef, ticketData };
    });

    return {
      id: result.ticketRef.id,
      ...result.ticketData,
      createdAt: new Date().toISOString(),
      closedAt: null,
      transactions: [],
    } as Ticket;
  } catch (error) {
    console.error('Create ticket error:', error);
    throw error;
  }
}

export async function getTickets(status?: string): Promise<Ticket[]> {
  try {
    let ticketsQuery;
    
    if (status) {
      ticketsQuery = query(
        collection(db, 'tickets'),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
    } else {
      ticketsQuery = query(collection(db, 'tickets'), orderBy('createdAt', 'desc'));
    }

    const ticketsSnap = await getDocs(ticketsQuery);
    return ticketsSnap.docs.map((doc) => docToTicket(doc));
  } catch (error) {
    console.error('Get tickets error:', error);
    return [];
  }
}

export async function closeTicket(ticketId: string): Promise<Ticket> {
  try {
    const ticketRef = doc(db, 'tickets', ticketId);
    const ticketSnap = await getDoc(ticketRef);

    if (!ticketSnap.exists()) {
      throw new Error('Ticket not found');
    }

    const ticketData = ticketSnap.data();

    if (ticketData.status === 'closed') {
      throw new Error('Ticket already closed');
    }

    await updateDoc(ticketRef, {
      status: 'closed',
      closedAt: serverTimestamp(),
    });

    const updatedSnap = await getDoc(ticketRef);
    return docToTicket(updatedSnap);
  } catch (error) {
    console.error('Close ticket error:', error);
    throw error;
  }
}
