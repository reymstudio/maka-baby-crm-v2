"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  FirestoreError
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Client, Sale, User } from '@/types';

// Función auxiliar interna para normalizar fechas de Firestore
const parseFirestoreDate = (data: any): string => {
  const dateVal = data?.date;
  if (!dateVal) return new Date().toISOString();

  try {
    if (typeof dateVal === 'string') return dateVal;

    if (typeof dateVal === 'object' && dateVal !== null) {
      // Caso Timestamp de Firestore
      if ('toDate' in dateVal && typeof dateVal.toDate === 'function') {
        return dateVal.toDate().toISOString();
      }
      // Caso objeto { seconds, nanoseconds }
      if ('seconds' in dateVal) {
        return new Date((dateVal as any).seconds * 1000).toISOString();
      }
    }

    // Fallback para Date object o string inválido
    const fallback = new Date(dateVal);
    return !isNaN(fallback.getTime()) ? fallback.toISOString() : new Date().toISOString();
  } catch (e) {
    console.warn('Error parseando fecha:', e);
    return new Date().toISOString();
  }
};

interface UseStoreReturn {
  clients: Client[];
  sales: Sale[];
  users: User[];
  loading: boolean;
  addClient: (client: Omit<Client, 'id'>) => Promise<void>;
  updateClient: (id: string, client: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  addSale: (sale: Omit<Sale, 'id' | 'saleNumber' | 'date'>) => Promise<void>;
  updateSale: (id: string, sale: Partial<Sale>) => Promise<void>;
  deleteSale: (id: string) => Promise<void>;
  getSalesByYear: (year: number) => Sale[];
}

export const useStore = (): UseStoreReturn => {
  const [clients, setClients] = useState<Client[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Memoizar ventas por año para evitar recálculos en addSale
  const salesByYear = useMemo(() => {
    const currentYear = new Date().getFullYear().toString();
    return sales.filter(s => s.saleNumber?.startsWith(currentYear));
  }, [sales]);

  useEffect(() => {
    // Optimización: Usar queries con orderBy para obtener datos ordenados desde Firestore
    const clientsQuery = query(collection(db, "clients"));
    const salesQuery = query(collection(db, "sales"), orderBy("date", "desc"));
    const usersQuery = query(collection(db, "users"));

    const unsubClients = onSnapshot(
      clientsQuery,
      (snapshot) => {
        setClients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client)));
        setLoading(false);
      },
      (error) => {
        console.error("Error escuchando clientes:", error);
        setLoading(false);
      }
    );

    const unsubSales = onSnapshot(
      salesQuery,
      (snapshot) => {
        const loadedSales = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            date: parseFirestoreDate(data)
          } as Sale;
        });

        setSales(loadedSales);
      },
      (error) => {
        console.error("Error escuchando ventas:", error);
      }
    );

    const unsubUsers = onSnapshot(
      usersQuery,
      (snapshot) => {
        setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User)));
      },
      (error) => {
        console.error("Error escuchando usuarios:", error);
      }
    );

    return () => {
      unsubClients();
      unsubSales();
      unsubUsers();
    };
  }, []);

  const addClient = useCallback(async (client: Omit<Client, 'id'>) => {
    try {
      await addDoc(collection(db, "clients"), client);
    } catch (error) {
      console.error("Error agregando cliente:", error);
      throw error;
    }
  }, []);

  const updateClient = useCallback(async (id: string, client: Partial<Client>) => {
    try {
      await updateDoc(doc(db, "clients", id), client);
    } catch (error) {
      console.error("Error actualizando cliente:", error);
      throw error;
    }
  }, []);

  const deleteClient = useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, "clients", id));
    } catch (error) {
      console.error("Error eliminando cliente:", error);
      throw error;
    }
  }, []);

  const addSale = useCallback(async (sale: Omit<Sale, 'id' | 'saleNumber' | 'date'>) => {
    try {
      const year = new Date().getFullYear();
      
      // Usar ventas memoizadas por año para mejor rendimiento
      const yearSales = salesByYear;

      let nextNum = 1;
      if (yearSales.length > 0) {
        const nums = yearSales
          .map(s => {
            const parts = s.saleNumber?.split('-');
            return parts && parts.length > 1 ? parseInt(parts[1], 10) : 0;
          })
          .filter(n => !isNaN(n));

        if (nums.length > 0) {
          nextNum = Math.max(...nums) + 1;
        }
      }

      const saleNumber = `${year}-${nextNum.toString().padStart(3, '0')}`;

      await addDoc(collection(db, "sales"), {
        ...sale,
        saleNumber,
        date: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error agregando venta:", error);
      throw error;
    }
  }, [salesByYear]);

  const updateSale = useCallback(async (id: string, sale: Partial<Sale>) => {
    try {
      await updateDoc(doc(db, "sales", id), sale);
    } catch (error) {
      console.error("Error actualizando venta:", error);
      throw error;
    }
  }, []);

  const deleteSale = useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, "sales", id));
    } catch (error) {
      console.error("Error eliminando venta:", error);
      throw error;
    }
  }, []);

  const getSalesByYear = useCallback((year: number) => {
    return sales.filter(s => {
      const saleYear = new Date(s.date).getFullYear();
      return saleYear === year;
    });
  }, [sales]);

  return {
    clients,
    sales,
    users,
    loading,
    addClient,
    updateClient,
    deleteClient,
    addSale,
    updateSale,
    deleteSale,
    getSalesByYear
  };
};