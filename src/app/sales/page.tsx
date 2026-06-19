"use client";

import React, { useMemo, useState } from 'react';
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
    ChevronDown
} from 'lucide-react';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { Sale } from '@/types';
import { SaleForm } from '@/components/sales/SaleForm';
import { PrintView } from '@/components/sales/PrintView';

export default function SalesPage() {
    const { sales, clients, addSale, updateSale, deleteSale } = useStore();
    const { user } = useAuth();

    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSale, setEditingSale] = useState<Sale | null>(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [saleForPayment, setSaleForPayment] = useState<Sale | null>(null);
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [expandedMonths, setExpandedMonths] = useState<{ [key: string]: boolean }>({});
    const currentMonthKey = useMemo(() => new Date().toLocaleString('es-ES', { month: 'long', year: 'numeric' }), []);

    const toggleMonth = (monthKey: string) => {
        setExpandedMonths(prev => ({
            ...prev,
            [monthKey]: !prev[monthKey]
        }));
    };

    const [printData, setPrintData] = useState<{ sale: Sale; type: 'invoice' | 'label' } | null>(null);

    const canCreate = user?.role !== 'Visita';
    const canEditOrDelete = user?.role !== 'Vendedor' && user?.role !== 'Visita';

    const normalizedSales = useMemo(() => sales.map(sale => {
        if (!sale.clientName) {
            const client = clients.find(c => c.id === sale.clientId);
            return { ...sale, clientName: client?.name || 'Cliente Desconocido' };
        }
        return sale as Sale & { clientName: string };
    }), [sales, clients]);

    const filteredSales = useMemo(() => normalizedSales.filter(s =>
        s.saleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.clientName.toLowerCase().includes(searchTerm.toLowerCase())
    ), [normalizedSales, searchTerm]);

    const handleOpenModal = (sale?: Sale) => {
        setEditingSale(sale || null);
        setIsModalOpen(true);
    };

    const handleTogglePayment = (sale: Sale) => {
        if (!canEditOrDelete) return alert('No tienes permisos.');
        if (sale.paid) {
            if (confirm('¿Marcar esta venta como Pendiente?')) {
                updateSale(sale.id, { paid: false, status: 'Pendiente', paymentDate: null });
            }
        } else {
            setSaleForPayment(sale);
            setIsPaymentModalOpen(true);
        }
    };

    const handleConfirmPayment = async () => {
        if (!saleForPayment) return;
        await updateSale(saleForPayment.id, {
            paid: true,
            status: 'Pagado',
            paymentDate: paymentDate
        });

        setIsPaymentModalOpen(false);
        setSaleForPayment(null);
    };

    const handlePrint = (sale: Sale, type: 'invoice' | 'label') => {
        setPrintData({ sale, type });
        setTimeout(() => {
            window.print();
            setPrintData(null);
        }, 100);
    };

    const handleDeleteSale = async (id: string) => {
        if (!canEditOrDelete) return alert('No tienes permisos.');
        if (confirm('¿Estás seguro de que deseas eliminar esta venta? Esta acción es permanente y no se puede deshacer.')) {
            try {
                await deleteSale(id);
            } catch {
                alert('Error al eliminar la venta.');
            }
        }
    };

    const groupedSalesByMonth = useMemo(() => filteredSales.reduce((acc: { [key: string]: Sale[] }, sale) => {
        const date = new Date(sale.date);
        const monthKey = date.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
        if (!acc[monthKey]) acc[monthKey] = [];
        acc[monthKey].push(sale);
        return acc;
    }, {}), [filteredSales]);

    const sortedMonths = useMemo(() => Object.keys(groupedSalesByMonth).sort((a, b) => {
        const dateA = new Date(groupedSalesByMonth[a][0].date);
        const dateB = new Date(groupedSalesByMonth[b][0].date);
        return dateB.getTime() - dateA.getTime();
    }), [groupedSalesByMonth]);

    return (
        <DashboardLayout>
            <div className="space-y-8 animate-in fade-in duration-700 print:hidden">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Ventas</h1>
                        <p className="text-muted mt-1">Gestión de transacciones y facturación.</p>
                    </div>
                    <button onClick={() => handleOpenModal()} className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed" disabled={!canCreate}>
                        <Plus className="w-5 h-5" />
                        Nueva Venta
                    </button>
                </header>

                <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-[#e8eeee] shadow-sm">
                    <div className="ml-3 text-muted">
                        <Search className="w-5 h-5" />
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar por número de venta o cliente..."
                        className="flex-1 bg-transparent border-none focus:ring-0 p-2 text-main"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="space-y-6">
                    {/* Desktop Grouped Table View */}
                    <div className="hidden md:block space-y-6">
                        {sortedMonths.map(monthKey => {
                            const isCurrent = monthKey === currentMonthKey;
                            const isExpanded = expandedMonths[monthKey] ?? isCurrent;
                            const monthSales = groupedSalesByMonth[monthKey];
                            const capitalizedMonth = monthKey.charAt(0).toUpperCase() + monthKey.slice(1);
                            const monthTotal = monthSales.reduce((sum, s) => sum + (s.grandTotal || 0), 0);

                            return (
                                <div key={monthKey} className="glass-card overflow-hidden">
                                    <button
                                        onClick={() => toggleMonth(monthKey)}
                                        className="w-full flex items-center justify-between p-5 bg-sidebar/40 hover:bg-sidebar/80 transition-colors border-b border-[#e8eeee] text-left focus:outline-none"
                                    >
                                        <div className="flex items-center gap-4">
                                            <h3 className="text-lg font-bold text-primary tracking-tight">
                                                {capitalizedMonth}
                                            </h3>
                                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white border border-[#e8eeee] text-muted">
                                                {monthSales.length} {monthSales.length === 1 ? 'venta' : 'ventas'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">Total Mes</span>
                                                <span className="text-base font-bold text-primary">{formatCurrency(monthTotal)}</span>
                                            </div>
                                            <ChevronDown className={cn(
                                                "w-5 h-5 text-primary transition-transform duration-300",
                                                isExpanded ? "rotate-180" : "rotate-0"
                                            )} />
                                        </div>
                                    </button>

                                    {isExpanded && (
                                        <div className="overflow-x-auto animate-in slide-in-from-top-2 duration-300">
                                            <table className="w-full text-left border-collapse">
                                                <thead className="bg-sidebar">
                                                    <tr>
                                                        <th className="p-4 text-sm font-semibold text-muted">No. Venta</th>
                                                        <th className="p-4 text-sm font-semibold text-muted">Fecha</th>
                                                        <th className="p-4 text-sm font-semibold text-muted">Cliente</th>
                                                        <th className="p-4 text-sm font-semibold text-muted text-center">Estado</th>
                                                        <th className="p-4 text-sm font-semibold text-muted">Total</th>
                                                        <th className="p-4 text-sm font-semibold text-muted text-right">Acciones</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-[#e8eeee]">
                                                    {monthSales.map((sale) => (
                                                        <tr key={sale.id} className="hover:bg-sidebar/30 transition-colors">
                                                            <td className="p-4 uppercase font-bold text-xs text-primary">
                                                                #{sale.saleNumber}
                                                            </td>
                                                            <td className="p-4 text-sm text-muted">
                                                                {formatDate(sale.date)}
                                                            </td>
                                                            <td className="p-4">
                                                                <div className="font-semibold text-main">{sale.clientName}</div>
                                                            </td>
                                                            <td className="p-4 text-center">
                                                                <span className={cn(
                                                                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                                                    sale.paid
                                                                        ? "bg-green-50 text-green-600 border border-green-100"
                                                                        : "bg-red-50 text-red-600 border border-red-100"
                                                                )}>
                                                                    {sale.paid ? 'Pagado' : 'Pendiente'}
                                                                </span>
                                                            </td>
                                                            <td className="p-4 font-bold text-primary">
                                                                {formatCurrency(sale.grandTotal)}
                                                            </td>
                                                            <td className="p-4 text-right">
                                                                <div className="flex justify-end gap-2">
                                                                    <button onClick={() => handlePrint(sale, 'invoice')} title="Imprimir" className="btn-icon">
                                                                        <Printer className="w-4 h-4" />
                                                                    </button>
                                                                    <button onClick={() => handlePrint(sale, 'label')} title="Etiqueta" className="btn-icon">
                                                                        <Tag className="w-4 h-4" />
                                                                    </button>
                                                                    <button onClick={() => handleTogglePayment(sale)} title="Cambiar Estado" className="btn-icon disabled:opacity-50 disabled:cursor-not-allowed" disabled={user?.role === 'Visita'}>
                                                                        <RefreshCcw className="w-4 h-4" />
                                                                    </button>
                                                                    <button onClick={() => handleOpenModal(sale)} title="Editar" className="btn-icon disabled:opacity-50 disabled:cursor-not-allowed" disabled={!canEditOrDelete}>
                                                                        <Edit2 className="w-4 h-4" />
                                                                    </button>
                                                                    <button onClick={() => handleDeleteSale(sale.id)} title="Borrar" className="btn-icon text-danger border-danger/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent" disabled={!canEditOrDelete}>
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
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
                        {sortedMonths.map(monthKey => {
                            const isCurrent = monthKey === currentMonthKey;
                            const isExpanded = expandedMonths[monthKey] ?? isCurrent;
                            const monthSales = groupedSalesByMonth[monthKey];
                            const capitalizedMonth = monthKey.charAt(0).toUpperCase() + monthKey.slice(1);

                            return (
                                <div key={monthKey} className="space-y-4">
                                    <button
                                        onClick={() => toggleMonth(monthKey)}
                                        className="w-full flex items-center gap-3 px-2 group transition-all cursor-pointer hover:opacity-85"
                                    >
                                        <div className="h-px flex-1 bg-[#e8eeee]"></div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-muted uppercase tracking-widest">{capitalizedMonth}</span>
                                            <ChevronDown className={cn(
                                                "w-3 h-3 transition-transform duration-300 text-primary",
                                                isExpanded ? "rotate-180" : "rotate-0"
                                            )} />
                                        </div>
                                        <div className="h-px flex-1 bg-[#e8eeee]"></div>
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
                                                            <div className="text-xs text-muted mt-1">
                                                                {formatDate(sale.date)}
                                                            </div>
                                                        </div>
                                                        <span className={cn(
                                                            "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                                            sale.paid
                                                                ? "bg-green-50 text-green-600 border border-green-100"
                                                                : "bg-red-50 text-red-600 border border-red-100"
                                                        )}>
                                                            {sale.paid ? 'Pagado' : 'Pendiente'}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center justify-between p-4 bg-sidebar/50 rounded-2xl">
                                                        <div className="text-sm font-medium text-muted">Total Venta</div>
                                                        <div className="text-xl font-black text-primary">
                                                            {formatCurrency(sale.grandTotal)}
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap gap-2">
                                                        <button onClick={() => handleTogglePayment(sale)} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white border border-[#e8eeee] rounded-xl text-sm font-bold shadow-sm active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed" disabled={user?.role === 'Visita'}>
                                                            <RefreshCcw className="w-4 h-4" />
                                                            Estado
                                                        </button>
                                                        <div className="flex gap-2 w-full">
                                                            <button onClick={() => handlePrint(sale, 'invoice')} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white border border-[#e8eeee] rounded-xl text-sm font-bold shadow-sm active:scale-95 transition-all">
                                                                    <Printer className="w-4 h-4" />
                                                                    Factura
                                                            </button>
                                                            <button onClick={() => handlePrint(sale, 'label')} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white border border-[#e8eeee] rounded-xl text-sm font-bold shadow-sm active:scale-95 transition-all">
                                                                <Tag className="w-4 h-4" />
                                                                Etiqueta
                                                            </button>
                                                        </div>
                                                            <div className="flex gap-2 w-full">
                                                                <button onClick={() => handleOpenModal(sale)} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white border border-[#e8eeee] rounded-xl text-sm font-bold shadow-sm active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed" disabled={!canEditOrDelete}>
                                                                    <Edit2 className="w-4 h-4" />
                                                                    Editar
                                                                </button>
                                                                <button onClick={() => handleDeleteSale(sale.id)} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-danger rounded-xl text-sm font-bold shadow-sm active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-50" disabled={!canEditOrDelete}>
                                                                    <Trash2 className="w-4 h-4" />
                                                                    Borrar
                                                                </button>
                                                            </div>
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-sm p-8 shadow-2xl animate-in zoom-in-95 duration-300">
                        <h2 className="text-xl font-bold mb-4">Registrar Pago</h2>
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm text-muted">Fecha de Pago</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    value={paymentDate}
                                    onChange={e => setPaymentDate(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-8">
                            <button onClick={() => setIsPaymentModalOpen(false)} className="btn btn-ghost">Cancelar</button>
                            <button onClick={handleConfirmPayment} className="btn btn-primary">Confirmar</button>
                        </div>
                    </div>
                </div>
            )}

            {printData && (
                <PrintView
                    sale={printData.sale}
                    client={clients.find(c => c.id === printData.sale.clientId)!}
                    type={printData.type}
                />
            )}
        </DashboardLayout>
    );
}
