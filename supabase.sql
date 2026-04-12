-- =============================================
-- ASIA HOME MART — Supabase Schema
-- Chạy toàn bộ script này trong SQL Editor của Supabase
-- =============================================

-- Extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- BẢNG SẢN PHẨM
-- =============================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  price NUMERIC(15, 0) NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'cái',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);

-- =============================================
-- BẢNG KHÁCH HÀNG
-- =============================================
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- =============================================
-- BẢNG HÓA ĐƠN
-- =============================================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  total_amount NUMERIC(15, 0) NOT NULL DEFAULT 0,
  shipping_fee NUMERIC(15, 0) NOT NULL DEFAULT 0,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);

-- =============================================
-- BẢNG CHI TIẾT HÓA ĐƠN
-- (Giữ lại product_unit để in lại không bị mất đơn vị)
-- =============================================
CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_unit TEXT NOT NULL DEFAULT '',
  product_price NUMERIC(15, 0) NOT NULL DEFAULT 0,
  quantity NUMERIC NOT NULL DEFAULT 1,
  subtotal NUMERIC(15, 0) NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);

-- =============================================
-- ROW LEVEL SECURITY
-- Vì chỉ có 1 user dùng với anon key, cho phép mọi thao tác
-- Nếu muốn bảo mật hơn, hãy thêm authentication
-- =============================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- Policy: cho phép anon key đọc/ghi tất cả
CREATE POLICY "allow_all_products" ON products FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_customers" ON customers FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_invoices" ON invoices FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_invoice_items" ON invoice_items FOR ALL TO anon USING (true) WITH CHECK (true);
