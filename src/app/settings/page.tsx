"use client";

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { updateProfile, updatePassword } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, updateDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import {
    User as UserIcon,
    Mail,
    Lock,
    Trash2,
    AlertTriangle,
    Save
} from 'lucide-react';

export default function SettingsPage() {
    const { user } = useAuth();
    const [name, setName] = useState(user?.name || '');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setSuccess('');
        setError('');

        try {
            if (!auth.currentUser) return;
            if (user?.role === 'Visita') {
                setError('El rol Visita no puede modificar información.');
                setLoading(false);
                return;
            }

            if (name !== user?.name) {
                await updateProfile(auth.currentUser, { displayName: name });
                await updateDoc(doc(db, "users", auth.currentUser.uid), { name });
            }

            if (password) {
                await updatePassword(auth.currentUser, password);
            }

            setSuccess('¡Perfil actualizado con éxito!');
            setPassword('');
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Error al actualizar perfil';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleWipeData = async () => {
        if (confirm('¿ESTÁS SEGURO? Esta acción borrará TODOS los clientes y ventas permanentemente de la base de datos.')) {
            setLoading(true);
            try {
                const clientsSnap = await getDocs(collection(db, "clients"));
                const salesSnap = await getDocs(collection(db, "sales"));

                const deletions = [
                    ...clientsSnap.docs.map(d => deleteDoc(doc(db, "clients", d.id))),
                    ...salesSnap.docs.map(d => deleteDoc(doc(db, "sales", d.id)))
                ];

                await Promise.all(deletions);
                alert('Toda la información ha sido eliminada con éxito.');
                window.location.reload();
            } catch (err: unknown) {
                const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
                alert('Error al eliminar datos: ' + errorMessage);
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-2xl mx-auto space-y-6 lg:space-y-8 animate-in fade-in duration-700">
                <header>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Mi Perfil</h1>
                    <p className="text-muted mt-1 text-sm sm:text-base">Gestione sus datos personales y configuración de seguridad.</p>
                </header>

                <div className="glass-card p-6 sm:p-8 rounded-2xl lg:rounded-3xl">
                    <form onSubmit={handleUpdateProfile} className="space-y-4 sm:space-y-5">
                        {success && (
                            <div className="p-3.5 sm:p-4 bg-green-50 text-green-600 rounded-xl sm:rounded-2xl border border-green-100 text-sm">
                                {success}
                            </div>
                        )}
                        {error && (
                            <div className="p-3.5 sm:p-4 bg-red-50 text-red-600 rounded-xl sm:rounded-2xl border border-red-100 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-xs sm:text-sm font-semibold text-muted flex items-center gap-2 ml-1">
                                <UserIcon className="w-4 h-4" /> Nombre Completo
                            </label>
                            <input
                                type="text"
                                className="form-control"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs sm:text-sm font-semibold text-muted flex items-center gap-2 ml-1">
                                <Mail className="w-4 h-4" /> Correo Electrónico
                            </label>
                            <input
                                type="email"
                                className="form-control opacity-50 cursor-not-allowed"
                                value={user?.email}
                                disabled
                            />
                            <p className="text-[10px] text-muted ml-2">El correo electrónico no se puede cambiar por seguridad.</p>
                        </div>

                        <div className="space-y-1.5 pt-2">
                            <label className="text-xs sm:text-sm font-semibold text-muted flex items-center gap-2 ml-1">
                                <Lock className="w-4 h-4" /> Nueva Contraseña
                            </label>
                            <input
                                type="password"
                                className="form-control"
                                placeholder="Dejar en blanco para no cambiar"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                minLength={6}
                            />
                        </div>

                        <div className="pt-3 sm:pt-4">
                            <button type="submit" className="btn btn-primary w-full justify-center h-11 sm:h-12 text-sm sm:text-base" disabled={loading || user?.role === 'Visita'}>
                                <Save className="w-5 h-5" />
                                {loading ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </form>
                </div>

                {user?.role === 'Super Admin' && (
                    <div className="glass-card p-6 sm:p-8 rounded-2xl lg:rounded-3xl border-danger/20 bg-red-50/10">
                        <div className="flex items-start gap-3 sm:gap-4">
                            <div className="p-2.5 sm:p-3 bg-red-100 text-danger rounded-2xl shrink-0">
                                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-base sm:text-lg font-bold text-danger">Zona de Peligro</h3>
                                <p className="text-xs sm:text-sm text-muted leading-relaxed">
                                    Esta acción eliminará permanentemente todos los clientes y ventas de la base de datos global.
                                    Use esta opción solo si desea reiniciar el sistema por completo.
                                </p>
                                <div className="pt-2 sm:pt-4">
                                    <button
                                        onClick={handleWipeData}
                                        className="btn btn-ghost text-danger border-danger hover:bg-danger hover:text-white text-xs sm:text-sm"
                                        disabled={loading}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Eliminar Toda la Información
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
