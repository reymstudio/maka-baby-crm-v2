"use client";

import React, { useMemo, useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useStore } from '@/hooks/useStore';
import { useAuth } from '@/context/AuthContext';
import {
  Plus,
  Search,
  Printer,
  Edit2,
  Trash2,
  Tag,
  RefreshCcw,
  CircleDollarSign,
  ChevronDown,
} from 'lucide-react';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { Client, Sale } from '@/types';
import { SaleForm } from '@/components/sales/SaleForm';
import { PrintView } from '@/components/sales/PrintView';

const MONTH_LABELS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function getMonthKey(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '0000-00';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function formatMonthKeyLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  const monthIdx = Number(month) - 1;
  if (monthIdx < 0 || monthIdx > 11) return 'Sin fecha';
  return `${MONTH_LABELS[monthIdx]} ${year}`;
}

export default function SalesPage() {
  const { sales, clients, addSale, updateSale, deleteSale } = useStore();
  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [saleForPayment, setSaleForPayment] = useState<Sale | null>(null);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);
  const [expandedMonths, setExpandedMonths] = useState<{ [key: string]: boolean }>({});
  const [printData, setPrintData] = useState<{ sale: Sale; type: 'invoice' | 'label' } | null>(null);

  const currentMonthKey = useMemo(() => getMonthKey(new Date().toISOString()), []);

  const isAdmin = user?.role === 'Admin' || user?.role === 'Super Admin';
  const isVendedor = user?.role === 'Vendedor';
  const canCreate = isAdmin || isVendedor;
  const canEditOrDelete = isAdmin;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isUpdatingPayment) setIsPaymentModalOpen(false);
    };
    if (isPaymentModalOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPaymentModalOpen, isUpdatingPayment]);

  const toggleMonth = (monthKey: string) => {
    setExpandedMonths((prev) => ({
      ...prev,
      [monthKey]: !(prev[monthKey] ?? monthKey === currentMonthKey),
    }));
  };

  const normalizedSales = useMemo(
    () =>
      sales.map((sale) => {
        if (!sale.clientName) {
          const client = clients.find((c) => c.id === sale.clientId);
          return { ...sale, clientName: client?.name || 'Cliente Desconocido' };
        }
        return sale as Sale & { clientName: string };
      }),
    [sales, clients]
  );

  const filteredSales = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return normalizedSales;
    return normalizedSales.filter(
      (s) =>
        s.saleNumber.toLowerCase().includes(term) ||
        s.clientName.toLowerCase().includes(term)
    );
  }, [normalizedSales, searchTerm]);

  const handleOpenModal = (sale?: Sale) => {
    if (sale && !canEditOrDelete) return;
    if (!sale && !canCreate) return;
    setEditingSale(sale || null);
    setIsModalOpen(true);
  };

  const handleTogglePayment = async (sale: Sale) => {
    if (!canEditOrDelete) return alert('No tienes permisos para cambiar el estado de pago.');
    if (sale.paid) {
      if (confirm('¿Marcar esta venta como Pendiente?')) {
        try {
          await updateSale(sale.id, { paid: false, status: 'Pendiente', paymentDate: null });
        } catch {
          alert('Error al actualizar el estado de pago.');
        }
      }
    } else {
      setSaleForPayment(sale);
      setIsPaymentModalOpen(true);
    }
  };

  const handleConfirmPayment = async () => {
    if (!saleForPayment || !canEditOrDelete || isUpdatingPayment) return;
    setIsUpdatingPayment(true);
    try {
      await updateSale(saleForPayment.id, {
        paid: true,
        status: 'Pagado',
        paymentDate,
      });
      setIsPaymentModalOpen(false);
      setSaleForPayment(null);
    } catch {
      alert('No se pudo registrar el pago. Intenta nuevamente.');
    } finally {
      setIsUpdatingPayment(false);
    }
  };

  const handlePrint = (sale: Sale, type: 'invoice' | 'label') => {
    setPrintData({ sale, type });
    const cleanup = () => {
      setPrintData(null);
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleDeleteSale = async (id: string) => {
    if (!canEditOrDelete) return alert('No tienes permisos para eliminar ventas.');
    if (
      confirm(
        '¿Estás seguro de que deseas eliminar esta venta? Esta acción es permanente y no se puede deshacer.'
      )
    ) {
      try {
        await deleteSale(id);
      } catch {
        alert('Error al eliminar la venta.');
      }
    }
  };

  const groupedSalesByMonth = useMemo(
    () =>
      filteredSales.reduce((acc: { [key: string]: Sale[] }, sale) => {
        const monthKey = getMonthKey(sale.date);
        if (!acc[monthKey]) acc[monthKey] = [];
        acc[monthKey].push(sale);
        return acc;
      }, {}),
    [filteredSales]
  );

  const sortedMonths = useMemo(
    () => Object.keys(groupedSalesByMonth).sort((a, b) => b.localeCompare(a)),
    [groupedSalesByMonth]
  );

  const printClient: Client | null = useMemo(() => {
    if (!printData) return null;
    const found = clients.find((c) => c.id === printData.sale.clientId);
    if (found) return found;
    return {
      id: printData.sale.clientId,
      name: printData.sale.clientName || 'Cliente Eliminado',
      phone: 'Sin teléfono',
      createdAt: '',
    };
  }, [printData, clients]);

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-700 print:hidden">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Ventas</h1>
            <p className="text-muted mt-1">Gestión de transacciones y facturación.</p>
          </div>
          {canCreate && (
            <button onClick={() => handleOpenModal()} className="btn btn-primary">
              <Plus className="w-5 h-5" />
              Nueva Venta
            </button>
          )}
        </header>

        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-[#e8eeee] shadow-sm">
          <div className="ml-3 text-muted">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            aria-label="Buscar ventas"
            placeholder="Buscar por número de venta o cliente..."
            className="flex-1 bg-transparent border-none focus:ring-0 p-2 text-main"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="space-y-6">
          {/* Desktop Grouped Table View */}
          <div className="hidden md:block space-y-6">
            {sortedMonths.map((monthKey) => {
              const isCurrent = monthKey === currentMonthKey;
              const isExpanded = expandedMonths[monthKey] ?? isCurrent;
              const monthSales = groupedSalesByMonth[monthKey];
              const monthLabel = formatMonthKeyLabel(monthKey);
              const monthTotal = monthSales
                .filter((s) => s.status !== 'Cancelado')
                .reduce((sum, s) => sum + (s.grandTotal || 0), 0);

              return (
                <div key={monthKey} className="glass-card overflow-hidden">
                  <button
                    type="button"
                    aria-expanded={isExpanded}
                    onClick={() => toggleMonth(monthKey)}
                    className="w-full flex items-center justify-between p-5 bg-sidebar/40 hover:bg-sidebar/80 transition-colors border-b border-[#e8eeee] text-left focus:outline-none"
                  >
                    <div className="flex items-center gap-4">
                      <h3 className="text-lg font-bold text-primary tracking-tight">{monthLabel}</h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white border border-[#e8eeee] text-muted">
                        {monthSales.length} {monthSales.length === 1 ? 'venta' : 'ventas'}
                      </span>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">
                          Total Mes
                        </span>
                        <span className="text-base font-bold text-primary">
                          {formatCurrency(monthTotal)}
                        </span>
                      </div>
                      <ChevronDown
                        className={cn(
                          'w-5 h-5 text-primary transition-transform duration-300',
                          isExpanded ? 'rotate-180' : 'rotate-0'
                        )}
                      />
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="overflow-x-auto animate-in slide-in-from-top-2 duration-300">
                      <table className="w-full text-left border-collapse min-w-[650px]">
                        <thead className="bg-sidebar">
                          <tr>
                            <th className="p-3.5 lg:p-4 text-xs lg:text-sm font-semibold text-muted whitespace-nowrap">
                              No. Venta
                            </th>
                            <th className="p-3.5 lg:p-4 text-xs lg:text-sm font-semibold text-muted whitespace-nowrap">
                              Fecha
                            </th>
                            <th className="p-3.5 lg:p-4 text-xs lg:text-sm font-semibold text-muted">
                              Cliente
                            </th>
                            <th className="p-3.5 lg:p-4 text-xs lg:text-sm font-semibold text-muted text-center whitespace-nowrap">
                              Estado
                            </th>
                            <th className="p-3.5 lg:p-4 text-xs lg:text-sm font-semibold text-muted whitespace-nowrap">
                              Total
                            </th>
                            <th className="p-3.5 lg:p-4 text-xs lg:text-sm font-semibold text-muted text-right whitespace-nowrap">
                              Acciones
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e8eeee]">
                          {monthSales.map((sale) => (
                            <tr key={sale.id} className="hover:bg-sidebar/30 transition-colors">
                              <td className="p-3.5 lg:p-4 uppercase font-bold text-xs text-primary whitespace-nowrap">
                                #{sale.saleNumber}
                              </td>
                              <td className="p-3.5 lg:p-4 text-xs lg:text-sm text-muted whitespace-nowrap">
                                {formatDate(sale.date)}
                              </td>
                              <td className="p-3.5 lg:p-4">
                                <div
                                  className="font-semibold text-main text-sm max-w-[170px] lg:max-w-[210px] xl:max-w-xs truncate"
                                  title={sale.clientName}
                                >
                                  {sale.clientName}
                                </div>
                              </td>
                              <td className="p-3.5 lg:p-4 text-center whitespace-nowrap">
                                <span
                                  className={cn(
                                    'px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                                    sale.paid
                                      ? 'bg-green-50 text-green-600 border border-green-100'
                                      : 'bg-red-50 text-red-600 border border-red-100'
                                  )}
                                >
                                  {sale.paid ? 'Pagado' : 'Pendiente'}
                                </span>
                              </td>
                              <td className="p-3.5 lg:p-4 font-bold text-primary whitespace-nowrap text-sm lg:text-base">
                                {formatCurrency(sale.grandTotal)}
                              </td>
                              <td className="p-3.5 lg:p-4 text-right whitespace-nowrap">
                                <div className="flex justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handlePrint(sale, 'invoice')}
                                    title="Imprimir Factura"
                                    aria-label={`Imprimir factura ${sale.saleNumber}`}
                                    className="btn-icon w-7 h-7 sm:w-8 sm:h-8"
                                  >
                                    <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handlePrint(sale, 'label')}
                                    title="Imprimir Etiqueta"
                                    aria-label={`Imprimir etiqueta ${sale.saleNumber}`}
                                    className="btn-icon w-7 h-7 sm:w-8 sm:h-8"
                                  >
                                    <Tag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                  </button>
                                  {canEditOrDelete && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => handleTogglePayment(sale)}
                                        title="Cambiar Estado de Pago"
                                        aria-label={`Cambiar estado de pago ${sale.saleNumber}`}
                                        className="btn-icon w-7 h-7 sm:w-8 sm:h-8"
                                      >
                                        <RefreshCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleOpenModal(sale)}
                                        title="Editar"
                                        aria-label={`Editar venta ${sale.saleNumber}`}
                                        className="btn-icon w-7 h-7 sm:w-8 sm:h-8"
                                      >
                                        <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteSale(sale.id)}
                                        title="Borrar"
                                        aria-label={`Borrar venta ${sale.saleNumber}`}
                                        className="btn-icon w-7 h-7 sm:w-8 sm:h-8 text-danger border-danger/20 hover:bg-danger hover:text-white"
                                      >
                                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
            {filteredSales.length === 0 && (
              <div className="glass-card p-12 text-center text-muted">
                <CircleDollarSign className="w-12 h-12 mx-auto mb-3 opacity-20" />
                No hay registros de ventas.
              </div>
            )}
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-6">
            {sortedMonths.map((monthKey) => {
              const isCurrent = monthKey === currentMonthKey;
              const isExpanded = expandedMonths[monthKey] ?? isCurrent;
              const monthSales = groupedSalesByMonth[monthKey];
              const monthLabel = formatMonthKeyLabel(monthKey);

              return (
                <div key={monthKey} className="space-y-4">
                  <button
                    type="button"
                    aria-expanded={isExpanded}
                    onClick={() => toggleMonth(monthKey)}
                    className="w-full flex items-center gap-3 px-2 group transition-all cursor-pointer hover:opacity-85"
                  >
                    <div className="h-px flex-1 bg-[#e8eeee]" />
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-muted uppercase tracking-widest">
                        {monthLabel}
                      </span>
                      <ChevronDown
                        className={cn(
                          'w-3 h-3 transition-transform duration-300 text-primary',
                          isExpanded ? 'rotate-180' : 'rotate-0'
                        )}
                      />
                    </div>
                    <div className="h-px flex-1 bg-[#e8eeee]" />
                  </button>

                  {isExpanded && (
                    <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                      {monthSales.map((sale) => (
                        <div key={sale.id} className="glass-card p-6 space-y-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="text-xs font-bold text-primary uppercase tracking-tight mb-1">
                                Venta #{sale.saleNumber}
                              </div>
                              <div className="font-bold text-lg text-main leading-tight">
                                {sale.clientName}
                              </div>
                              <div className="text-xs text-muted mt-1">{formatDate(sale.date)}</div>
                            </div>
                            <span
                              className={cn(
                                'px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider',
                                sale.paid
                                  ? 'bg-green-50 text-green-600 border border-green-100'
                                  : 'bg-red-50 text-red-600 border border-red-100'
                              )}
                            >
                              {sale.paid ? 'Pagado' : 'Pendiente'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between p-4 bg-sidebar/50 rounded-2xl">
                            <div className="text-sm font-medium text-muted">Total Venta</div>
                            <div className="text-xl font-black text-primary">
                              {formatCurrency(sale.grandTotal)}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => handlePrint(sale, 'invoice')}
                                className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-[#e8eeee] rounded-xl text-sm font-bold shadow-sm active:scale-95 transition-all"
                              >
                                <Printer className="w-4 h-4" />
                                Factura
                              </button>
                              <button
                                type="button"
                                onClick={() => handlePrint(sale, 'label')}
                                className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-[#e8eeee] rounded-xl text-sm font-bold shadow-sm active:scale-95 transition-all"
                              >
                                <Tag className="w-4 h-4" />
                                Etiqueta
                              </button>
                            </div>

                            {canEditOrDelete && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleTogglePayment(sale)}
                                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-[#e8eeee] rounded-xl text-sm font-bold shadow-sm active:scale-95 transition-all"
                                >
                                  <RefreshCcw className="w-4 h-4" />
                                  Cambiar Estado de Pago
                                </button>
                                <div className="grid grid-cols-2 gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenModal(sale)}
                                    className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-[#e8eeee] rounded-xl text-sm font-bold shadow-sm active:scale-95 transition-all"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                    Editar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteSale(sale.id)}
                                    className="flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-danger rounded-xl text-sm font-bold shadow-sm active:scale-95 transition-all"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    Borrar
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            {filteredSales.length === 0 && (
              <div className="glass-card p-12 text-center text-muted">
                <CircleDollarSign className="w-12 h-12 mx-auto mb-3 opacity-20" />
                No hay registros de ventas.
              </div>
            )}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <SaleForm
          sale={editingSale}
          clients={clients}
          onClose={() => setIsModalOpen(false)}
          onSubmit={async (data) => {
            if (editingSale) await updateSale(editingSale.id, data);
            else await addSale(data);
            setIsModalOpen(false);
          }}
        />
      )}

      {isPaymentModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="payment-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm"
          onClick={() => !isUpdatingPayment && setIsPaymentModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-sm p-8 shadow-2xl animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="payment-modal-title" className="text-xl font-bold mb-4">
              Registrar Pago
            </h2>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="paymentDateInput" className="text-sm text-muted">
                  Fecha de Pago
                </label>
                <input
                  id="paymentDateInput"
                  type="date"
                  className="form-control"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button
                type="button"
                disabled={isUpdatingPayment}
                onClick={() => setIsPaymentModalOpen(false)}
                className="btn btn-ghost"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isUpdatingPayment}
                onClick={handleConfirmPayment}
                className="btn btn-primary disabled:opacity-50"
              >
                {isUpdatingPayment ? 'Guardando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {printData && printClient && (
        <PrintView sale={printData.sale} client={printClient} type={printData.type} />
      )}
    </DashboardLayout>
  );
}