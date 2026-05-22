/**
 * Utilidades para manejo de fechas consistentes con Firestore
 */

/**
 * Convierte un timestamp de Firestore o string ISO a Date object válido.
 * Maneja null, undefined y formatos inválidos gracefully.
 */
export const parseFirestoreDate = (dateData: any): Date | null => {
    if (!dateData) return null;

    try {
        // Caso: Timestamp de Firestore ({ seconds, nanoseconds })
        if (typeof dateData === 'object' && 'seconds' in dateData) {
            return new Date(dateData.seconds * 1000);
        }

        // Caso: String ISO o Timestamp milisegundos
        const date = new Date(dateData);

        if (isNaN(date.getTime())) {
            console.warn('Fecha inválida detectada:', dateData);
            return null;
        }

        return date;
    } catch (error) {
        console.error('Error al parsear fecha:', error, dateData);
        return null;
    }
};

/**
 * Valida si una fecha es real y no es 'Invalid Date'
 */
export const isValidDate = (date: any): boolean => {
    const parsed = parseFirestoreDate(date);
    return parsed !== null && !isNaN(parsed.getTime());
};