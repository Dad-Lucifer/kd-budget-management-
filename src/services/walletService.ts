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
  limit,
  runTransaction,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Wallet, Transaction } from '@/lib/types';

// Convert Firestore timestamp to ISO string
const timestampToISO = (timestamp: Timestamp | null): string | null => {
  if (!timestamp) return null;
  return timestamp.toDate().toISOString();
};

// Convert Firestore document to Wallet type
const docToWallet = (doc: any): Wallet => {
  const data = doc.data();
  return {
    id: doc.id,
    name: data.name,
    balance: data.balance || 0,
    totalIn: data.totalIn || 0,
    totalOut: data.totalOut || 0,
    createdAt: timestampToISO(data.createdAt) || new Date().toISOString(),
    updatedAt: timestampToISO(data.updatedAt) || new Date().toISOString(),
    transactions: [],
  };
};

// Convert Firestore document to Transaction type
const docToTransaction = (doc: any, walletName?: string): Transaction => {
  const data = doc.data();
  return {
    id: doc.id,
    walletId: data.walletId,
    walletName: walletName || 'Unknown',
    ticketId: data.ticketId || undefined,
    type: data.type,
    amount: data.amount,
    reason: data.reason,
    createdAt: timestampToISO(data.createdAt) || new Date().toISOString(),
  };
};

export async function initializeWallets(): Promise<void> {
  const walletNames = ['Roshan', 'Anand', 'KaamDone'];

  for (const name of walletNames) {
    const walletRef = doc(db, 'wallets', name);
    const walletSnap = await getDoc(walletRef);

    if (!walletSnap.exists()) {
      await setDoc(walletRef, {
        name,
        balance: 0,
        totalIn: 0,
        totalOut: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  }
}

export async function getWallets(forceRefresh?: boolean): Promise<Wallet[]> {
  try {
    const walletsQuery = query(collection(db, 'wallets'), orderBy('name', 'asc'));
    const walletsSnap = await getDocs(walletsQuery);
    const wallets: Wallet[] = [];

    for (const walletDoc of walletsSnap.docs) {
      const wallet = docToWallet(walletDoc);

      // Get last 10 transactions for this wallet
      const transactionsQuery = query(
        collection(db, 'transactions'),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      const transactionsSnap = await getDocs(transactionsQuery);
      const transactions = transactionsSnap.docs.map((doc) =>
        docToTransaction(doc, wallet.name)
      );

      wallet.transactions = transactions;
      wallets.push(wallet);
    }

    return wallets;
  } catch (error) {
    console.error('Get wallets error:', error);
    return [];
  }
}

export async function withdrawFromWallet(
  walletName: string,
  amount: number,
  reason: string
): Promise<{ wallet: Wallet; transaction: Transaction }> {
  try {
    const walletRef = doc(db, 'wallets', walletName);

    const result = await runTransaction(db, async (transaction) => {
      const walletSnap = await transaction.get(walletRef);

      if (!walletSnap.exists()) {
        throw new Error('Wallet not found');
      }

      const walletData = walletSnap.data();
      const newBalance = walletData.balance - amount;

      if (newBalance < 0) {
        throw new Error('Insufficient balance');
      }

      // Update wallet
      transaction.update(walletRef, {
        balance: newBalance,
        totalOut: walletData.totalOut + amount,
        updatedAt: serverTimestamp(),
      });

      // Create transaction record
      const transactionRef = doc(collection(db, 'transactions'));
      transaction.set(transactionRef, {
        walletId: walletSnap.id,
        ticketId: null,
        type: 'debit',
        amount: amount,
        reason: reason || 'withdrawal',
        createdAt: serverTimestamp(),
      });

      return { wallet: walletSnap, transactionRef };
    });

    const updatedWallet = docToWallet(result.wallet);
    const transactionSnap = await getDoc(result.transactionRef);
    const createdTransaction = docToTransaction(transactionSnap, walletName);

    return { wallet: updatedWallet, transaction: createdTransaction };
  } catch (error) {
    console.error('Withdraw error:', error);
    throw error;
  }
}

export async function getWithdrawals(): Promise<Transaction[]> {
  try {
    // Get all transactions and filter for debits (withdrawals)
    const transactionsQuery = query(
      collection(db, 'transactions'),
      orderBy('createdAt', 'desc')
    );
    const transactionsSnap = await getDocs(transactionsQuery);
    
    const withdrawals: Transaction[] = [];
    for (const docSnap of transactionsSnap.docs) {
      const data = docSnap.data();
      // Only include debit transactions (withdrawals)
      if (data.type !== 'debit') continue;
      
      // Get wallet name for better display
      const walletRef = doc(db, 'wallets', data.walletId);
      const walletSnap = await getDoc(walletRef);
      const walletName = walletSnap.exists() ? walletSnap.data().name : 'Unknown';
      
      withdrawals.push(docToTransaction(docSnap, walletName));
    }
    
    return withdrawals;
  } catch (error) {
    console.error('Get withdrawals error:', error);
    return [];
  }
}
