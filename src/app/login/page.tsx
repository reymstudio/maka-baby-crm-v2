"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { user } = useAuth();

    // Redirect if already logged in
    React.useEffect(() => {
        if (user) {
            router.push('/dashboard');
        }
    }, [user, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await signInWithEmailAndPassword(auth, email, password);
            router.push('/dashboard');
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Error al iniciar sesión';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
            <div className="w-full max-w-md bg-white rounded-3xl p-8 lg:p-12 shadow-glass animate-in fade-in slide-in-from-bottom-4 duration-500 text-center">
                <Image src="/logo.png" className="w-32 h-auto mx-auto mb-6" alt="Logo" width={128} height={128} />
                <h2 className="text-2xl lg:text-3xl font-bold text-main mb-2">Bienvenido</h2>
                <p className="text-muted mb-8">Inicie sesión para acceder a su CRM</p>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-100 text-danger rounded-xl text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 text-left">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-muted ml-1">Correo Electrónico</label>
                        <input
                            type="email"
                            className="form-control"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-muted ml-1">Contraseña</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                className="form-control pr-12"
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
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors focus:outline-none"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            )}
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="btn btn-primary w-full justify-center mt-6 h-12"
                        disabled={loading}
                    >
                        {loading ? 'Entrando...' : 'Entrar'}
                    </button>
                </form>

                <div className="mt-8 pt-8 border-t border-[#e8eeee]">
                    <p className="text-sm text-muted">
                        ¿No tienes cuenta? <Link href="/register" className="text-primary font-bold hover:underline">Crear Administrador Maestro</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
