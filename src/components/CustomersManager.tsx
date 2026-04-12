// ============================================
// Customers Manager Component
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Plus, Search, Edit2, Trash2, Check, RefreshCw,
  Phone, MapPin, Calendar,
} from 'lucide-react';
import type { Customer } from '../types';
import { fetchCustomers, createCustomer, updateCustomer, deleteCustomer } from '../services';
import { formatNumber, formatDate } from '../utils';
import { Modal, ConfirmDialog } from './Modal';
import type { ToastType } from './Toast';

interface CustomersManagerProps {
  showToast: (message: string, type: ToastType) => void;
}

interface CustomerForm {
  name: string;
  phone: string;
  address: string;
}

export function CustomersManager({ showToast }: CustomersManagerProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState<CustomerForm>({ name: '', phone: '', address: '' });
  const [formErrors, setFormErrors] = useState<Partial<CustomerForm>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCustomers();
      setCustomers(data);
    } catch {
      showToast('Không thể tải danh sách khách hàng', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').includes(search) ||
    (c.address || '').toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditingId(null);
    setForm({ name: '', phone: '', address: '' });
    setFormErrors({});
    setShowModal(true);
  };

  const openEdit = (c: Customer) => {
    setEditingId(c.id);
    setForm({ name: c.name, phone: c.phone || '', address: c.address || '' });
    setFormErrors({});
    setShowModal(true);
  };

  const validate = (): boolean => {
    const errors: Partial<CustomerForm> = {};
    if (!form.name.trim()) errors.name = 'Tên khách hàng không được trống';
    if (form.phone && !/^[0-9+\-\s()]{7,15}$/.test(form.phone.trim())) {
      errors.phone = 'Số điện thoại không hợp lệ';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    const customerData = {
      name: form.name.trim(),
      phone: form.phone.trim() || undefined,
      address: form.address.trim() || undefined,
    };
    try {
      if (editingId) {
        const updated = await updateCustomer(editingId, customerData);
        setCustomers(prev => prev.map(c => c.id === editingId ? updated : c));
        showToast('Đã cập nhật khách hàng', 'success');
      } else {
        const created = await createCustomer(customerData);
        setCustomers(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name, 'vi')));
        showToast('Đã thêm khách hàng', 'success');
      }
      setShowModal(false);
    } catch {
      showToast('Lỗi khi lưu khách hàng', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteCustomer(deleteId);
      setCustomers(prev => prev.filter(c => c.id !== deleteId));
      showToast('Đã xóa khách hàng', 'success');
    } catch {
      showToast('Lỗi khi xóa khách hàng', 'error');
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
          <h1 className="text-2xl font-bold text-gray-900">Quản lý khách hàng</h1>
          <p className="text-sm text-gray-500 mt-0.5">{formatNumber(customers.length)} khách hàng</p>
        </div>
        <div className="flex gap-3">
          <button onClick={load} className="btn-secondary flex items-center gap-2 text-sm" disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
          <button onClick={openCreate} className="btn-primary flex items-center gap-2 text-sm" id="add-customer-btn">
            <Plus className="w-4 h-4" />
            Thêm khách hàng
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Tìm tên, SĐT, địa chỉ..."
            className="input-field pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
            id="customer-search-list"
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="w-12 h-12 bg-gray-100 rounded-full mb-3" />
              <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card py-20 text-center">
          <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400 mb-4">Chưa có khách hàng nào</p>
          <button onClick={openCreate} className="btn-primary text-sm">
            Thêm khách hàng đầu tiên
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c => (
            <div key={c.id} className="card p-5 hover:shadow-md transition-all duration-200 group">
              <div className="flex items-start justify-between mb-3">
                <div className="w-11 h-11 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0">
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(c)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteId(c.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">{c.name}</h3>
              <div className="space-y-1">
                {c.phone && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Phone className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                    <span>{c.phone}</span>
                  </div>
                )}
                {c.address && (
                  <div className="flex items-start gap-2 text-xs text-gray-500">
                    <MapPin className="w-3.5 h-3.5 text-gray-300 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{c.address}</span>
                  </div>
                )}
                {c.created_at && (
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Calendar className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                    <span>Từ {formatDate(c.created_at)}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <Modal
          title={editingId ? 'Sửa khách hàng' : 'Thêm khách hàng mới'}
          onClose={() => setShowModal(false)}
          size="sm"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Tên khách hàng <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className={`input-field ${formErrors.name ? 'border-red-300' : ''}`}
                placeholder="Nguyễn Văn A"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                id="customer-name-input"
                autoFocus
              />
              {formErrors.name && <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Số điện thoại</label>
              <input
                type="tel"
                className={`input-field ${formErrors.phone ? 'border-red-300' : ''}`}
                placeholder="0901234567"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                id="customer-phone-input"
              />
              {formErrors.phone && <p className="text-xs text-red-500 mt-1">{formErrors.phone}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Địa chỉ</label>
              <textarea
                className="input-field resize-none"
                rows={2}
                placeholder="123 Đường ABC, Quận X, TP.HCM"
                value={form.address}
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                id="customer-address-input"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1" disabled={saving}>
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
                id="save-customer-btn"
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
          title="Xóa khách hàng"
          message={`Bạn có chắc muốn xóa khách hàng "${customers.find(c => c.id === deleteId)?.name}"?`}
          confirmLabel="Xóa"
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
          isLoading={deleting}
        />
      )}
    </div>
  );
}
