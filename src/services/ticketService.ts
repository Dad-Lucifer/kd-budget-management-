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
    type: data.type || 'owners',
    partneredWith: data.partneredWith || undefined,
    starter: data.starter,
    clientName: data.clientName,
    clientPhone: data.clientPhone || '',
    purpose: data.purpose,
    totalAmount: data.totalAmount,
    starterAmount: data.starterAmount,
    partnerAmount: data.partnerAmount,
    kaamDoneAmount: data.kaamDoneAmount,
    partnerWalletAmount: data.partnerWalletAmount || 0,
    status: data.status,
    createdAt: timestampToISO(data.createdAt) || new Date().toISOString(),
    closedAt: timestampToISO(data.closedAt),
    transactions: [],
  };
};

export async function createTicket(data: {
  type?: 'owners' | 'partnered';
  partneredWith?: string;
  starter: string;
  clientName: string;
  clientPhone: string;
  purpose: string;
  totalAmount: number;
}): Promise<Ticket> {
  try {
    const { type = 'owners', partneredWith, starter, clientName, clientPhone, purpose, totalAmount } = data;
    const total = parseFloat(totalAmount.toString());

    if (isNaN(total) || total <= 0) {
      throw new Error('Invalid amount');
    }

    let starterAmount = 0;
    let partnerAmount = 0;
    let kaamDoneAmount = 0;
    let partnerWalletAmount = 0;

    const partner = starter === 'Roshan' ? 'Anand' : 'Roshan';

    if (type === 'partnered') {
      const percentages = [40, 20, 20, 20];
      let results = percentages.map(p => (total * p) / 100);
      results = results.map(val => Math.floor(val));

      let totalCalculated = results.reduce((a, b) => a + b, 0);
      let remainder = total - totalCalculated;

      let i = 0;
      while (remainder > 0) {
          results[i]++;
          remainder--;
          i = (i + 1) % results.length;
      }

      starterAmount = results[0];
      partnerWalletAmount = results[1];
      partnerAmount = results[2];
      kaamDoneAmount = results[3];
    } else {
      starterAmount = Math.round(total * 0.5 * 100) / 100;
      const remainder = Math.round((total - starterAmount) * 100) / 100;
      partnerAmount = Math.round(remainder * 0.6 * 100) / 100;
      kaamDoneAmount = Math.round(remainder * 0.4 * 100) / 100;
    }

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
      const partnerEntityWalletRef = doc(db, 'wallets', 'Partner Wallet');

      const starterWalletSnap = await transaction.get(starterWalletRef);
      const partnerWalletSnap = await transaction.get(partnerWalletRef);
      const kaamDoneWalletSnap = await transaction.get(kaamDoneWalletRef);
      const partnerEntityWalletSnap = type === 'partnered' ? await transaction.get(partnerEntityWalletRef) : null;

      // Now perform all WRITES after all reads
      // Create ticket
      const ticketRef = doc(collection(db, 'tickets'));
      const ticketData = {
        ticketNo,
        type,
        partneredWith: partneredWith || null,
        starter,
        clientName,
        clientPhone: clientPhone || '',
        purpose,
        totalAmount: total,
        starterAmount,
        partnerAmount,
        kaamDoneAmount,
        partnerWalletAmount,
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

      // Credit partner wallet (the other owner)
      if (partnerWalletSnap.exists()) {
        const pData = partnerWalletSnap.data();
        transaction.update(partnerWalletRef, {
          balance: pData.balance + partnerAmount,
          totalIn: pData.totalIn + partnerAmount,
          updatedAt: serverTimestamp(),
        });

        const pTxRef = doc(collection(db, 'transactions'));
        transaction.set(pTxRef, {
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

      // Credit "Partner Wallet" entity if partnered
      if (type === 'partnered' && partnerEntityWalletSnap?.exists()) {
        const peData = partnerEntityWalletSnap.data();
        transaction.update(partnerEntityWalletRef, {
          balance: peData.balance + partnerWalletAmount,
          totalIn: peData.totalIn + partnerWalletAmount,
          updatedAt: serverTimestamp(),
        });

        const peTxRef = doc(collection(db, 'transactions'));
        transaction.set(peTxRef, {
          walletId: 'Partner Wallet',
          ticketId: ticketRef.id,
          type: 'credit',
          amount: partnerWalletAmount,
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
