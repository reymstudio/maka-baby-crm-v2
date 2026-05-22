/**
 * Servicios de Firebase - Operaciones CRUD centralizadas
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  where,
  Timestamp,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Client, Sale, User } from '@/types';

// ==================== CLIENTS ====================

export const clientService = {
  getAll: async () => {
    const snapshot = await getDocs(collection(db, 'clients'));
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Client));
  },

  getById: async (id: string) => {
    const snap = await getDoc(doc(db, 'clients', id));
    return snap.exists() ? { id: snap.id, ...snap.data() } as Client : null;
  },

  create: async (data: Omit<Client, 'id'>) => {
    const docRef = await addDoc(collection(db, 'clients'), {
      ...data,
      createdAt: data.createdAt || new Date().toISOString(),
    });
    return docRef.id;
  },

  update: async (id: string, data: Partial<Client>) => {
    await updateDoc(doc(db, 'clients', id), data);
  },

  delete: async (id: string) => {
    await deleteDoc(doc(db, 'clients', id));
  },
};

// ==================== SALES ====================

export const saleService = {
  getAll: async () => {
    const q = query(collection(db, 'sales'), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        date: parseFirestoreDate(data.date),
      } as Sale;
    });
  },

  getByYear: async (year: number) => {
    const startDate = new Date(year, 0, 1).toISOString();
    const endDate = new Date(year + 1, 0, 1).toISOString();
    const q = query(
      collection(db, 'sales'),
      where('date', '>=', startDate),
      where('date', '<', endDate)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      date: parseFirestoreDate(doc.data().date),
    } as Sale));
  },

  getById: async (id: string) => {
    const snap = await getDoc(doc(db, 'sales', id));
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      id: snap.id,
      ...data,
      date: parseFirestoreDate(data.date),
    } as Sale;
  },

  create: async (data: Omit<Sale, 'id' | 'saleNumber' | 'date'>, saleNumber: string) => {
    await addDoc(collection(db, 'sales'), {
      ...data,
      saleNumber,
      date: new Date().toISOString(),
    });
  },

  update: async (id: string, data: Partial<Sale>) => {
    await updateDoc(doc(db, 'sales', id), data);
  },

  delete: async (id: string) => {
    await deleteDoc(doc(db, 'sales', id));
  },
};

// ==================== USERS ====================

export const userService = {
  getAll: async () => {
    const snapshot = await getDocs(collection(db, 'users'));
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as User));
  },

  getById: async (uid: string) => {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? { id: snap.id, ...snap.data() } as User : null;
  },

  create: async (data: Omit<User, 'id'>) => {
    await addDoc(collection(db, 'users'), {
      ...data,
      createdAt: data.createdAt || new Date().toISOString(),
    });
  },

  update: async (id: string, data: Partial<User>) => {
    await updateDoc(doc(db, 'users', id), data);
  },

  delete: async (id: string) => {
    await deleteDoc(doc(db, 'users', id));
  },
};

// ==================== HELPERS ====================

function parseFirestoreDate(dateVal: any): string {
  if (!dateVal) return new Date().toISOString();
  
  try {
    if (typeof dateVal === 'string') return dateVal;
    
    if (typeof dateVal === 'object' && dateVal !== null) {
      if ('toDate' in dateVal && typeof dateVal.toDate === 'function') {
        return dateVal.toDate().toISOString();
      }
      if ('seconds' in dateVal) {
        return new Date((dateVal as any).seconds * 1000).toISOString();
      }
    }
    
    const fallback = new Date(dateVal);
    return !isNaN(fallback.getTime()) ? fallback.toISOString() : new Date().toISOString();
  } catch {
    return new Date().toISOString();
  }
}
