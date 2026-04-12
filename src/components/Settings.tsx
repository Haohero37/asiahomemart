// ============================================
// Settings Component
// ============================================

import React, { useState } from 'react';
import {
  Settings as SettingsIcon, Database, Save, Eye, EyeOff,
  CheckCircle, AlertCircle, ExternalLink, RefreshCw, Copy,
} from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';
import type { ToastType } from './Toast';

interface SettingsProps {
  showToast: (message: string, type: ToastType) => void;
}

export function Settings({ showToast }: SettingsProps) {
  const [supabaseUrl, setSupabaseUrl] = useState(
    import.meta.env.VITE_SUPABASE_URL || ''
  );
  const [supabaseKey, setSupabaseKey] = useState(
    import.meta.env.VITE_SUPABASE_ANON_KEY || ''
  );
  const [showKey, setShowKey] = useState(false);

  const copySQL = () => {
    const sql = `-- Asia Home Mart Schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  price NUMERIC(15, 0) NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'cái',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  total_amount NUMERIC(15, 0) NOT NULL DEFAULT 0,
  shipping_fee NUMERIC(15, 0) NOT NULL DEFAULT 0,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_products" ON products FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_customers" ON customers FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_invoices" ON invoices FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_invoice_items" ON invoice_items FOR ALL TO anon USING (true) WITH CHECK (true);`;
    navigator.clipboard.writeText(sql).then(() => {
      showToast('Đã copy SQL schema!', 'success');
    });
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cài đặt</h1>
        <p className="text-sm text-gray-500 mt-0.5">Cấu hình kết nối cơ sở dữ liệu và thông tin cửa hàng</p>
      </div>

      {/* Supabase status */}
      <div className={`card p-5 border-2 ${isSupabaseConfigured ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}`}>
        <div className="flex items-center gap-3">
          {isSupabaseConfigured
            ? <CheckCircle className="w-6 h-6 text-green-600 shrink-0" />
            : <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
          }
          <div>
            <p className={`font-semibold ${isSupabaseConfigured ? 'text-green-800' : 'text-amber-800'}`}>
              {isSupabaseConfigured ? 'Đã kết nối Supabase' : 'Chưa kết nối Supabase'}
            </p>
            <p className={`text-sm mt-0.5 ${isSupabaseConfigured ? 'text-green-700' : 'text-amber-700'}`}>
              {isSupabaseConfigured
                ? 'Dữ liệu đang được lưu trữ trên cloud database'
                : 'Đang sử dụng dữ liệu demo. Dữ liệu sẽ mất khi tải lại trang.'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Supabase config guide */}
      <div className="card p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-red-600" />
          <h2 className="font-semibold text-gray-800">Kết nối Supabase</h2>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-3">
          <p className="font-medium text-gray-700">Hướng dẫn cấu hình:</p>
          <ol className="list-decimal list-inside space-y-2 text-gray-600">
            <li>
              Tạo tài khoản miễn phí tại{' '}
              <a
                href="https://supabase.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-600 hover:underline font-medium inline-flex items-center gap-1"
              >
                supabase.com <ExternalLink className="w-3 h-3" />
              </a>
            </li>
            <li>Tạo project mới</li>
            <li>Vào <strong>SQL Editor</strong>, chạy script schema bên dưới</li>
            <li>Vào <strong>Settings → API</strong>, lấy Project URL và anon key</li>
            <li>Tạo file <code className="bg-gray-200 px-1.5 py-0.5 rounded text-xs">.env</code> ở thư mục gốc dự án</li>
          </ol>
        </div>

        {/* .env content */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Nội dung file .env:</p>
          <div className="bg-gray-900 rounded-xl p-4 font-mono text-sm relative">
            <pre className="text-green-400 whitespace-pre-wrap break-all">
{`VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6Ikp...`}
            </pre>
            <button
              onClick={() => {
                const content = `VITE_SUPABASE_URL=${supabaseUrl || 'https://xxxx.supabase.co'}\nVITE_SUPABASE_ANON_KEY=${supabaseKey || 'your-anon-key'}`;
                navigator.clipboard.writeText(content);
                showToast('Đã copy!', 'success');
              }}
              className="absolute top-3 right-3 text-gray-500 hover:text-white transition-colors"
              title="Copy"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* SQL Schema */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-700">SQL Schema (chạy trong Supabase SQL Editor):</p>
            <button
              onClick={copySQL}
              className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-medium"
            >
              <Copy className="w-3.5 h-3.5" />
              Copy SQL
            </button>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 font-mono text-xs text-gray-300 max-h-48 overflow-y-auto">
            <pre>{`-- Chạy trong Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE products (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL, price NUMERIC(15,0) DEFAULT 0,
  unit TEXT DEFAULT 'cái', created_at TIMESTAMPTZ DEFAULT NOW());

CREATE TABLE customers (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL, phone TEXT, address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW());

CREATE TABLE invoices (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number TEXT UNIQUE NOT NULL, customer_id UUID REFERENCES customers(id),
  total_amount NUMERIC(15,0) DEFAULT 0, shipping_fee NUMERIC(15,0) DEFAULT 0, note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW());

CREATE TABLE invoice_items (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id), product_name TEXT NOT NULL,
  product_unit TEXT DEFAULT '', product_price NUMERIC(15,0) DEFAULT 0,
  quantity NUMERIC DEFAULT 1, subtotal NUMERIC(15,0) DEFAULT 0);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- Allow anon access
CREATE POLICY "allow_all" ON products FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON customers FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON invoices FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON invoice_items FOR ALL TO anon USING (true) WITH CHECK (true);`}</pre>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800">
          <p className="font-medium mb-1">💡 Sau khi cấu hình .env:</p>
          <p>Khởi động lại dev server bằng lệnh <code className="bg-blue-100 px-1.5 py-0.5 rounded text-xs">npm run dev</code> để áp dụng thay đổi.</p>
        </div>
      </div>

      {/* App info */}
      <div className="card p-6">
        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <SettingsIcon className="w-4 h-4 text-red-600" />
          Thông tin ứng dụng
        </h2>
        <dl className="space-y-3">
          {[
            { label: 'Tên ứng dụng', value: 'Asia Home Mart — Quản lý hóa đơn' },
            { label: 'Phiên bản', value: '1.0.0' },
            { label: 'Tech stack', value: 'React + TypeScript + Tailwind CSS + Supabase' },
            { label: 'Xuất PDF', value: 'html2canvas + jsPDF (CDN)' },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between items-start gap-4 py-2 border-b border-gray-50 last:border-0">
              <dt className="text-sm text-gray-500 shrink-0">{label}</dt>
              <dd className="text-sm font-medium text-gray-800 text-right">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
