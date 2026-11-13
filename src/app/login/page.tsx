"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

function getFriendlyAuthError(err: unknown): string {
  if (typeof err === 'object' && err !== null && 'code' in err) {
    const code = (err as { code: string }).code;
    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'Correo electrónico o contraseña incorrectos.';
      case 'auth/too-many-requests':
        return 'Demasiados intentos fallidos. Por seguridad, intenta nuevamente en unos minutos.';
      case 'auth/user-disabled':
        return 'Esta cuenta ha sido deshabilitada. Contacta al administrador.';
      case 'auth/network-request-failed':
        return 'Error de conexión. Verifica tu acceso a internet.';
      default:
        return 'No se pudo iniciar sesión. Intenta nuevamente.';
    }
  }
  return 'Ocurrió un error inesperado al iniciar sesión.';
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(getFriendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-4 sm:py-6 px-4 flex items-center justify-center bg-background">
      <div className="w-full max-w-md bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-glass animate-in fade-in slide-in-from-bottom-4 duration-500 text-center my-auto">
        <Image
          src="/logo.png"
          className="w-20 sm:w-24 h-auto mx-auto mb-3 sm:mb-4"
          alt="Logo MÄKA Baby"
          width={96}
          height={96}
          priority
        />
        <h1 className="text-2xl sm:text-3xl font-bold text-main mb-1">Bienvenido</h1>
        <p className="text-xs sm:text-sm text-muted mb-4 sm:mb-6">
          Inicie sesión para acceder a su CRM
        </p>

        {error && (
          <div
            role="alert"
            className="mb-4 p-3 bg-red-50 border border-red-100 text-danger rounded-xl text-xs sm:text-sm"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 text-left">
          <div className="space-y-1">
            <label htmlFor="email" className="text-xs sm:text-sm font-medium text-muted ml-1">
              Correo Electrónico
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="form-control py-2.5 text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="text-xs sm:text-sm font-medium text-muted ml-1">
              Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className="form-control py-2.5 text-sm pr-12"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (e.target.value === '') {
                    setShowPassword(false);
                  }
                }}
                required
              />
              {password && (
                <button
                  type="button"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full justify-center mt-4 sm:mt-5 h-11 sm:h-12 text-sm sm:text-base"
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}