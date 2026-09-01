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
    roshanAmount: data.roshanAmount,
    anandAmount: data.anandAmount,
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
  clientPhone?: string;
  purpose: string;
  totalAmount: number;
  roshanAmount?: number;
  anandAmount?: number;
  partnerWalletAmount?: number;
  kaamDoneAmount?: number;
}): Promise<Ticket> {
  try {
    const {
      type = 'owners',
      partneredWith,
      starter,
      clientName,
      clientPhone = '',
      purpose,
      totalAmount,
    } = data;
    const total = parseFloat(totalAmount.toString());

    if (isNaN(total) || total <= 0) {
      throw new Error('Invalid amount');
    }

    let starterAmount = 0;
    let partnerAmount = 0;
    let kaamDoneAmount = 0;
    let partnerWalletAmount = 0;
    let roshanAmount = 0;
    let anandAmount = 0;

    const otherOwner = starter === 'Roshan' ? 'Anand' : 'Roshan';

    if (type === 'partnered') {
      roshanAmount = parseFloat((data.roshanAmount ?? 0).toString()) || 0;
      anandAmount = parseFloat((data.anandAmount ?? 0).toString()) || 0;
      partnerWalletAmount = parseFloat((data.partnerWalletAmount ?? 0).toString()) || 0;
      kaamDoneAmount = parseFloat((data.kaamDoneAmount ?? 0).toString()) || 0;

      const sum = Math.round((roshanAmount + anandAmount + partnerWalletAmount + kaamDoneAmount) * 100) / 100;
      const roundedTotal = Math.round(total * 100) / 100;

      if (sum !== roundedTotal) {
        throw new Error(`Distribution sum (₹${sum}) must equal the total amount (₹${roundedTotal}).`);
      }

      starterAmount = starter === 'Roshan' ? roshanAmount : anandAmount;
      partnerAmount = starter === 'Roshan' ? anandAmount : roshanAmount;
    } else {
      starterAmount = Math.round(total * 0.5 * 100) / 100;
      const remainder = Math.round((total - starterAmount) * 100) / 100;
      partnerAmount = Math.round(remainder * 0.6 * 100) / 100;
      kaamDoneAmount = Math.round(remainder * 0.4 * 100) / 100;
      roshanAmount = starter === 'Roshan' ? starterAmount : partnerAmount;
      anandAmount = starter === 'Anand' ? starterAmount : partnerAmount;
      partnerWalletAmount = 0;
    }

    // Get next ticket number BEFORE transaction
    const ticketsQuery = query(collection(db, 'tickets'), orderBy('ticketNo', 'desc'));
    const ticketsSnap = await getDocs(ticketsQuery);
    const lastTicketNo = ticketsSnap.docs.length > 0 ? ticketsSnap.docs[0].data().ticketNo : 0;
    const ticketNo = lastTicketNo + 1;

    // Create ticket and update wallets in a transaction
    const result = await runTransaction(db, async (transaction) => {
      // Read all wallets FIRST (before any writes)
      const roshanWalletRef = doc(db, 'wallets', 'Roshan');
      const anandWalletRef = doc(db, 'wallets', 'Anand');
      const kaamDoneWalletRef = doc(db, 'wallets', 'KaamDone');
      const partnerEntityWalletRef = doc(db, 'wallets', 'Partner Wallet');

      const roshanWalletSnap = await transaction.get(roshanWalletRef);
      const anandWalletSnap = await transaction.get(anandWalletRef);
      const kaamDoneWalletSnap = await transaction.get(kaamDoneWalletRef);
      const partnerEntityWalletSnap = type === 'partnered' ? await transaction.get(partnerEntityWalletRef) : null;

      // Now perform all WRITES after all reads
      // Create ticket
      const ticketRef = doc(collection(db, 'tickets'));
      const ticketData: Record<string, any> = {
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
        roshanAmount,
        anandAmount,
        kaamDoneAmount,
        partnerWalletAmount,
        status: 'open',
        createdAt: serverTimestamp(),
        closedAt: null,
      };
      transaction.set(ticketRef, ticketData);

      // Credit Roshan wallet
      if (roshanWalletSnap.exists() && roshanAmount > 0) {
        const roshanData = roshanWalletSnap.data();
        transaction.update(roshanWalletRef, {
          balance: (roshanData.balance || 0) + roshanAmount,
          totalIn: (roshanData.totalIn || 0) + roshanAmount,
          updatedAt: serverTimestamp(),
        });

        const roshanTxRef = doc(collection(db, 'transactions'));
        transaction.set(roshanTxRef, {
          walletId: 'Roshan',
          ticketId: ticketRef.id,
          type: 'credit',
          amount: roshanAmount,
          reason: type === 'partnered' ? `partnered_ticket_split (${starter === 'Roshan' ? 'Starter' : 'Owner'})` : 'ticket_split',
          createdAt: serverTimestamp(),
        });
      }

      // Credit Anand wallet
      if (anandWalletSnap.exists() && anandAmount > 0) {
        const anandData = anandWalletSnap.data();
        transaction.update(anandWalletRef, {
          balance: (anandData.balance || 0) + anandAmount,
          totalIn: (anandData.totalIn || 0) + anandAmount,
          updatedAt: serverTimestamp(),
        });

        const anandTxRef = doc(collection(db, 'transactions'));
        transaction.set(anandTxRef, {
          walletId: 'Anand',
          ticketId: ticketRef.id,
          type: 'credit',
          amount: anandAmount,
          reason: type === 'partnered' ? `partnered_ticket_split (${starter === 'Anand' ? 'Starter' : 'Owner'})` : 'ticket_split',
          createdAt: serverTimestamp(),
        });
      }

      // Credit KaamDone wallet
      if (kaamDoneWalletSnap.exists() && kaamDoneAmount > 0) {
        const kaamDoneData = kaamDoneWalletSnap.data();
        transaction.update(kaamDoneWalletRef, {
          balance: (kaamDoneData.balance || 0) + kaamDoneAmount,
          totalIn: (kaamDoneData.totalIn || 0) + kaamDoneAmount,
          updatedAt: serverTimestamp(),
        });

        const kaamDoneTxRef = doc(collection(db, 'transactions'));
        transaction.set(kaamDoneTxRef, {
          walletId: 'KaamDone',
          ticketId: ticketRef.id,
          type: 'credit',
          amount: kaamDoneAmount,
          reason: type === 'partnered' ? 'partnered_ticket_split (Kaam Done)' : 'ticket_split',
          createdAt: serverTimestamp(),
        });
      }

      // Credit "Partner Wallet" entity if partnered
      if (type === 'partnered' && partnerWalletAmount > 0) {
        if (partnerEntityWalletSnap && partnerEntityWalletSnap.exists()) {
          const peData = partnerEntityWalletSnap.data();
          transaction.update(partnerEntityWalletRef, {
            balance: (peData.balance || 0) + partnerWalletAmount,
            totalIn: (peData.totalIn || 0) + partnerWalletAmount,
            updatedAt: serverTimestamp(),
          });
        } else {
          // If Partner Wallet document doesn't exist yet, initialize and credit it
          transaction.set(partnerEntityWalletRef, {
            name: 'Partner Wallet',
            balance: partnerWalletAmount,
            totalIn: partnerWalletAmount,
            totalOut: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }

        const peTxRef = doc(collection(db, 'transactions'));
        transaction.set(peTxRef, {
          walletId: 'Partner Wallet',
          ticketId: ticketRef.id,
          type: 'credit',
          amount: partnerWalletAmount,
          reason: `partnered_ticket_split (${partneredWith || 'Partner'})`,
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
    } as unknown as Ticket;
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
