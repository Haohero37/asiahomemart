// ============================================
// ASIA HOME MART — Data Service (Supabase)
// ============================================

import { supabase, isSupabaseConfigured } from './lib/supabase';
import type { Product, Customer, Invoice, InvoiceItem, Stats } from './types';
import { getTodayString } from './utils';

// ─── Mock data for offline/demo mode ──────────────────────────────────────────
let mockProducts: Product[] = [
  { id: '1', name: 'Nước mắm Phú Quốc 500ml', price: 6500, unit: 'chai', created_at: new Date().toISOString() },
  { id: '2', name: 'Gạo ST25 5kg', price: 25000, unit: 'túi', created_at: new Date().toISOString() },
  { id: '3', name: 'Dầu ăn Neptune 1L', price: 4500, unit: 'chai', created_at: new Date().toISOString() },
  { id: '4', name: 'Bột ngọt Ajinomoto 400g', price: 3200, unit: 'gói', created_at: new Date().toISOString() },
  { id: '5', name: 'Sữa đặc Ông Thọ 380g', price: 2100, unit: 'hộp', created_at: new Date().toISOString() },
  { id: '6', name: 'Mì gói Hảo Hảo (thùng 30 gói)', price: 18000, unit: 'thùng', created_at: new Date().toISOString() },
  { id: '7', name: 'Đường cát trắng 1kg', price: 2500, unit: 'kg', created_at: new Date().toISOString() },
  { id: '8', name: 'Muối biển tinh 500g', price: 1200, unit: 'gói', created_at: new Date().toISOString() },
];

let mockCustomers: Customer[] = [
  { id: '1', name: 'Nguyễn Văn An', phone: '0901234567', address: '123 Lê Lợi, Q1, TP.HCM', created_at: new Date().toISOString() },
  { id: '2', name: 'Trần Thị Bích', phone: '0912345678', address: '456 Nguyễn Huệ, Q1, TP.HCM', created_at: new Date().toISOString() },
  { id: '3', name: 'Lê Văn Cường', phone: '0923456789', address: '789 Hai Bà Trưng, Q3, TP.HCM', created_at: new Date().toISOString() },
];

let mockInvoices: Invoice[] = [
  {
    id: '1',
    invoice_number: 'HD-20260409-0001',
    customer_id: '1',
    customer: mockCustomers[0],
    total_amount: 41700,
    shipping_fee: 0,
    note: '',
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    invoice_items: [
      { product_name: 'Nước mắm Phú Quốc 500ml', product_unit: 'chai', product_price: 6500, quantity: 2, subtotal: 13000 },
      { product_name: 'Gạo ST25 5kg', product_unit: 'túi', product_price: 25000, quantity: 1, subtotal: 25000 },
      { product_name: 'Đường cát trắng 1kg', product_unit: 'kg', product_price: 2500, quantity: 1, subtotal: 2500 },
      { product_name: 'Muối biển tinh 500g', product_unit: 'gói', product_price: 1200, quantity: 1, subtotal: 1200 },
    ],
  },
  {
    id: '2',
    invoice_number: 'HD-20260409-0002',
    customer_id: '2',
    customer: mockCustomers[1],
    total_amount: 34700,
    shipping_fee: 0,
    note: 'Giao hàng chiều',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    invoice_items: [
      { product_name: 'Dầu ăn Neptune 1L', product_unit: 'chai', product_price: 4500, quantity: 3, subtotal: 13500 },
      { product_name: 'Mì gói Hảo Hảo (thùng 30 gói)', product_unit: 'thùng', product_price: 18000, quantity: 1, subtotal: 18000 },
      { product_name: 'Bột ngọt Ajinomoto 400g', product_unit: 'gói', product_price: 3200, quantity: 1, subtotal: 3200 },
    ],
  },
  {
    id: '3',
    invoice_number: 'HD-20260408-0001',
    customer_id: null,
    customer: null,
    total_amount: 27400,
    shipping_fee: 0,
    note: '',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    invoice_items: [
      { product_name: 'Gạo ST25 5kg', product_unit: 'túi', product_price: 25000, quantity: 1, subtotal: 25000 },
      { product_name: 'Muối biển tinh 500g', product_unit: 'gói', product_price: 1200, quantity: 2, subtotal: 2400 },
    ],
  },
];

// ─── Helper ───────────────────────────────────────────────────────────────────
function generateMockId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// ─── Products ─────────────────────────────────────────────────────────────────
export async function fetchProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured || !supabase) {
    return [...mockProducts].sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  }
  const { data, error } = await supabase.from('products').select('*').order('name');
  if (error) throw error;
  return data as Product[];
}

