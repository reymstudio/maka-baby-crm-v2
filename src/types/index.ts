export type UserRole = 'Super Admin' | 'Admin' | 'Vendedor' | 'Invitado' | 'Visita';

export interface User {
  id: string;
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt?: string;
}

export interface Client {
  id: string;
  name: string;
  commercialName?: string;
  phone: string;
  email?: string;
  address?: string;
  complemento?: string;
  barrio?: string;
  ciudad?: string;
  departamento?: string;
  nit?: string;
  createdAt: string;
}

export interface SaleItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
}

export interface Sale {
  id: string;
  saleNumber: string;
  clientId: string;
  clientName?: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  grandTotal: number;
  date: string;
  paid: boolean;
  paymentDate?: string | null;
  status: 'Pendiente' | 'Pagado' | 'Cancelado';
  notes?: string;
}
