import type { Role } from './types';

/** Customers see orders and bills inside their store pages; staff use the shared detail screens. */
export const orderHref = (role: Role | null, id: string) => (role === 'customer' ? `/account/orders/${id}` : `/order/${id}`);
export const billHref = (role: Role | null, id: string) => (role === 'customer' ? `/account/bills/${id}` : `/invoice/${id}`);
