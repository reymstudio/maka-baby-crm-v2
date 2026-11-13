"use client";

import { useContext, createContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User, UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  authError: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  authError: null,
});

interface AuthProviderProps {
  children: React.ReactNode;
}

const DEFAULT_SAFE_ROLE = 'Visita' as UserRole;

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setAuthError(null);
      try {
        if (firebaseUser) {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));

          if (!userDoc.exists()) {
            setUser({
              id: firebaseUser.uid,
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuario',
              email: firebaseUser.email || '',
              role: DEFAULT_SAFE_ROLE,
            });
            return;
          }

          const userData = userDoc.data();
          setUser({
            id: firebaseUser.uid,
            uid: firebaseUser.uid,
            name: userData?.name || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuario',
            email: firebaseUser.email || '',
            role: (userData?.role as UserRole) || DEFAULT_SAFE_ROLE,
            createdAt: userData?.createdAt,
          });
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setAuthError("No se pudo verificar el perfil y los permisos del usuario.");
        if (firebaseUser) {
          setUser({
            id: firebaseUser.uid,
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuario',
            email: firebaseUser.email || '',
            role: DEFAULT_SAFE_ROLE,
          });
        }
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, authError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);