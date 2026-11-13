"use client";

import React, { useMemo, useState, useEffect } from 'react';
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
  User,
  Phone,
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
  nit: '',
};

export default function ClientsPage() {
  const { clients, addClient, updateClient, deleteClient } = useStore();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState(EMPTY_CLIENT_FORM);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSaving) setIsModalOpen(false);
    };
    if (isModalOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, isSaving]);

  const formatNit = (value: string) => {
    const digits = value.replace(/\D/g, '');
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    if (digits.length <= 3) return digits.length ? `(${digits}` : '';
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  };

  const filteredClients = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const cleanDigits = searchTerm.replace(/\D/g, '');
    if (!term) return clients;

    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        (c.commercialName && c.commercialName.toLowerCase().includes(term)) ||
        (c.ciudad && c.ciudad.toLowerCase().includes(term)) ||
        c.phone.includes(term) ||
        (cleanDigits && c.phone.replace(/\D/g, '').includes(cleanDigits)) ||
        (c.nit && c.nit.toLowerCase().includes(term)) ||
        (cleanDigits && c.nit?.replace(/\D/g, '').includes(cleanDigits))
    );
  }, [clients, searchTerm]);

  const canManageClients = user?.role === 'Admin' || user?.role === 'Super Admin';

  const handleOpenModal = (client?: Client) => {
    if (!canManageClients) return;
    setFormError('');
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
        nit: client.nit || '',
      });
    } else {
      setEditingClient(null);
      setFormData(EMPTY_CLIENT_FORM);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageClients || isSaving) return;

    setIsSaving(true);
    setFormError('');
    try {
      if (editingClient) {
        await updateClient(editingClient.id, formData);
      } else {
        await addClient({ ...formData, createdAt: new Date().toISOString() });
      }
      setIsModalOpen(false);
    } catch {
      setFormError('No se pudo guardar el cliente. Verifica tu conexión o permisos.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!canManageClients) return;
    if (confirm('¿Estás seguro de eliminar este cliente?')) {
      try {
        await deleteClient(id);
      } catch {
        alert('No se pudo eliminar el cliente. Verifica tus permisos.');
      }
    }
  };

  const inputClass =
    'w-full px-4 py-3 bg-[#f5f5f3] border-none rounded-xl text-sm text-main placeholder:text-[#b0b5b2] focus:outline-none focus:ring-2 focus:ring-terracota/20';

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-700">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
            <p className="text-muted mt-1">Gestione su base de datos de clientes.</p>
          </div>
          {canManageClients && (
            <button onClick={() => handleOpenModal()} className="btn btn-primary">
              <Plus className="w-5 h-5" />
              Nuevo Cliente
            </button>
          )}
        </header>

        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-[#e8eeee] shadow-sm">
          <div className="ml-3 text-muted">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            aria-label="Buscar clientes"
            placeholder="Buscar por nombre comercial, contacto, ciudad, teléfono o NIT..."
            className="flex-1 bg-transparent border-none focus:ring-0 p-2 text-main"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="space-y-4">
          {/* Desktop Table */}
          <div className="hidden md:block glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[650px]">
                <thead className="bg-sidebar">
                  <tr>
                    <th className="p-3.5 lg:p-4 text-xs lg:text-sm font-semibold text-muted whitespace-nowrap">
                      Nombre Comercial / NIT
                    </th>
                    <th className="p-3.5 lg:p-4 text-xs lg:text-sm font-semibold text-muted">
                      Nombre de Contacto
                    </th>
                    <th className="p-3.5 lg:p-4 text-xs lg:text-sm font-semibold text-muted whitespace-nowrap">
                      Teléfono / Correo
                    </th>
                    <th className="p-3.5 lg:p-4 text-xs lg:text-sm font-semibold text-muted hidden lg:table-cell">
                      Ubicación
                    </th>
                    {canManageClients && (
                      <th className="p-3.5 lg:p-4 text-xs lg:text-sm font-semibold text-muted text-right whitespace-nowrap">
                        Acciones
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e8eeee]">
                  {filteredClients.map((client) => (
                    <tr key={client.id} className="hover:bg-sidebar/30 transition-colors">
                      <td className="p-3.5 lg:p-4">
                        <div
                          className="font-semibold text-main text-sm max-w-[180px] truncate"
                          title={client.commercialName || '-'}
                        >
                          {client.commercialName || '-'}
                        </div>
                        <div className="text-xs text-muted whitespace-nowrap">
                          NIT/CC: {client.nit || 'Sin definir'}
                        </div>
                      </td>
                      <td className="p-3.5 lg:p-4">
                        <div
                          className="text-sm text-main font-medium max-w-[160px] truncate"
                          title={client.name}
                        >
                          {client.name}
                        </div>
                      </td>
                      <td className="p-3.5 lg:p-4 whitespace-nowrap">
                        <div className="text-sm text-main">{client.phone}</div>
                        {client.email && (
                          <div
                            className="text-xs text-muted mt-0.5 max-w-[160px] truncate"
                            title={client.email}
                          >
                            {client.email}
                          </div>
                        )}
                      </td>
                      <td className="p-3.5 lg:p-4 hidden lg:table-cell">
                        <div
                          className="text-sm text-main max-w-[180px] truncate"
                          title={
                            [client.ciudad, client.departamento].filter(Boolean).join(', ') ||
                            client.address ||
                            '-'
                          }
                        >
                          {[client.ciudad, client.departamento].filter(Boolean).join(', ') ||
                            client.address ||
                            '-'}
                        </div>
                        <div
                          className="text-xs text-muted max-w-[180px] truncate"
                          title={client.address || '-'}
                        >
                          {client.address || '-'}
                        </div>
                      </td>
                      {canManageClients && (
                        <td className="p-3.5 lg:p-4 text-right whitespace-nowrap">
                          <div className="flex justify-end gap-1.5">
                            <button
                              type="button"
                              aria-label={`Editar ${client.name}`}
                              onClick={() => handleOpenModal(client)}
                              className="btn-icon w-7 h-7 sm:w-8 sm:h-8"
                            >
                              <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </button>
                            <button
                              type="button"
                              aria-label={`Eliminar ${client.name}`}
                              onClick={() => handleDelete(client.id)}
                              className="btn-icon w-7 h-7 sm:w-8 sm:h-8 hover:bg-danger hover:border-danger hover:text-white"
                            >
                              <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                  {filteredClients.length === 0 && (
                    <tr>
                      <td colSpan={canManageClients ? 5 : 4} className="p-12 text-center text-muted">
                        <UserPlus className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        No se encontraron clientes.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {filteredClients.map((client) => (
              <div key={client.id} className="glass-card p-5 space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <div className="font-bold text-lg text-main truncate">
                      {client.commercialName || client.name}
                    </div>
                    {client.commercialName && (
                      <div className="text-xs font-medium text-main/80">{client.name}</div>
                    )}
                    <div className="text-xs text-muted mt-0.5">
                      NIT/CC: {client.nit || 'Sin definir'}
                    </div>
                  </div>
                  {canManageClients && (
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        type="button"
                        aria-label={`Editar ${client.name}`}
                        onClick={() => handleOpenModal(client)}
                        className="btn-icon w-9 h-9"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Eliminar ${client.name}`}
                        onClick={() => handleDelete(client.id)}
                        className="btn-icon w-9 h-9 text-danger border-none hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-[#e8eeee] flex flex-col gap-1.5 text-xs text-muted">
                  <a
                    href={`tel:${client.phone.replace(/\D/g, '')}`}
                    className="flex items-center gap-2 text-main font-medium"
                  >
                    <Phone className="w-3.5 h-3.5 text-terracota shrink-0" />
                    {client.phone}
                  </a>
                  {(client.ciudad || client.address) && (
                    <div className="flex items-center gap-2 truncate">
                      <MapPin className="w-3.5 h-3.5 text-terracota shrink-0" />
                      <span className="truncate">
                        {[client.address, client.barrio, client.ciudad].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {filteredClients.length === 0 && (
              <div className="glass-card p-12 text-center text-muted">
                <UserPlus className="w-12 h-12 mx-auto mb-3 opacity-20" />
                No se encontraron clientes.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Cliente */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="client-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/30 backdrop-blur-sm"
          onClick={() => !isSaving && setIsModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl lg:rounded-[28px] w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-300 max-h-[88vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-6 sm:px-8 pt-5 sm:pt-6 pb-3 sm:pb-4 shrink-0 border-b border-[#f0eeeb]">
              <h2 id="client-modal-title" className="text-xl sm:text-[24px] font-serif text-main">
                {editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
              </h2>
              <button
                type="button"
                aria-label="Cerrar modal"
                disabled={isSaving}
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center text-[#8c938f] hover:text-main transition-colors text-xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="px-6 sm:px-8 py-4 space-y-5 overflow-y-auto flex-1">
                {formError && (
                  <div role="alert" className="p-3 bg-red-50 border border-red-100 text-danger rounded-xl text-xs">
                    {formError}
                  </div>
                )}

                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-terracota" />
                    <span className="text-[10px] font-bold text-[#8c938f] uppercase tracking-widest">
                      Información Personal
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1">
                      <label htmlFor="commercialName" className="text-[11px] sm:text-[12px] font-medium text-[#6b7280]">
                        Nombre Comercial
                      </label>
                      <input
                        id="commercialName"
                        type="text"
                        className={inputClass}
                        placeholder="Ej: Mäka Baby"
                        required
                        value={formData.commercialName}
                        onChange={(e) => setFormData({ ...formData, commercialName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="contactName" className="text-[11px] sm:text-[12px] font-medium text-[#6b7280]">
                        Nombre de Contacto
                      </label>
                      <input
                        id="contactName"
                        type="text"
                        className={inputClass}
                        placeholder="Ej: María Restrepo"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1">
                      <label htmlFor="nit" className="text-[11px] sm:text-[12px] font-medium text-[#6b7280]">
                        Cédula / NIT
                      </label>
                      <input
                        id="nit"
                        type="text"
                        className={inputClass}
                        placeholder="1.234.567.890"
                        required
                        value={formData.nit}
                        onChange={(e) => setFormData({ ...formData, nit: formatNit(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="phone" className="text-[11px] sm:text-[12px] font-medium text-[#6b7280]">
                        Teléfono
                      </label>
                      <input
                        id="phone"
                        type="tel"
                        className={inputClass}
                        placeholder="(300) 0000000"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="clientEmail" className="text-[11px] sm:text-[12px] font-medium text-[#6b7280]">
                      Correo Electrónico (opcional)
                    </label>
                    <input
                      id="clientEmail"
                      type="email"
                      className={inputClass}
                      placeholder="nombre@correo.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-3 sm:space-y-4 pt-1">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-terracota" />
                    <span className="text-[10px] font-bold text-[#8c938f] uppercase tracking-widest">
                      Ubicación
                    </span>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="address" className="text-[11px] sm:text-[12px] font-medium text-[#6b7280]">
                      Dirección
                    </label>
                    <input
                      id="address"
                      type="text"
                      className={inputClass}
                      placeholder="Calle 123 #45-67"
                      required
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1">
                      <label htmlFor="complemento" className="text-[11px] sm:text-[12px] font-medium text-[#6b7280]">
                        Dirección (Complemento)
                      </label>
                      <input
                        id="complemento"
                        type="text"
                        className={inputClass}
                        placeholder="Ej: Apto 101, Torre 2"
                        value={formData.complemento}
                        onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="barrio" className="text-[11px] sm:text-[12px] font-medium text-[#6b7280]">
                        Barrio
                      </label>
                      <input
                        id="barrio"
                        type="text"
                        className={inputClass}
                        placeholder="Ej: El Poblado"
                        required
                        value={formData.barrio}
                        onChange={(e) => setFormData({ ...formData, barrio: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1">
                      <label htmlFor="ciudad" className="text-[11px] sm:text-[12px] font-medium text-[#6b7280]">
                        Ciudad
                      </label>
                      <input
                        id="ciudad"
                        type="text"
                        className={inputClass}
                        placeholder="Ej: Bogotá"
                        required
                        value={formData.ciudad}
                        onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="departamento" className="text-[11px] sm:text-[12px] font-medium text-[#6b7280]">
                        Departamento
                      </label>
                      <input
                        id="departamento"
                        type="text"
                        className={inputClass}
                        placeholder="Ej: Antioquia"
                        required
                        value={formData.departamento}
                        onChange={(e) => setFormData({ ...formData, departamento: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center px-6 sm:px-8 py-3.5 sm:py-4 border-t border-[#f0eeeb] shrink-0 bg-white rounded-b-2xl lg:rounded-b-[28px]">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setIsModalOpen(false)}
                  className="text-[13px] text-[#8c938f] hover:text-main transition-colors font-medium"
                >
                  Descartar cambios
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-terracota text-white font-bold px-6 sm:px-8 py-2.5 sm:py-3 rounded-full hover:opacity-90 transition-all hover:-translate-y-0.5 active:scale-95 shadow-sm text-sm disabled:opacity-50"
                >
                  {isSaving ? 'Guardando...' : editingClient ? 'Guardar Cambios' : 'Guardar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}