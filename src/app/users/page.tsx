"use client";

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useStore } from '@/hooks/useStore';
import { useAuth } from '@/context/AuthContext';
import {
    Plus,
    Trash2,
    Shield,
    Edit2,
    X,
    User as UserIcon,
    Crown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { User, UserRole } from '@/types';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

export default function UsersPage() {
    const { users } = useStore();
    const { user: currentUser } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'Vendedor' as UserRole
    });
    const [loading, setLoading] = useState(false);

    // Verification: only Super Admin can see this page
    if (currentUser?.role !== 'Super Admin') {
        return (
            <DashboardLayout>
                <div className="h-full flex items-center justify-center p-10 text-center">
                    <div className="max-w-md space-y-4">
                        <Shield className="w-16 h-16 text-danger mx-auto opacity-20" />
                        <h1 className="text-2xl font-bold">Acceso Denegado</h1>
                        <p className="text-muted">Solo los Super Administradores pueden gestionar usuarios.</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    const handleOpenModal = (user?: User) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                name: user.name,
                email: user.email,
                password: '', // Password cannot be edited here
                role: user.role
            });
        } else {
            setEditingUser(null);
            setFormData({ name: '', email: '', password: '', role: 'Vendedor' });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (editingUser) {
                await updateDoc(doc(db, "users", editingUser.id), {
                    name: formData.name,
                    role: formData.role
                });
            } else {
                // Registering a new user via client side will LOG OUT the admin.
                // I will add a warning/note about this or use a prompt.
                if (confirm('Atención: Al crear un usuario nuevo desde esta pantalla, su sesión actual se cerrará para registrar al nuevo usuario. ¿Desea continuar?')) {
                    const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
                    const newUser = userCredential.user;
                    await updateProfile(newUser, { displayName: formData.name });
                    await setDoc(doc(db, "users", newUser.uid), {
                        uid: newUser.uid,
                        name: formData.name,
                        email: formData.email,
                        role: formData.role,
                        createdAt: new Date().toISOString()
                    });
                    alert('Usuario creado con éxito. Por favor vuelva a iniciar sesión con su cuenta de administrador.');
                    window.location.href = '/login';
                    return;
                }
            }
            setIsModalOpen(false);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            alert(`Error: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (userToDelete: User) => {
        if (userToDelete.uid === currentUser.uid) return alert('No puedes eliminarte a ti mismo.');
        if (confirm(`¿Estás seguro de eliminar a ${userToDelete.name}?`)) {
            await deleteDoc(doc(db, "users", userToDelete.id));
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-8 animate-in fade-in duration-700">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-main">Usuarios</h1>
                        <p className="text-muted mt-1">Gestión de equipo y permisos.</p>
                    </div>
                    <button onClick={() => handleOpenModal()} className="btn btn-primary">
                        <Plus className="w-5 h-5" />
                        Nuevo Usuario
                    </button>
                </header>

                <div className="space-y-4">
                    {/* Desktop Table View */}
                    <div className="hidden md:block glass-card overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[550px]">
                                <thead className="bg-sidebar">
                                    <tr>
                                        <th className="p-3.5 lg:p-4 text-xs lg:text-sm font-semibold text-muted whitespace-nowrap">Nombre</th>
                                        <th className="p-3.5 lg:p-4 text-xs lg:text-sm font-semibold text-muted whitespace-nowrap">Email</th>
                                        <th className="p-3.5 lg:p-4 text-xs lg:text-sm font-semibold text-muted whitespace-nowrap">Rol</th>
                                        <th className="p-3.5 lg:p-4 text-xs lg:text-sm font-semibold text-muted text-right whitespace-nowrap">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#e8eeee]">
                                    {users.map((u) => (
                                        <tr key={u.id} className="hover:bg-sidebar/30 transition-colors">
                                            <td className="p-3.5 lg:p-4">
                                                <div className="flex items-center gap-2.5 sm:gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-xs shrink-0">
                                                        {u.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="font-semibold text-sm max-w-[160px] truncate" title={u.name}>{u.name}</span>
                                                </div>
                                            </td>
                                            <td className="p-3.5 lg:p-4 text-xs lg:text-sm text-muted max-w-[200px] truncate" title={u.email}>
                                                {u.email}
                                            </td>
                                            <td className="p-3.5 lg:p-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    {u.role === 'Super Admin' ? (
                                                        <Crown className="w-4 h-4 text-amber-500 shrink-0" />
                                                    ) : u.role === 'Admin' ? (
                                                        <Shield className="w-4 h-4 text-primary shrink-0" />
                                                    ) : (
                                                        <UserIcon className="w-4 h-4 text-muted shrink-0" />
                                                    )}
                                                    <span className={cn(
                                                        "text-xs font-bold px-2 py-1 rounded-lg",
                                                        u.role === 'Super Admin' ? "bg-amber-50 text-amber-600" :
                                                            u.role === 'Admin' ? "bg-primary/5 text-primary" : "bg-sidebar text-muted"
                                                    )}>
                                                        {u.role}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-3.5 lg:p-4 text-right whitespace-nowrap">
                                                <div className="flex justify-end gap-1.5">
                                                    <button onClick={() => handleOpenModal(u)} className="btn-icon w-7 h-7 sm:w-8 sm:h-8">
                                                        <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                    </button>
                                                    {u.uid !== currentUser.uid && (
                                                        <button onClick={() => handleDelete(u)} className="btn-icon w-7 h-7 sm:w-8 sm:h-8 text-danger border-none hover:bg-red-50">
                                                            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-4">
                        {users.map((u) => (
                            <div key={u.id} className="glass-card p-6 space-y-4">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent font-bold text-lg">
                                            {u.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-bold text-main">{u.name}</div>
                                            <div className="text-xs text-muted leading-tight">{u.email}</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleOpenModal(u)} className="btn-icon w-10 h-10">
                                            <Edit2 className="w-5 h-5" />
                                        </button>
                                        {u.uid !== currentUser.uid && (
                                            <button onClick={() => handleDelete(u)} className="btn-icon w-10 h-10 text-danger border-none hover:bg-red-50">
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-sidebar/50 rounded-xl">
                                    <span className="text-xs font-medium text-muted">Tipo de Cuenta</span>
                                    <div className="flex items-center gap-2">
                                        {u.role === 'Super Admin' ? (
                                            <Crown className="w-4 h-4 text-amber-500" />
                                        ) : u.role === 'Admin' ? (
                                            <Shield className="w-4 h-4 text-primary" />
                                        ) : (
                                            <UserIcon className="w-4 h-4 text-muted" />
                                        )}
                                        <span className={cn(
                                            "text-xs font-bold",
                                            u.role === 'Super Admin' ? "text-amber-600" :
                                                u.role === 'Admin' ? "text-primary" : "text-muted"
                                        )}>
                                            {u.role}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* User Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/20 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-md p-5 sm:p-6 shadow-2xl animate-in zoom-in-95 duration-300 max-h-[88vh] flex flex-col">
                        <div className="flex justify-between items-center mb-3 sm:mb-4 shrink-0">
                            <h2 className="text-lg sm:text-xl font-bold text-primary">
                                {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="btn-icon">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 space-y-3 overflow-y-auto pr-1">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-muted ml-1">Nombre Completo</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-muted ml-1">Email</label>
                                <input
                                    type="email"
                                    className="form-control"
                                    required
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>

                            {!editingUser && (
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-muted ml-1">Contraseña</label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        required
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                            )}

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-muted ml-1">Rol</label>
                                <select
                                    className="form-control py-2.5"
                                    required
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                                >
                                    <option value="Vendedor">Vendedor</option>
                                    <option value="Admin">Admin</option>
                                    <option value="Super Admin">Super Admin</option>
                                    <option value="Visita">Visita</option>
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-ghost px-6 py-2 h-11">
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary px-6 py-2 h-11" disabled={loading}>
                                    {loading ? 'Procesando...' : editingUser ? 'Actualizar' : 'Crear Usuario'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