export async function createProduct(product: Omit<Product, 'id' | 'created_at'>): Promise<Product> {
  if (!isSupabaseConfigured || !supabase) {
    const newProduct: Product = { ...product, id: generateMockId(), created_at: new Date().toISOString() };
    mockProducts.push(newProduct);
    return newProduct;
  }
  const { data, error } = await supabase.from('products').insert(product).select().single();
  if (error) throw error;
  return data as Product;
}

export async function updateProduct(id: string, product: Partial<Omit<Product, 'id' | 'created_at'>>): Promise<Product> {
  if (!isSupabaseConfigured || !supabase) {
    const idx = mockProducts.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Product not found');
    mockProducts[idx] = { ...mockProducts[idx], ...product };
    return mockProducts[idx];
  }
  const { data, error } = await supabase.from('products').update(product).eq('id', id).select().single();
  if (error) throw error;
  return data as Product;
}

export async function deleteProduct(id: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    mockProducts = mockProducts.filter(p => p.id !== id);
    return;
  }
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}

// ─── Customers ────────────────────────────────────────────────────────────────
export async function fetchCustomers(): Promise<Customer[]> {
  if (!isSupabaseConfigured || !supabase) {
    return [...mockCustomers].sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  }
  const { data, error } = await supabase.from('customers').select('*').order('name');
  if (error) throw error;
  return data as Customer[];
}

export async function createCustomer(customer: Omit<Customer, 'id' | 'created_at'>): Promise<Customer> {
  if (!isSupabaseConfigured || !supabase) {
    const newCustomer: Customer = { ...customer, id: generateMockId(), created_at: new Date().toISOString() };
    mockCustomers.push(newCustomer);
    return newCustomer;
  }
  const { data, error } = await supabase.from('customers').insert(customer).select().single();
  if (error) throw error;
  return data as Customer;
}

export async function updateCustomer(id: string, customer: Partial<Omit<Customer, 'id' | 'created_at'>>): Promise<Customer> {
  if (!isSupabaseConfigured || !supabase) {
    const idx = mockCustomers.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Customer not found');
    mockCustomers[idx] = { ...mockCustomers[idx], ...customer };
    return mockCustomers[idx];
  }
  const { data, error } = await supabase.from('customers').update(customer).eq('id', id).select().single();
  if (error) throw error;
  return data as Customer;
}

export async function deleteCustomer(id: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    mockCustomers = mockCustomers.filter(c => c.id !== id);
    return;
  }
  const { error } = await supabase.from('customers').delete().eq('id', id);
  if (error) throw error;
}

// ─── Invoices ─────────────────────────────────────────────────────────────────
export async function fetchInvoices(limit = 50): Promise<Invoice[]> {
  if (!isSupabaseConfigured || !supabase) {
    return [...mockInvoices]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  }
  const { data, error } = await supabase
    .from('invoices')
    .select('*, customer:customers(*), invoice_items(*)')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data as Invoice[];
}

export async function fetchInvoiceById(id: string): Promise<Invoice | null> {
  if (!isSupabaseConfigured || !supabase) {
    return mockInvoices.find(i => i.id === id) || null;
  }
  const { data, error } = await supabase
    .from('invoices')
    .select('*, customer:customers(*), invoice_items(*)')
    .eq('id', id)
    .single();
  if (error) return null;
  return data as Invoice;
}

