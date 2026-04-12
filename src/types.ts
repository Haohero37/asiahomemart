// ============================================
// ASIA HOME MART — Type Definitions
// ============================================

export interface Product {
  id: string;
  name: string;
  price: number;
  unit: string;
  created_at?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  created_at?: string;
}

export interface InvoiceItem {
  id?: string;
  invoice_id?: string;
  product_id?: string | null;
  product_name: string;
  product_unit: string;
  product_price: number;
  quantity: number;
  subtotal: number;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  customer_id?: string | null;
  customer?: Customer | null;
  total_amount: number;
  shipping_fee: number;
  note?: string;
  created_at: string;
  invoice_items?: InvoiceItem[];
}

export type Tab = 'dashboard' | 'invoice-new' | 'invoices' | 'products' | 'customers' | 'settings';

export interface Stats {
  totalInvoices: number;
  totalRevenue: number;
  totalProducts: number;
  totalCustomers: number;
  revenueToday: number;
  invoicesToday: number;
}

export interface RevenueByDay {
  date: string;
  revenue: number;
  count: number;
}
