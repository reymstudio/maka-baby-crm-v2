/**
 * Configuración de la aplicación
 */

export const APP_CONFIG = {
  name: 'MÄKA Baby CRM',
  version: '1.0.0',
  defaultRole: 'Vendedor' as const,
};

export const USER_ROLES = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  VENDEDOR: 'Vendedor',
  INVITADO: 'Invitado',
} as const;

export const SALE_STATUS = {
  PENDIENTE: 'Pendiente',
  PAGADO: 'Pagado',
  CANCELADO: 'Cancelado',
} as const;