export async function createInvoice(
  invoice: { customer_id?: string | null; note?: string; shipping_fee: number },
  items: InvoiceItem[]
): Promise<Invoice> {
  const total_amount = items.reduce((sum, item) => sum + item.subtotal, 0);
  
  // Format invoice number: HD20260413-01
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `HD${dateStr}-`;
  
  let nextSequence = 1;

  if (!isSupabaseConfigured || !supabase) {
    const todayInvoices = mockInvoices.filter(i => i.invoice_number?.startsWith(prefix));
    nextSequence = todayInvoices.length + 1;
  } else {
    // Real Supabase: get the highest sequence for today
    const { data, error } = await supabase
      .from('invoices')
      .select('invoice_number')
      .like('invoice_number', `${prefix}%`)
      .order('invoice_number', { ascending: false })
      .limit(1);
    
    if (!error && data && data.length > 0) {
      const lastInvoiceNumber = data[0].invoice_number;
      const lastSequence = parseInt(lastInvoiceNumber.slice(prefix.length), 10);
      if (!isNaN(lastSequence)) {
        nextSequence = lastSequence + 1;
      }
    }
  }

  const invoice_number = `${prefix}${nextSequence.toString().padStart(2, '0')}`;

  if (!isSupabaseConfigured || !supabase) {
    const customer = invoice.customer_id
      ? mockCustomers.find(c => c.id === invoice.customer_id) || null
      : null;
    const newInvoice: Invoice = {
      id: generateMockId(),
      invoice_number,
      customer_id: invoice.customer_id || null,
      customer,
      total_amount,
      shipping_fee: invoice.shipping_fee,
      note: invoice.note || '',
      created_at: new Date().toISOString(),
      invoice_items: items,
    };
    mockInvoices.unshift(newInvoice);
    return newInvoice;
  }

  // Real Supabase
  const { data: inv, error: invError } = await supabase
    .from('invoices')
    .insert({ ...invoice, invoice_number, total_amount, shipping_fee: invoice.shipping_fee })
    .select()
    .single();
  if (invError) throw invError;

  const itemsToInsert = items.map(item => ({
    invoice_id: inv.id,
    product_id: item.product_id || null,
    product_name: item.product_name,
    product_unit: item.product_unit,
    product_price: item.product_price,
    quantity: item.quantity,
    subtotal: item.subtotal,
  }));

  const { error: itemsError } = await supabase.from('invoice_items').insert(itemsToInsert);
  if (itemsError) throw itemsError;

  return fetchInvoiceById(inv.id) as Promise<Invoice>;
}

export async function deleteInvoice(id: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    mockInvoices = mockInvoices.filter(i => i.id !== id);
    return;
  }
  const { error } = await supabase.from('invoices').delete().eq('id', id);
  if (error) throw error;
}

// ─── Statistics ───────────────────────────────────────────────────────────────
export async function fetchStats(): Promise<Stats> {
  const today = getTodayString();

  if (!isSupabaseConfigured || !supabase) {
    const todayInvoices = mockInvoices.filter(i => i.created_at.startsWith(today));
    return {
      totalInvoices: mockInvoices.length,
      totalRevenue: mockInvoices.reduce((s, i) => s + i.total_amount, 0),
      totalProducts: mockProducts.length,
      totalCustomers: mockCustomers.length,
      revenueToday: todayInvoices.reduce((s, i) => s + i.total_amount, 0),
      invoicesToday: todayInvoices.length,
    };
  }

  const [invResult, prodResult, custResult] = await Promise.all([
    supabase.from('invoices').select('total_amount, created_at'),
    supabase.from('products').select('id', { count: 'exact', head: true }),
    supabase.from('customers').select('id', { count: 'exact', head: true }),
  ]);

  const invoices = (invResult.data || []) as { total_amount: number; created_at: string }[];
  const todayInvoices = invoices.filter((i: { total_amount: number; created_at: string }) => i.created_at.startsWith(today));

  return {
    totalInvoices: invoices.length,
    totalRevenue: invoices.reduce((s, i) => s + i.total_amount, 0),
    totalProducts: prodResult.count || 0,
    totalCustomers: custResult.count || 0,
    revenueToday: todayInvoices.reduce((s, i) => s + i.total_amount, 0),
    invoicesToday: todayInvoices.length,
  };
}

export async function fetchRevenueByDay(days = 7): Promise<{ date: string; revenue: number; count: number }[]> {
  const result: { date: string; revenue: number; count: number }[] = [];
  const now = new Date();

  if (!isSupabaseConfigured || !supabase) {
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayInvoices = mockInvoices.filter(inv => inv.created_at.startsWith(dateStr));
      result.push({
        date: dateStr,
        revenue: dayInvoices.reduce((s, i) => s + i.total_amount, 0),
        count: dayInvoices.length,
      });
    }
    return result;
  }

  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - (days - 1));
  startDate.setHours(0, 0, 0, 0);

  const { data } = await supabase
    .from('invoices')
    .select('total_amount, created_at')
    .gte('created_at', startDate.toISOString());

  const map = new Map<string, { revenue: number; count: number }>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    map.set(dateStr, { revenue: 0, count: 0 });
  }

  (data || []).forEach((inv: { total_amount: number; created_at: string }) => {
    const dateStr = inv.created_at.slice(0, 10);
    if (map.has(dateStr)) {
      const entry = map.get(dateStr)!;
      entry.revenue += inv.total_amount;
      entry.count += 1;
    }
  });

  map.forEach((val, date) => result.push({ date, ...val }));
  return result;
}
