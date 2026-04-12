// ============================================
// Invoice List Component
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText, Search, Eye, Trash2, Printer,
  RefreshCw, ChevronDown, ChevronUp, Filter,
  Calendar, User, DollarSign, FileDown
} from 'lucide-react';
import type { Invoice } from '../types';
import { fetchInvoices, deleteInvoice } from '../services';
import { formatCurrency, formatDateTime, formatNumber } from '../utils';
import { exportInvoiceToPDF } from '../utils/pdfExport';
import { ConfirmDialog, Modal } from './Modal';
import type { ToastType } from './Toast';

interface InvoiceListProps {
  showToast: (message: string, type: ToastType) => void;
  onNewInvoice: () => void;
  expandInvoiceId?: string | null;
}

export function InvoiceList({ showToast, onNewInvoice, expandInvoiceId }: InvoiceListProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchInvoices(100);
      setInvoices(data);
    } catch {
      showToast('Không thể tải danh sách hóa đơn', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (expandInvoiceId) {
      const inv = invoices.find(i => i.id === expandInvoiceId);
      if (inv) setViewInvoice(inv);
    }
  }, [expandInvoiceId, invoices]);

  const filtered = invoices.filter(inv =>
    inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
    (inv.customer?.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (inv.note || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteInvoice(deleteId);
      setInvoices(prev => prev.filter(i => i.id !== deleteId));
      showToast('Đã xóa hóa đơn', 'success');
    } catch {
      showToast('Lỗi khi xóa hóa đơn', 'error');
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const handleExportPDF = async (inv: Invoice, autoPrint = false) => {
    let printWindow: Window | null = null;
    if (autoPrint) {
      printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write('<div style="font-family: sans-serif; padding: 20px; text-align: center;">Đang tạo hóa đơn. Vui lòng đợi...</div>');
      } else {
        showToast('Vui lòng cho phép mở popup để có thể in', 'warning');
      }
    }

    try {
      await exportInvoiceToPDF({
        shopName: "Asia Home Mart",
        phone: "010-6709-1705",
        address: "천안시 서북구 성환읍 대학로7",
        invoiceNumber: inv.invoice_number,
        createdAt: new Date(inv.created_at),
        customer: {
          name: inv.customer?.name || "Khách lẻ",
          phone: inv.customer?.phone || "---",
          address: inv.customer?.address || "---"
        },
        items: (inv.invoice_items || []).map(i => ({
          name: i.product_name,
          unitPrice: i.product_price,
          quantity: i.quantity,
          subtotal: i.subtotal
        })),
        subtotal: inv.total_amount,
        shippingFee: inv.shipping_fee || 0,
        total: inv.total_amount,
        paymentMethod: "Thu hộ (COD)",
        currency: "₩",
        thankYouMessage: "Cảm ơn quý khách!\nHẹn gặp lại"
      }, autoPrint, printWindow);
      if (!autoPrint) showToast('Đã xuất PDF thành công!', 'success');
    } catch {
      showToast(autoPrint ? 'Lỗi khi in hóa đơn' : 'Lỗi khi xuất PDF', 'error');
    }
  };

  const handlePrint = (invoice: Invoice) => {
    handleExportPDF(invoice, true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Danh sách hóa đơn</h1>
          <p className="text-sm text-gray-500 mt-0.5">{formatNumber(invoices.length)} hóa đơn</p>
        </div>
        <div className="flex gap-3">
          <button onClick={load} className="btn-secondary flex items-center gap-2 text-sm" disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
          <button onClick={onNewInvoice} className="btn-primary flex items-center gap-2 text-sm">
            <FileText className="w-4 h-4" />
            Tạo hóa đơn
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Tìm theo số hóa đơn, tên khách hàng..."
            className="input-field pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
            id="invoice-search"
          />
        </div>
      </div>

      {/* List */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse flex gap-4">
                <div className="h-14 flex-1 bg-gray-100 rounded-xl" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <FileText className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">Không có hóa đơn nào</p>
            <button onClick={onNewInvoice} className="btn-primary mt-4 text-sm">
              Tạo hóa đơn đầu tiên
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {/* Header */}
            <div className="hidden md:grid grid-cols-12 px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide bg-gray-50">
              <span className="col-span-3">Số hóa đơn</span>
              <span className="col-span-3">Khách hàng</span>
              <span className="col-span-2">Ngày tạo</span>
              <span className="col-span-2 text-right">Tổng tiền</span>
              <span className="col-span-2 text-right">Thao tác</span>
            </div>
            {filtered.map(inv => (
              <React.Fragment key={inv.id}>
                <div
                  className="flex flex-col md:grid md:grid-cols-12 md:items-center px-4 py-4 md:px-5 hover:bg-gray-50 transition-colors cursor-pointer gap-3 md:gap-0"
                  onClick={() => setViewInvoice(inv)}
                >
                  {/* Top mobile row: Invoice info & Total (Right) */}
                  <div className="w-full md:col-span-3 flex justify-between md:block items-start">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{inv.invoice_number}</p>
                      {inv.note && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px] md:max-w-full">{inv.note}</p>
                      )}
                    </div>
                    {/* Mobile Only: Total amount right aligned */}
                    <div className="text-right md:hidden shrink-0">
                      <p className="text-sm font-bold text-red-700">{formatCurrency(inv.total_amount)}</p>
                      {inv.invoice_items && (
                        <p className="text-xs text-gray-400">{inv.invoice_items.length} mặt hàng</p>
                      )}
                    </div>
                  </div>

                  {/* Customer Info & Date (Mobile only) */}
                  <div className="w-full md:col-span-3 flex justify-between md:block items-center">
                    {inv.customer ? (
                      <div className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <p className="text-sm text-gray-700 truncate max-w-[150px] md:max-w-full">{inv.customer.name}</p>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 italic">Khách vãng lai</span>
                    )}
                    
                    {/* Mobile Only: Date right aligned */}
                    <div className="flex md:hidden items-center gap-1 text-gray-500">
                      <Calendar className="w-3.5 h-3.5 shrink-0" />
                      <p className="text-xs">{formatDateTime(inv.created_at)}</p>
                    </div>
                  </div>

                  {/* Desktop Date */}
                  <div className="hidden md:flex col-span-2 items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <p className="text-xs text-gray-500">{formatDateTime(inv.created_at)}</p>
                  </div>

                  {/* Desktop Total Amount */}
                  <div className="hidden md:block md:col-span-2 text-right">
                    <p className="text-sm font-bold text-red-700">{formatCurrency(inv.total_amount)}</p>
                    {inv.invoice_items && (
                      <p className="text-xs text-gray-400">{inv.invoice_items.length} mặt hàng</p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex md:col-span-2 gap-2 md:gap-1 justify-between md:justify-end w-full mt-2 md:mt-0 pt-3 md:pt-0 border-t md:border-0 border-gray-100">
                    <button
                      onClick={e => { e.stopPropagation(); handleExportPDF(inv); }}
                      className="p-2 flex-1 md:flex-none text-gray-500 md:text-gray-400 hover:text-red-600 flex items-center justify-center bg-gray-50 md:bg-transparent hover:bg-red-50 rounded-lg transition-all border border-gray-100 md:border-transparent"
                      title="Xuất PDF"
                    >
                      <FileDown className="w-4 h-4 md:w-4 md:h-4 shrink-0" />
                      <span className="text-[11px] font-medium ml-1.5 md:hidden">Xuất</span>
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); handlePrint(inv); }}
                      className="p-2 flex-1 md:flex-none text-gray-500 md:text-gray-400 hover:text-blue-600 flex items-center justify-center bg-gray-50 md:bg-transparent hover:bg-blue-50 rounded-lg transition-all border border-gray-100 md:border-transparent"
                      title="In hóa đơn"
                    >
                      <Printer className="w-4 h-4 md:w-4 md:h-4 shrink-0" />
                      <span className="text-[11px] font-medium ml-1.5 md:hidden">In</span>
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); setViewInvoice(inv); }}
                      className="p-2 flex-1 md:flex-none text-gray-500 md:text-gray-400 hover:text-emerald-600 flex items-center justify-center bg-gray-50 md:bg-transparent hover:bg-emerald-50 rounded-lg transition-all border border-gray-100 md:border-transparent"
                      title="Xem chi tiết"
                    >
                      <Eye className="w-4 h-4 md:w-4 md:h-4 shrink-0" />
                      <span className="text-[11px] font-medium ml-1.5 md:hidden">Xem</span>
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); setDeleteId(inv.id); }}
                      className="p-2 flex-1 md:flex-none text-gray-500 md:text-gray-400 hover:text-rose-600 flex items-center justify-center bg-gray-50 md:bg-transparent hover:bg-rose-50 rounded-lg transition-all border border-gray-100 md:border-transparent"
                      title="Xóa"
                    >
                      <Trash2 className="w-4 h-4 md:w-4 md:h-4 shrink-0" />
                      <span className="text-[11px] font-medium ml-1.5 md:hidden">Xóa</span>
                    </button>
                  </div>
                </div>
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      {!loading && filtered.length > 0 && (
        <div className="text-center text-xs text-gray-400">
          Hiển thị {filtered.length} / {invoices.length} hóa đơn •{' '}
          Tổng: {formatCurrency(filtered.reduce((s, i) => s + i.total_amount, 0))}
        </div>
      )}

      {/* Confirm delete */}
      {deleteId && (
        <ConfirmDialog
          title="Xóa hóa đơn"
          message="Bạn có chắc muốn xóa hóa đơn này? Hành động này không thể hoàn tác."
          confirmLabel="Xóa"
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
          isLoading={deleting}
        />
      )}

      {/* View Invoice Modal */}
      {viewInvoice && (
        <Modal
          title={`Chi tiết hóa đơn: ${viewInvoice.invoice_number}`}
          onClose={() => setViewInvoice(null)}
          size="md"
        >
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  {viewInvoice.customer ? viewInvoice.customer.name : 'Khách vãng lai'}
                </p>
                {viewInvoice.customer?.phone && <p className="text-xs text-gray-500 mt-1">{viewInvoice.customer.phone}</p>}
                <p className="text-xs text-gray-400 mt-1">{formatDateTime(viewInvoice.created_at)}</p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-sm text-gray-500">Tổng cộng</p>
                <p className="text-xl font-bold text-red-700">{formatCurrency(viewInvoice.total_amount)}</p>
              </div>
            </div>

            <div className="border border-gray-100 rounded-xl overflow-hidden max-h-[40vh] overflow-y-auto">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 text-xs font-semibold text-gray-500 sticky top-0 z-10">
                Danh sách sản phẩm
              </div>
              <div className="divide-y divide-gray-50">
                {(viewInvoice.invoice_items || []).map((item, i) => (
                  <div key={i} className="px-4 py-3 bg-white flex justify-between items-center text-sm">
                    <div>
                      <p className="font-medium text-gray-800">{item.product_name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {formatCurrency(item.product_price)} × {item.quantity} {item.product_unit}
                      </p>
                    </div>
                    <span className="font-semibold text-red-700">{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
                {(viewInvoice.shipping_fee || 0) > 0 && (
                  <div className="px-4 py-3 bg-gray-50 flex justify-between items-center text-sm">
                    <p className="font-medium text-gray-600">Phí giao hàng</p>
                    <span className="font-semibold text-gray-700">{formatCurrency(viewInvoice.shipping_fee)}</span>
                  </div>
                )}
              </div>
            </div>

            {viewInvoice.note && (
              <div className="text-sm text-gray-600 bg-yellow-50 border border-yellow-100 p-3 rounded-lg flex items-start gap-2">
                <span className="font-bold text-yellow-600">📝</span>
                <span><strong className="text-yellow-700">Ghi chú:</strong> {viewInvoice.note}</span>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={() => handleExportPDF(viewInvoice)}
                className="btn-secondary flex-1 flex items-center justify-center gap-2 py-2.5"
              >
                <FileDown className="w-4 h-4" /> Xuất PDF
              </button>
              <button
                onClick={() => handlePrint(viewInvoice)}
                className="btn-primary flex-1 flex items-center justify-center gap-2 py-2.5"
              >
                <Printer className="w-4 h-4" /> In hóa đơn
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}
