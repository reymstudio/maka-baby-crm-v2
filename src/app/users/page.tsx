"use client";

import React, { useState, useEffect } from 'react';
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
  Crown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { User, UserRole } from '@/types';
import { db } from '@/lib/firebase';
import { initializeApp, getApps, deleteApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
} from 'firebase/auth';
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
    role: 'Vendedor' as UserRole,
  });
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) setIsModalOpen(false);
    };
    if (isModalOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, loading]);

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
    setFormError('');
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        password: '',
        role: user.role,
      });
    } else {
      setEditingUser(null);
      setFormData({ name: '', email: '', password: '', role: 'Vendedor' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setFormError('');

    let secondaryApp = null;
    try {
      if (editingUser) {
        await updateDoc(doc(db, 'users', editingUser.id), {
          name: formData.name.trim(),
          role: formData.role,
        });
      } else {
        const primaryConfig = getApps()[0].options;
        secondaryApp = initializeApp(primaryConfig, `SecondaryCreator_${Date.now()}`);
        const secondaryAuth = getAuth(secondaryApp);

        const userCredential = await createUserWithEmailAndPassword(
          secondaryAuth,
          formData.email.trim(),
          formData.password
        );
        const newUser = userCredential.user;
        await updateProfile(newUser, { displayName: formData.name.trim() });

        await setDoc(doc(db, 'users', newUser.uid), {
          uid: newUser.uid,
          name: formData.name.trim(),
          email: formData.email.trim(),
          role: formData.role,
          createdAt: new Date().toISOString(),
        });

        await signOut(secondaryAuth);
      }
      setIsModalOpen(false);
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : 'Error desconocido al procesar el usuario';
      setFormError(msg);
    } finally {
      if (secondaryApp) {
        await deleteApp(secondaryApp).catch(() => {});
      }
      setLoading(false);
    }
  };

  const handleDelete = async (userToDelete: User) => {
    if (userToDelete.uid === currentUser.uid) {
      return alert('No puedes eliminarte a ti mismo.');
    }
    if (
      confirm(
        `¿Estás seguro de eliminar el perfil de ${userToDelete.name}? Nota: recuerda revocar también su acceso en Firebase Authentication.`
      )
    ) {
      try {
        await deleteDoc(doc(db, 'users', userToDelete.id));
      } catch {
        alert('No se pudo eliminar el usuario. Verifica tus permisos.');
      }
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
                    <th className="p-3.5 lg:p-4 text-xs lg:text-sm font-semibold text-muted whitespace-nowrap">
                      Nombre
                    </th>
                    <th className="p-3.5 lg:p-4 text-xs lg:text-sm font-semibold text-muted whitespace-nowrap">
                      Email
                    </th>
                    <th className="p-3.5 lg:p-4 text-xs lg:text-sm font-semibold text-muted whitespace-nowrap">
                      Rol
                    </th>
                    <th className="p-3.5 lg:p-4 text-xs lg:text-sm font-semibold text-muted text-right whitespace-nowrap">
                      Acciones
                    </th>
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
                          <span className="font-semibold text-sm max-w-[160px] truncate" title={u.name}>
                            {u.name}
                          </span>
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
                          <span
                            className={cn(
                              'text-xs font-bold px-2 py-1 rounded-lg',
                              u.role === 'Super Admin'
                                ? 'bg-amber-50 text-amber-600'
                                : u.role === 'Admin'
                                  ? 'bg-primary/5 text-primary'
                                  : 'bg-sidebar text-muted'
                            )}
                          >
                            {u.role}
                          </span>
                        </div>
                      </td>
                      <td className="p-3.5 lg:p-4 text-right whitespace-nowrap">
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            aria-label={`Editar ${u.name}`}
                            onClick={() => handleOpenModal(u)}
                            className="btn-icon w-7 h-7 sm:w-8 sm:h-8"
                          >
                            <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                          {u.uid !== currentUser.uid && (
                            <button
                              type="button"
                              aria-label={`Eliminar ${u.name}`}
                              onClick={() => handleDelete(u)}
                              className="btn-icon w-7 h-7 sm:w-8 sm:h-8 text-danger border-none hover:bg-red-50"
                            >
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
                    <button
                      type="button"
                      aria-label={`Editar ${u.name}`}
                      onClick={() => handleOpenModal(u)}
                      className="btn-icon w-10 h-10"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    {u.uid !== currentUser.uid && (
                      <button
                        type="button"
                        aria-label={`Eliminar ${u.name}`}
                        onClick={() => handleDelete(u)}
                        className="btn-icon w-10 h-10 text-danger border-none hover:bg-red-50"
                      >
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
                    <span
                      className={cn(
                        'text-xs font-bold',
                        u.role === 'Super Admin'
                          ? 'text-amber-600'
                          : u.role === 'Admin'
                            ? 'text-primary'
                            : 'text-muted'
                      )}
                    >
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
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="user-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/20 backdrop-blur-sm"
          onClick={() => !loading && setIsModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-md p-5 sm:p-6 shadow-2xl animate-in zoom-in-95 duration-300 max-h-[88vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3 sm:mb-4 shrink-0">
              <h2 id="user-modal-title" className="text-lg sm:text-xl font-bold text-primary">
                {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h2>
              <button
                type="button"
                aria-label="Cerrar modal"
                disabled={loading}
                onClick={() => setIsModalOpen(false)}
                className="btn-icon"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div role="alert" className="mb-3 p-3 bg-red-50 border border-red-100 text-danger rounded-xl text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 space-y-3 overflow-y-auto pr-1">
              <div className="space-y-1">
                <label htmlFor="userName" className="text-xs font-semibold text-muted ml-1">
                  Nombre Completo
                </label>
                <input
                  id="userName"
                  type="text"
                  className="form-control"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="userEmail" className="text-xs font-semibold text-muted ml-1">
                  Email {editingUser && <span className="font-normal text-[11px]">(no editable)</span>}
                </label>
                <input
                  id="userEmail"
                  type="email"
                  className="form-control disabled:opacity-60 disabled:cursor-not-allowed"
                  required
                  disabled={!!editingUser}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              {!editingUser && (
                <div className="space-y-1">
                  <label htmlFor="userPassword" className="text-xs font-semibold text-muted ml-1">
                    Contraseña (mínimo 8 caracteres)
                  </label>
                  <input
                    id="userPassword"
                    type="password"
                    minLength={8}
                    className="form-control"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              )}

              <div className="space-y-1">
                <label htmlFor="userRole" className="text-xs font-semibold text-muted ml-1">
                  Rol
                </label>
                <select
                  id="userRole"
                  className="form-control py-2.5"
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                >
                  <option value="Vendedor">Vendedor</option>
                  <option value="Admin">Admin</option>
                  <option value="Super Admin">Super Admin</option>
                  <option value="Visita">Visita</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-ghost px-6 py-2 h-11"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary px-6 py-2 h-11 disabled:opacity-50"
                  disabled={loading}
                >
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