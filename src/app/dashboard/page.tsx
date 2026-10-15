"use client";

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useStore } from '@/hooks/useStore';
import { formatCurrency, cn } from '@/lib/utils';
import {
    ChevronRight,
    ShoppingBag,
    UserPlus,
    ClipboardList,
    Banknote,
    Calendar,
    Package
} from 'lucide-react';

type IncomeTrend = { value: number; isPositive: boolean } | null;

type StatCard = {
    label: string;
    value: string;
    desc: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    trend?: IncomeTrend;
    onClick?: () => void;
};

type ActivityItem = {
    id: string;
    type: 'sale' | 'payment' | 'client';
    title: string;
    desc: string;
    date: Date | null;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    amount?: string;
};

const MONTH_NAMES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

const parseDate = (value: string) => new Date(value);
const parsePaymentDate = (value: string | null | undefined) => {
    if (!value) return new Date();
    return new Date(`${value}T00:00:00`);
};
const isValidDate = (date: Date) => !Number.isNaN(date.getTime());

const parseClientCreatedAt = (value: unknown): Date | null => {
    if (!value) return null;
    if (value instanceof Date) return isValidDate(value) ? value : null;
    if (typeof value === 'string' || typeof value === 'number') {
        const parsed = new Date(value);
        return isValidDate(parsed) ? parsed : null;
    }
    if (typeof value === 'object' && value !== null) {
        const maybeTimestamp = value as { toDate?: () => Date };
        if (typeof maybeTimestamp.toDate === 'function') {
            const parsed = maybeTimestamp.toDate();
            return isValidDate(parsed) ? parsed : null;
        }
    }
    return null;
};

