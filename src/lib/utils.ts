import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
    }).format(amount).replace(/\s/g, '');
}

/**
 * Función interna centralizada para parsear cualquier formato de fecha proveniente de Firestore
 * Soporta: string ISO, Timestamp de Firebase, objeto {seconds, nanoseconds}, y Date nativo.
 */
function parseDateValue(dateString: any): Date | null {
    if (!dateString) return null;

    let date: Date;

    if (dateString instanceof Date) {
        return dateString;
    }

    if (typeof dateString === 'string') {
        date = new Date(dateString);
    } else if (typeof dateString === 'object' && dateString !== null) {
        // Caso: Firebase Timestamp ({ toDate: () => ... })
        if ('toDate' in dateString && typeof dateString.toDate === 'function') {
            date = dateString.toDate();
        }
        // Caso: Objeto crudo de Firestore { seconds: number, nanoseconds: number }
        else if ('seconds' in dateString) {
            date = new Date((dateString as any).seconds * 1000);
        }
        else {
            // Fallback para otros objetos
            date = new Date(dateString as any);
        }
    } else {
        date = new Date(dateString);
    }

    // Validación final
    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return date;
}

export function formatDate(dateString: any): string {
    const date = parseDateValue(dateString);
    if (!date) return '';

    return new Intl.DateTimeFormat('es-CO', {
        dateStyle: 'medium',
    }).format(date);
}

export function formatDateSimple(dateString: any): string {
    const date = parseDateValue(dateString);
    if (!date) return '';

    // Nota: Se mantiene getUTC para respetar tu lógica original, 
    // aunque usualmente se prefiere getDate() local para evitar desfases de zona horaria visual.
    return `${date.getUTCDate()}/${date.getUTCMonth() + 1}/${date.getUTCFullYear()}`;
}

export function parseDate(value: string): Date {
    return new Date(value);
}

export function parsePaymentDate(value: string | null | undefined): Date {
    if (!value) return new Date();
    return new Date(`${value}T00:00:00`);
}

export function isValidDate(date: Date): boolean {
    return !Number.isNaN(date.getTime());
}

export function groupSalesByMonth<T extends { date: string }>(sales: T[]): Record<string, T[]> {
    return sales.reduce((acc, sale) => {
        const date = new Date(sale.date);
        // Aseguramos que la fecha sea válida antes de agrupar
        if (isNaN(date.getTime())) return acc;

        const monthKey = date.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
        if (!acc[monthKey]) acc[monthKey] = [];
        acc[monthKey].push(sale);
        return acc;
    }, {} as Record<string, T[]>);
}

export function sortMonthsChronologically(months: string[], getFirstSaleDate: (month: string) => Date): string[] {
    return [...months].sort((a, b) => getFirstSaleDate(b).getTime() - getFirstSaleDate(a).getTime());
}