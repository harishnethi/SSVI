export type TaxMode = 'gst' | 'none';
export type OrderStatus = 'pending' | 'confirmed' | 'dispatched' | 'delivered' | 'cancelled';

export const ORDER_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'dispatched', 'delivered', 'cancelled'];

export const statusTone = {
  pending: 'warning',
  confirmed: 'info',
  dispatched: 'info',
  delivered: 'success',
  cancelled: 'neutral',
} as const;

export interface Settings {
  id: number;
  business_name: string;
  address: string;
  phone: string;
  email: string;
  gstin: string;
  state: string;
  bank_details: string;
  invoice_terms: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  gstin: string;
  state: string;
  notes: string;
  created_at: string;
}

export type Role = 'admin' | 'worker' | 'customer' | 'none';

export interface Profile {
  id: string;
  role: Role;
  full_name: string;
  phone: string;
  customer_id: string | null;
  active: boolean;
  created_at: string;
}

export type AttendanceStatus = 'present' | 'half_day' | 'absent' | 'leave';

export interface Attendance {
  id: string;
  worker_id: string;
  work_date: string;
  status: AttendanceStatus;
  check_in: string | null;
  check_out: string | null;
  note: string;
}

export interface ProductionRun {
  id: string;
  run_date: string;
  paddy_id: string;
  paddy_qty: number;
  product_id: string;
  qty: number;
  note: string;
  created_at: string;
}

/** finished = murmura for sale, raw = paddy and other inputs. */
export type ProductKind = 'finished' | 'raw';

export interface Product {
  id: string;
  kind: ProductKind;
  name: string;
  sku: string;
  hsn: string;
  unit: string;
  price: number;
  gst_rate: number;
  stock: number;
  low_stock: number;
  created_at: string;
}

export interface StockMovement {
  id: string;
  product_id: string;
  qty: number;
  reason: 'purchase' | 'production' | 'sale' | 'adjustment' | 'return' | 'consumed';
  note: string;
  created_at: string;
}

/** A line on an order or invoice while it is being edited. */
export interface LineItem {
  product_id: string | null;
  description: string;
  hsn: string;
  unit: string;
  qty: number;
  rate: number;
  gst_rate: number;
}

export interface Order {
  id: string;
  order_no: string;
  customer_id: string;
  status: OrderStatus;
  order_date: string;
  delivery_date: string | null;
  notes: string;
  total: number;
  invoice_id: string | null;
  placed_by_customer: boolean;
  created_at: string;
  customers?: Pick<Customer, 'name'> | null;
}

export interface OrderItem extends LineItem {
  id: string;
  order_id: string;
}

export interface Invoice {
  id: string;
  invoice_no: string;
  tax_mode: TaxMode;
  inter_state: boolean;
  customer_id: string;
  order_id: string | null;
  invoice_date: string;
  due_date: string | null;
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  round_off: number;
  total: number;
  paid: number;
  notes: string;
  cancelled: boolean;
  created_at: string;
  customers?: Pick<Customer, 'name'> | null;
}

export interface InvoiceItem extends LineItem {
  id: string;
  invoice_id: string;
  amount: number;
  tax: number;
}

export interface Payment {
  id: string;
  invoice_id: string;
  amount: number;
  paid_on: string;
  method: string;
  note: string;
}