export default function DashboardPage() {
    const { sales, clients } = useStore();
    const [showYearlyDetail, setShowYearlyDetail] = useState(false);

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const monthSales = useMemo(() => sales.filter(s => {
        const date = parseDate(s.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }), [sales, currentMonth, currentYear]);

    const paidSalesThisMonth = useMemo(() => sales.filter(s => {
        if (!s.paid || !s.paymentDate) return false;
        const paymentDate = parsePaymentDate(s.paymentDate);
        return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
    }), [sales, currentMonth, currentYear]);

    const paidSalesThisYear = useMemo(() => sales.filter(s => {
        if (!s.paid || !s.paymentDate) return false;
        return parsePaymentDate(s.paymentDate).getFullYear() === currentYear;
    }), [sales, currentYear]);

    const paidSalesPrevMonth = useMemo(() => sales.filter(s => {
        if (!s.paid || !s.paymentDate) return false;
        const paymentDate = parsePaymentDate(s.paymentDate);
        return paymentDate.getMonth() === prevMonth && paymentDate.getFullYear() === prevYear;
    }), [sales, prevMonth, prevYear]);

    const monthTotal = useMemo(() => paidSalesThisMonth.reduce((sum, s) => sum + (Number(s.grandTotal) || 0), 0), [paidSalesThisMonth]);
    const prevMonthTotal = useMemo(() => paidSalesPrevMonth.reduce((sum, s) => sum + (Number(s.grandTotal) || 0), 0), [paidSalesPrevMonth]);
    const pendingTotal = useMemo(() => monthSales.filter(s => !s.paid).reduce((sum, s) => sum + (Number(s.grandTotal) || 0), 0), [monthSales]);
    const yearTotal = useMemo(() => paidSalesThisYear.reduce((sum, s) => sum + (Number(s.grandTotal) || 0), 0), [paidSalesThisYear]);

    const incomeTrend: IncomeTrend = useMemo(() => {
        if (prevMonthTotal > 0) {
            const diff = monthTotal - prevMonthTotal;
            return {
                value: Math.abs(Math.round((diff / prevMonthTotal) * 100)),
                isPositive: diff >= 0
            };
        }
        if (monthTotal > 0) {
            return { value: 100, isPositive: true };
        }
        return null;
    }, [monthTotal, prevMonthTotal]);

    const stats: StatCard[] = [
        {
            label: 'VENTAS DEL MES',
            value: monthSales.length.toString(),
            desc: 'Cantidad total',
            icon: ShoppingBag,
            color: 'bg-[#e4eadf] text-[#31332E]'
        },
        {
            label: 'POR COBRAR',
            value: formatCurrency(pendingTotal),
            desc: 'Pendiente mes',
            icon: ClipboardList,
            color: 'bg-[#f8e1e1] text-[#8B4E47]'
        },
        {
            label: 'INGRESOS DEL MES',
            value: formatCurrency(monthTotal),
            desc: 'Cobrado mes',
            icon: Banknote,
            color: 'bg-[#fdf4eb] text-[#8B4E47]',
            trend: incomeTrend
        },
        {
            label: 'TOTAL AÑO',
            value: formatCurrency(yearTotal),
            desc: `Periodo ${currentYear}`,
            icon: Calendar,
            color: 'bg-[#e4eadf] text-[#31332E]',
            onClick: () => setShowYearlyDetail(true)
        },
    ];

    const recentActivity: ActivityItem[] = useMemo(() => {
        const allActivities: ActivityItem[] = [
        ...sales.map(s => {
            const dateObj = parseDate(s.date);
            const client = clients.find(c => c.id === s.clientId);
            const displayName = client?.commercialName || client?.name || s.clientName || 'Cliente';
            return {
                id: s.id + '-sale',
                type: 'sale' as const,
                title: `Venta registrada: ${s.saleNumber}`.trim(),
                desc: `Cliente: ${displayName} • ${formatDate(dateObj)}`,
                amount: formatCurrency(s.grandTotal),
                date: dateObj,
                icon: Package,
                color: 'bg-[#f0e8e4] text-[#8B4E47]'
            };
        }),
        ...sales.filter(s => s.paid && s.paymentDate).map(s => {
            const dateObj = parsePaymentDate(s.paymentDate!);
            const client = clients.find(c => c.id === s.clientId);
            const displayName = client?.commercialName || client?.name || s.clientName || 'Cliente';
            return {
                id: s.id + '-payment',
                type: 'payment' as const,
                title: `Pago recibido: ${s.saleNumber}`.trim(),
                desc: `Cliente: ${displayName} • ${formatDate(dateObj)}`,
                amount: formatCurrency(s.grandTotal),
                date: dateObj,
                icon: Banknote,
                color: 'bg-[#fdf4eb] text-[#8B4E47]'
            };
        }),
        ...clients.map((c) => {
            const dateObj = parseClientCreatedAt(c.createdAt);
            const displayName = c.commercialName || c.name;
            return {
                id: c.id,
                type: 'client' as const,
                title: `Nuevo Cliente Registrado`,
                desc: `${displayName} • ${dateObj ? formatDate(dateObj) : 'Fecha no disponible'}`,
                date: dateObj,
                icon: UserPlus,
                color: 'bg-[#e4eadf] text-[#31332E]'
            };
        })
    ].sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0));

        return allActivities.slice(0, 5);
    }, [sales, clients]);

    const monthlySummary = useMemo(() => Array.from({ length: 12 }, (_, i) => {
        const paidThisMonth = sales.filter(s => {
            if (!s.paid || !s.paymentDate) return false;
            const pDate = parsePaymentDate(s.paymentDate);
            return pDate.getMonth() === i && pDate.getFullYear() === currentYear;
        });
        const total = paidThisMonth.reduce((sum, s) => sum + (Number(s.grandTotal) || 0), 0);
        return { month: MONTH_NAMES[i], total, count: paidThisMonth.length };
    }), [sales, currentYear]);

    return (
        <DashboardLayout>
            <div className="space-y-8 animate-in fade-in duration-700">
                <header>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted mt-1">Resumen general de su negocio hoy.</p>
                </header>

                {/* Banner Principal */}
                <div className="relative overflow-hidden rounded-2xl lg:rounded-3xl bg-gradient-to-br from-[#e4eadf] to-[#d2dbce] p-6 lg:p-7 xl:p-10 flex flex-col md:flex-row items-center gap-6 lg:gap-8 justify-between shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="flex-1 max-w-2xl z-10 relative">
                        <h2 className="text-2xl lg:text-3xl xl:text-4xl font-bold font-serif text-[#3a3f3b] mb-2 lg:mb-3 leading-tight">
                            ¡Bienvenido a MÄKA Baby CRM!
                        </h2>
                        <p className="text-[#646a67] text-sm lg:text-base leading-relaxed mb-4 lg:mb-6 max-w-xl font-medium">
                            MÄKA Baby ha sido creado pensando en tu bienestar y en el de tu negocio. Aquí podrás encontrar las herramientas necesarias para gestionar tus productos y conectar con tus clientes de una manera más ágil.
                        </p>
                    </div>
                    
                    <div className="relative w-36 h-36 lg:w-44 lg:h-44 xl:w-56 xl:h-56 shrink-0 z-10 hidden md:block">
                        <div className="absolute inset-0 bg-white rounded-2xl lg:rounded-3xl shadow-xl rotate-3 hover:rotate-6 transition-transform duration-500 p-3 lg:p-4">
                            <Image src="/logo.png" alt="MÄKA Baby Wreath" className="w-full h-full object-contain -rotate-3 hover:-rotate-6 transition-transform duration-500 drop-shadow-sm" width={224} height={224} />
                        </div>
                    </div>
                    
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 -mr-24 -mt-24 w-80 h-80 rounded-full bg-white/20 blur-3xl pointer-events-none"></div>
                    <div className="absolute bottom-0 left-20 -mb-24 w-64 h-64 rounded-full bg-white/20 blur-3xl pointer-events-none"></div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5 xl:gap-6">
                    {stats.map((stat) => {
                        const Icon = stat.icon;
                        return (
                            <div
                                key={stat.label}
                                onClick={stat.onClick}
                                className={cn(
                                    "bg-white border border-[#e8eeee] rounded-2xl lg:rounded-[28px] p-5 lg:p-6 xl:p-7 flex flex-col justify-between transition-all duration-300 hover:translate-x-1 hover:border-primary shadow-sm min-w-0",
                                    stat.onClick && "cursor-pointer active:scale-95"
                                )}
                            >
                                <div className="flex items-center justify-between gap-3 mb-6 lg:mb-7">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={cn("p-2.5 lg:p-3 rounded-2xl shrink-0", stat.color)}>
                                            <Icon className="w-5 h-5 lg:w-6 lg:h-6" />
                                        </div>
                                        <span className="text-[10px] sm:text-[11px] font-bold text-[#8c938f] uppercase tracking-wider leading-tight truncate">{stat.label}</span>
                                    </div>
                                    {stat.onClick && (
                                        <ChevronRight className="w-5 h-5 text-[#8c938f] shrink-0" />
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-baseline justify-between gap-2 min-w-0">
                                        <h3 className="text-2xl sm:text-3xl lg:text-2xl xl:text-3xl 2xl:text-4xl font-serif font-medium text-main truncate tracking-tight" title={stat.value}>{stat.value}</h3>
                                        {stat.trend && (
                                            <span className={cn(
                                                "text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0",
                                                stat.trend.isPositive ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                                            )}>
                                                {stat.trend.isPositive ? '+' : '-'}{stat.trend.value}%
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-[#8c938f] mt-2 lg:mt-3 truncate">{stat.desc}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-6 xl:gap-8 mt-2 lg:mt-4">
                    {/* Actividad Reciente */}
                    <div className="animate-in slide-in-from-bottom-4 duration-700 delay-100">
                        <div className="flex items-center justify-between mb-4 lg:mb-6 px-1 lg:px-2">
                            <h2 className="text-xl lg:text-[22px] font-serif text-main">Actividad Reciente</h2>
                            <button className="text-[13px] font-bold text-terracota hover:opacity-80 transition-opacity">Ver todo</button>
                        </div>
                        <div className="space-y-3 lg:space-y-4">
                            {recentActivity.map((activity) => {
                                const Icon = activity.icon;
                                return (
                                    <div key={activity.id} className="flex items-center gap-3.5 lg:gap-4 p-4 lg:p-4.5 bg-white border border-[#e8eeee] rounded-2xl lg:rounded-[24px] shadow-sm">
                                        <div className={cn("p-2.5 lg:p-3 rounded-2xl shrink-0", activity.color)}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-main truncate leading-tight">{activity.title}</p>
                                            <p className="text-xs text-[#8c938f] truncate mt-1">{activity.desc}</p>
                                        </div>
                                        {activity.amount && (
                                            <div className="text-sm font-bold text-main whitespace-nowrap pl-2">
                                                {activity.amount}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            {recentActivity.length === 0 && (
                                <div className="text-center text-muted py-8 text-sm bg-white rounded-2xl lg:rounded-[24px] border border-[#e8eeee]">
                                    No hay actividad reciente.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Distribución de Ingresos */}
                    <div className="animate-in slide-in-from-bottom-4 duration-700 delay-200 h-full flex flex-col">
                        <div className="mb-4 lg:mb-6 px-1 lg:px-2">
                            <h2 className="text-xl lg:text-[22px] font-serif text-main">Distribución de Ingresos</h2>
                        </div>
                        <div className="bg-[#f5f6f4] rounded-2xl lg:rounded-[32px] p-6 lg:p-6 xl:p-8 flex-1 flex flex-col justify-between">
                            <div className="space-y-5 lg:space-y-6">
                                {(() => {
                                    const last4MonthsData = [0, 1, 2, 3].map(offset => {
                                        let mIndex = currentMonth - offset;
                                        let yIndex = currentYear;
                                        if (mIndex < 0) {
                                            mIndex += 12;
                                            yIndex -= 1;
                                        }
                                        const paidThisMonth = sales.filter(s => {
                                            if (!s.paid || !s.paymentDate) return false;
                                            const pDate = parsePaymentDate(s.paymentDate);
                                            return pDate.getMonth() === mIndex && pDate.getFullYear() === yIndex;
                                        });
                                        const total = paidThisMonth.reduce((sum, s) => sum + (Number(s.grandTotal) || 0), 0);
                                        return { month: MONTH_NAMES[mIndex], total };
                                    });

                                    const averageIncome = last4MonthsData.reduce((acc, curr) => acc + curr.total, 0) / 4;
                                    const maxBarValue = Math.max(...last4MonthsData.map(d => d.total), averageIncome, 1);

                                    const colors = ['bg-[#8B4E47]', 'bg-[#5c6d63]', 'bg-[#8c786a]', 'bg-[#7a8c82]'];

                                    return (
                                        <>
                                            {last4MonthsData.map((d, i) => {
                                                const width = `${(d.total / maxBarValue) * 100}%`;
                                                return (
                                                    <div key={d.month} className="space-y-2">
                                                        <div className="flex justify-between items-end">
                                                            <span className="text-[10px] font-bold text-muted uppercase tracking-widest">{d.month}</span>
                                                            <span className="text-[14px] lg:text-[15px] font-bold text-main font-serif tracking-tight">{formatCurrency(d.total)}</span>
                                                        </div>
                                                        <div className="h-2.5 lg:h-3 w-full bg-[#E3E3DB] rounded-full overflow-hidden">
                                                            <div className={cn("h-full rounded-full transition-all duration-1000", colors[i])} style={{ width: width === '0%' ? '2%' : width }}></div>
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            <div className="pt-5 border-t border-[#e8eeee] mt-6 space-y-2">
                                                <div className="flex justify-between items-end">
                                                    <span className="text-[10px] font-bold text-muted uppercase tracking-widest">PROMEDIO</span>
                                                    <span className="text-[14px] lg:text-[15px] font-bold text-muted font-serif tracking-tight">{formatCurrency(averageIncome)}</span>
                                                </div>
                                                <div className="h-2.5 lg:h-3 w-full bg-[#E3E3DB] rounded-full overflow-hidden">
                                                    <div className="h-full bg-[#a3afa8] rounded-full transition-all duration-1000" style={{ width: `${(averageIncome / maxBarValue) * 100}%` }}></div>
                                                </div>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                            
                            <div className="mt-6 pt-3">
                                <p className="text-[11px] text-[#8c938f] leading-relaxed">
                                    {incomeTrend
                                        ? `Tendencia de ingresos mensual. El mes actual muestra un ${incomeTrend.isPositive ? 'crecimiento' : 'decrecimiento'} del ${incomeTrend.value}% respecto al mes anterior.`
                                        : 'Tendencia de ingresos mensual. Aun no hay datos suficientes para comparar con el mes anterior.'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* Yearly Detail Modal */}
            {showYearlyDetail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={() => setShowYearlyDetail(false)}>
                    <div className="bg-white rounded-2xl lg:rounded-[28px] w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-300 max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        
                        {/* Header */}
                        <div className="flex justify-between items-start px-6 sm:px-8 pt-6 pb-3 shrink-0">
                            <div>
                                <h2 className="text-2xl lg:text-[28px] font-serif text-main leading-tight">Resumen Anual {currentYear}</h2>
                                <div className="h-[3px] w-12 bg-terracota rounded-full mt-2"></div>
                            </div>
                            <button
                                onClick={() => setShowYearlyDetail(false)}
                                className="w-8 h-8 flex items-center justify-center text-[#8c938f] hover:text-main transition-colors text-xl font-light"
                            >
                                ×
                            </button>
                        </div>

                        {/* Table */}
                        <div className="px-6 sm:px-8 pb-2 flex-1 overflow-y-auto max-h-[48vh]">
                            {/* Header row */}
                            <div className="grid grid-cols-3 px-3 py-2 mb-1">
                                <span className="text-[10px] font-bold text-[#8c938f] uppercase tracking-widest">Mes</span>
                                <span className="text-[10px] font-bold text-[#8c938f] uppercase tracking-widest text-center">Cant.</span>
                                <span className="text-[10px] font-bold text-[#8c938f] uppercase tracking-widest text-right">Total</span>
                            </div>

                            {/* Rows */}
                            <div className="space-y-1">
                                {monthlySummary.map((m) => {
                                    const hasActivity = m.count > 0;
                                    return (
                                        <div key={m.month} className="grid grid-cols-3 items-center px-3 py-3 rounded-xl hover:bg-[#f8f6f3] transition-colors">
                                            <div className="flex items-center gap-2.5">
                                                {hasActivity
                                                    ? <span className="w-2 h-2 rounded-full bg-terracota shrink-0"></span>
                                                    : <span className="w-2 h-2 shrink-0"></span>
                                                }
                                                <span className={cn("text-sm", hasActivity ? "text-main font-medium" : "text-[#8c938f]")}>{m.month}</span>
                                            </div>
                                            <span className={cn("text-sm font-serif text-center", hasActivity ? "text-terracota font-bold" : "text-[#8c938f]")}>{m.count}</span>
                                            <span className={cn("text-sm font-serif text-right", hasActivity ? "text-terracota font-bold" : "text-[#8c938f]")}>{formatCurrency(m.total)}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end items-center px-6 sm:px-8 py-4 mt-2 border-t border-[#f0eeeb] shrink-0">
                            <button
                                onClick={() => setShowYearlyDetail(false)}
                                className="bg-terracota text-white font-bold px-7 py-2.5 rounded-full hover:opacity-90 transition-all hover:-translate-y-0.5 active:scale-95 shadow-sm text-sm"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
