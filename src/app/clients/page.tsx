"use client";

import React, { useMemo, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useStore } from '@/hooks/useStore';
import { useAuth } from '@/context/AuthContext';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    UserPlus,
    MapPin,
    User
} from 'lucide-react';
import { Client } from '@/types';

const EMPTY_CLIENT_FORM = {
    commercialName: '',
    name: '',
    phone: '',
    email: '',
    address: '',
    complemento: '',
    barrio: '',
    ciudad: '',
    departamento: '',
    nit: ''
};

export default function ClientsPage() {
    const { clients, addClient, updateClient, deleteClient } = useStore();
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);

    const [formData, setFormData] = useState(EMPTY_CLIENT_FORM);

    const formatNit = (value: string) => {
        // Remove all non-digits
        const digits = value.replace(/\D/g, '');
        // Format with dot thousands separator
        return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    };

    const formatPhone = (value: string) => {
        const digits = value.replace(/\D/g, '').slice(0, 10);
        if (digits.length <= 3) return digits.length ? `(${digits}` : '';
        if (digits.length <= 10) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 10)}`;
    };

    const filteredClients = useMemo(() => clients.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm) ||
        (c.nit && c.nit.includes(searchTerm))
    ), [clients, searchTerm]);

    const canCreate = user?.role !== 'Visita';
    const canEditOrDelete = user?.role !== 'Visita';

    const handleOpenModal = (client?: Client) => {
        if (client) {
            setEditingClient(client);
            setFormData({
                commercialName: client.commercialName || '',
                name: client.name,
                phone: client.phone,
                email: client.email || '',
                address: client.address || '',
                complemento: client.complemento || '',
                barrio: client.barrio || '',
                ciudad: client.ciudad || '',
                departamento: client.departamento || '',
                nit: client.nit || ''
            });
        } else {
            setEditingClient(null);
            setFormData(EMPTY_CLIENT_FORM);
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingClient) {
                await updateClient(editingClient.id, formData);
            } else {
                await addClient({ ...formData, createdAt: new Date().toISOString() });
            }
            setIsModalOpen(false);
        } catch {
            alert('Error al guardar cliente');
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('¿Estás seguro de eliminar este cliente?')) {
            await deleteClient(id);
        }
    };

    const inputClass = "w-full px-4 py-3 bg-[#f5f5f3] border-none rounded-xl text-sm text-main placeholder:text-[#b0b5b2] focus:outline-none focus:ring-2 focus:ring-terracota/20";

    return (
        <DashboardLayout>
            <div className="space-y-8 animate-in fade-in duration-700">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
                        <p className="text-muted mt-1">Gestione su base de datos de clientes.</p>
                    </div>
                    <button onClick={() => handleOpenModal()} className="btn btn-primary text-black disabled:opacity-50 disabled:cursor-not-allowed" disabled={!canCreate}>
                        <Plus className="w-5 h-5" />
                        Nuevo Cliente
                    </button>
                </header>

                <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-[#e8eeee] shadow-sm">
                    <div className="ml-3 text-muted"><Search className="w-5 h-5" /></div>
                    <input
                        type="text"
                        placeholder="Buscar por nombre, teléfono o NIT..."
                        className="flex-1 bg-transparent border-none focus:ring-0 p-2 text-main"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="space-y-4">
                    {/* Desktop Table */}
                    <div className="hidden md:block glass-card overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-sidebar">
                                    <tr>
                                        <th className="p-4 text-sm font-semibold text-muted">Nombre Comercial / NIT</th>
                                        <th className="p-4 text-sm font-semibold text-muted">Nombre de Contacto</th>
                                        <th className="p-4 text-sm font-semibold text-muted">Teléfono / Correo Electrónico</th>
                                        <th className="p-4 text-sm font-semibold text-muted hidden lg:table-cell">Ubicación</th>
                                        <th className="p-4 text-sm font-semibold text-muted text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#e8eeee]">
                                    {filteredClients.map((client) => (
                                        <tr key={client.id} className="hover:bg-sidebar/30 transition-colors">
                                            <td className="p-4">
                                                <div className="font-semibold text-main">{client.commercialName || '-'}</div>
                                                <div className="text-xs text-muted">NIT/CC: {client.nit || 'Sin definir'}</div>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-sm text-main">{client.name}</div>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-sm text-main">{client.phone}</div>
                                                {client.email && (
                                                    <div className="text-xs text-muted mt-1">{client.email}</div>
                                                )}
                                            </td>
                                            <td className="p-4 hidden lg:table-cell">
                                                <div className="text-sm text-main">{client.address || 'Sin dirección'}</div>
                                                <div className="text-xs text-muted">
                                                    {[client.barrio, client.ciudad, client.departamento].filter(Boolean).join(', ') || '-'}
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => handleOpenModal(client)} className="btn-icon disabled:opacity-50 disabled:cursor-not-allowed" disabled={!canEditOrDelete}><Edit2 className="w-4 h-4" /></button>
                                                    <button onClick={() => handleDelete(client.id)} className="btn-icon hover:bg-danger hover:border-danger hover:text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-[#e8eeee] disabled:hover:text-main" disabled={!canEditOrDelete}><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredClients.length === 0 && (
                                        <tr><td colSpan={5} className="p-12 text-center text-muted">
                                            <UserPlus className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                            No se encontraron clientes.
                                        </td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden space-y-4">
                        {filteredClients.map((client) => (
                            <div key={client.id} className="glass-card p-6 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-bold text-lg text-main">{client.name}</div>
                                        {client.commercialName && <div className="text-xs text-terracota">{client.commercialName}</div>}
                                        <div className="text-xs text-muted">NIT/CC: {client.nit || 'Sin definir'}</div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleOpenModal(client)} className="btn-icon w-10 h-10 disabled:opacity-50 disabled:cursor-not-allowed" disabled={!canEditOrDelete}><Edit2 className="w-5 h-5" /></button>
                                        <button onClick={() => handleDelete(client.id)} className="btn-icon w-10 h-10 text-danger border-none hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent" disabled={!canEditOrDelete}><Trash2 className="w-5 h-5" /></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {filteredClients.length === 0 && (
                            <div className="glass-card p-12 text-center text-muted">
                                <UserPlus className="w-12 h-12 mx-auto mb-3 opacity-20" />No se encontraron clientes.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal Cliente */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-white rounded-[28px] w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

                        {/* Header */}
                        <div className="flex justify-between items-center px-8 pt-8 pb-6">
                            <h2 className="text-[26px] font-serif text-main">
                                {editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 flex items-center justify-center text-[#8c938f] hover:text-main transition-colors text-xl">
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-6">

                            {/* Información Personal */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-terracota" />
                                    <span className="text-[10px] font-bold text-[#8c938f] uppercase tracking-widest">Información Personal</span>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[12px] font-medium text-[#6b7280]">Nombre Comercial</label>
                                        <input type="text" className={inputClass} placeholder="Ej: Mäka Baby" required
                                            value={formData.commercialName} onChange={e => setFormData({ ...formData, commercialName: e.target.value })} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[12px] font-medium text-[#6b7280]">Nombre de Contacto</label>
                                        <input type="text" className={inputClass} placeholder="Ej: María Restrepo" required
                                            value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[12px] font-medium text-[#6b7280]">Cédula / NIT</label>
                                        <input type="text" className={inputClass} placeholder="1.234.567.890" required
                                            value={formData.nit}
                                            onChange={e => setFormData({ ...formData, nit: formatNit(e.target.value) })} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[12px] font-medium text-[#6b7280]">Teléfono</label>
                                        <input type="tel" className={inputClass} placeholder="(300) 0000000" required
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: formatPhone(e.target.value) })} />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[12px] font-medium text-[#6b7280]">Correo Electrónico (opcional)</label>
                                    <input type="email" className={inputClass} placeholder="nombre@correo.com"
                                        value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                </div>
                            </div>

                            {/* Ubicación */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-terracota" />
                                    <span className="text-[10px] font-bold text-[#8c938f] uppercase tracking-widest">Ubicación</span>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[12px] font-medium text-[#6b7280]">Dirección</label>
                                    <input type="text" className={inputClass} placeholder="Calle 123 #45-67" required
                                        value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[12px] font-medium text-[#6b7280]">Dirección (Complemento)</label>
                                        <input type="text" className={inputClass} placeholder="Ej: Apto 101, Torre 2"
                                            value={formData.complemento} onChange={e => setFormData({ ...formData, complemento: e.target.value })} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[12px] font-medium text-[#6b7280]">Barrio</label>
                                        <input type="text" className={inputClass} placeholder="Ej: El Poblado" required
                                            value={formData.barrio} onChange={e => setFormData({ ...formData, barrio: e.target.value })} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[12px] font-medium text-[#6b7280]">Ciudad</label>
                                        <input type="text" className={inputClass} placeholder="Ej: Bogotá" required
                                            value={formData.ciudad} onChange={e => setFormData({ ...formData, ciudad: e.target.value })} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[12px] font-medium text-[#6b7280]">Departamento</label>
                                        <input type="text" className={inputClass} placeholder="Ej: Antioquia" required
                                            value={formData.departamento} onChange={e => setFormData({ ...formData, departamento: e.target.value })} />
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex justify-between items-center pt-4 border-t border-[#f0eeeb]">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="text-[13px] text-[#8c938f] hover:text-main transition-colors font-medium">
                                    Descartar cambios
                                </button>
                                <button type="submit" className="bg-terracota text-white font-bold px-8 py-3 rounded-full hover:opacity-90 transition-all hover:-translate-y-0.5 active:scale-95 shadow-sm">
                                    {editingClient ? 'Guardar Cambios' : 'Guardar Cliente'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
