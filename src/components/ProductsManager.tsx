// ============================================
// Products Manager Component
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  Package, Plus, Search, Edit2, Trash2, X, Check, RefreshCw,
} from 'lucide-react';
import type { Product } from '../types';
import { fetchProducts, createProduct, updateProduct, deleteProduct } from '../services';
import { formatCurrency, formatNumber } from '../utils';
import { Modal, ConfirmDialog } from './Modal';
import type { ToastType } from './Toast';

interface ProductsManagerProps {
  showToast: (message: string, type: ToastType) => void;
}

interface ProductForm {
  name: string;
  price: string;
  unit: string;
}

const UNITS = [
  'cái', 'chai', 'lon', 'gói', 'hộp', 'lốc', 'vỉ', 'túi', 'thùng',
  'kg', 'lạng', 'gram', 'lít', 'ml',
  'viên', 'bao', 'thanh', 'bó', 'trái', 'cuộn',
  'bộ', 'đôi', 'mét', 'tá'
];

export function ProductsManager({ showToast }: ProductsManagerProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState<ProductForm>({ name: '', price: '', unit: 'cái' });
  const [formErrors, setFormErrors] = useState<Partial<ProductForm>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchProducts();
      setProducts(data);
    } catch {
      showToast('Không thể tải danh sách sản phẩm', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.unit.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditingId(null);
    setForm({ name: '', price: '', unit: 'cái' });
    setFormErrors({});
    setShowModal(true);
  };

  const openEdit = (product: Product) => {
    setEditingId(product.id);
    setForm({ name: product.name, price: product.price.toString(), unit: product.unit });
    setFormErrors({});
    setShowModal(true);
  };

  const validate = (): boolean => {
    const errors: Partial<ProductForm> = {};
    if (!form.name.trim()) errors.name = 'Tên sản phẩm không được trống';
    const price = parseFloat(form.price.replace(/[^\d.]/g, ''));
    if (isNaN(price) || price < 0) errors.price = 'Giá không hợp lệ';
    if (!form.unit.trim()) errors.unit = 'Đơn vị không được trống';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    const productData = {
      name: form.name.trim(),
      price: parseFloat(form.price.replace(/[^\d.]/g, '')) || 0,
      unit: form.unit.trim(),
    };
    try {
      if (editingId) {
        const updated = await updateProduct(editingId, productData);
        setProducts(prev => prev.map(p => p.id === editingId ? updated : p));
        showToast('Đã cập nhật sản phẩm', 'success');
      } else {
        const created = await createProduct(productData);
        setProducts(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name, 'vi')));
        showToast('Đã thêm sản phẩm', 'success');
      }
      setShowModal(false);
    } catch {
      showToast('Lỗi khi lưu sản phẩm', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteProduct(deleteId);
      setProducts(prev => prev.filter(p => p.id !== deleteId));
      showToast('Đã xóa sản phẩm', 'success');
    } catch {
      showToast('Lỗi khi xóa sản phẩm', 'error');
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý sản phẩm</h1>
          <p className="text-sm text-gray-500 mt-0.5">{formatNumber(products.length)} sản phẩm</p>
        </div>
        <div className="flex gap-3">
          <button onClick={load} className="btn-secondary flex items-center gap-2 text-sm" disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
          <button onClick={openCreate} className="btn-primary flex items-center gap-2 text-sm" id="add-product-btn">
            <Plus className="w-4 h-4" />
            Thêm sản phẩm
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Tìm sản phẩm..."
            className="input-field pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
            id="product-search-list"
          />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400 mb-4">Chưa có sản phẩm nào</p>
            <button onClick={openCreate} className="btn-primary text-sm">
              Thêm sản phẩm đầu tiên
            </button>
          </div>
        ) : (
          <div>
            <div className="hidden md:grid grid-cols-12 px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide bg-gray-50">
              <span className="col-span-6">Tên sản phẩm</span>
              <span className="col-span-2 text-center">Đơn vị</span>
              <span className="col-span-3 text-right">Đơn giá</span>
              <span className="col-span-1" />
            </div>
            <div className="divide-y divide-gray-50">
              {filtered.map(p => (
                <div
                  key={p.id}
                  className="flex flex-col md:grid md:grid-cols-12 items-start md:items-center px-4 md:px-5 py-4 md:py-3.5 hover:bg-gray-50 transition-colors group gap-2 md:gap-0"
                >
                  <div className="w-full md:col-span-6 flex justify-between items-start md:block">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{p.name}</p>
                      <span className="badge bg-gray-100 text-gray-600 mt-1.5 md:hidden inline-block">{p.unit}</span>
                      <p className="text-sm font-bold text-red-700 mt-1 md:hidden">{formatCurrency(p.price)}</p>
                    </div>
                    <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-100 md:hidden">
                      <button
                        onClick={() => openEdit(p)}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <div className="w-px bg-gray-200 my-1 mx-1"></div>
                      <button
                        onClick={() => setDeleteId(p.id)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="hidden md:block md:col-span-2 text-center">
                    <span className="badge bg-gray-100 text-gray-600">{p.unit}</span>
                  </div>
                  <div className="hidden md:block md:col-span-3 text-right">
                    <span className="text-sm font-bold text-red-700">{formatCurrency(p.price)}</span>
                  </div>
                  <div className="hidden md:flex md:col-span-1 gap-0.5 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEdit(p)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      title="Sửa"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteId(p.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Xóa"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <Modal
          title={editingId ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}
          onClose={() => setShowModal(false)}
          size="sm"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Tên sản phẩm <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className={`input-field ${formErrors.name ? 'border-red-300 focus:ring-red-400' : ''}`}
                placeholder="Ví dụ: Nước mắm Phú Quốc 500ml"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                id="product-name-input"
                autoFocus
              />
              {formErrors.name && <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Đơn giá (Won) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                className={`input-field ${formErrors.price ? 'border-red-300 focus:ring-red-400' : ''}`}
                placeholder="0"
                min={0}
                value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                id="product-price-input"
              />
              {form.price && !isNaN(parseFloat(form.price)) && (
                <p className="text-xs text-gray-500 mt-1">
                  ≈ {formatCurrency(parseFloat(form.price))}
                </p>
              )}
              {formErrors.price && <p className="text-xs text-red-500 mt-1">{formErrors.price}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Đơn vị tính <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <select
                  className="input-field flex-1"
                  value={UNITS.includes(form.unit) ? form.unit : '__custom__'}
                  onChange={e => {
                    if (e.target.value !== '__custom__') {
                      setForm(f => ({ ...f, unit: e.target.value }));
                    }
                  }}
                  id="product-unit-select"
                >
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  <option value="__custom__">Khác...</option>
                </select>
                {!UNITS.includes(form.unit) && (
                  <input
                    type="text"
                    className="input-field w-28"
                    placeholder="Nhập đơn vị"
                    value={form.unit}
                    onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                  />
                )}
              </div>
              {formErrors.unit && <p className="text-xs text-red-500 mt-1">{formErrors.unit}</p>}
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowModal(false)}
                className="btn-secondary flex-1"
                disabled={saving}
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
                id="save-product-btn"
              >
                <Check className="w-4 h-4" />
                {saving ? 'Đang lưu...' : editingId ? 'Cập nhật' : 'Thêm mới'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirm delete */}
      {deleteId && (
        <ConfirmDialog
          title="Xóa sản phẩm"
          message={`Bạn có chắc muốn xóa sản phẩm "${products.find(p => p.id === deleteId)?.name}"?`}
          confirmLabel="Xóa"
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
          isLoading={deleting}
        />
      )}
    </div>
  );
}
