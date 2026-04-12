// ============================================
// Invoice Form Component (New Invoice)
// ============================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Plus, Trash2, Search, User, ChevronDown,
  FileText, Printer, Save, X, Package,
} from 'lucide-react';
import type { Product, Customer, InvoiceItem } from '../types';
import { fetchProducts, fetchCustomers, createInvoice, createCustomer } from '../services';
import { formatCurrency, formatNumber, formatDateTime } from '../utils';
import { exportInvoiceToPDF } from '../utils/pdfExport';
import { Modal } from './Modal';
import type { ToastType } from './Toast';

interface InvoiceFormProps {
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  showToast: (message: string, type: ToastType) => void;
  onInvoiceCreated?: (invoiceId: string) => void;
}

interface CartItem extends Omit<InvoiceItem, 'quantity'> {
  tempId: string;
  quantity: number | string;
}

export function InvoiceForm({ onSuccess, onError, showToast, onInvoiceCreated }: InvoiceFormProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [note, setNote] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [shippingFee, setShippingFee] = useState(0);

  // New customer states
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', address: '' });
  const [savingCustomer, setSavingCustomer] = useState(false);

  const productRef = useRef<HTMLDivElement>(null);
  const customerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([fetchProducts(), fetchCustomers()])
      .then(([p, c]) => {
        setProducts(p);
        setCustomers(c);
      })
      .finally(() => setLoadingProducts(false));
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (productRef.current && !productRef.current.contains(e.target as Node)) {
        setShowProductDropdown(false);
      }
      if (customerRef.current && !customerRef.current.contains(e.target as Node)) {
        setShowCustomerDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    (c.phone || '').includes(customerSearch)
  );

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name.trim()) return;
    setSavingCustomer(true);
    try {
      const created = await createCustomer({ ...newCustomer, name: newCustomer.name.trim() });
      setCustomers(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name, 'ko')));
      setSelectedCustomer(created);
      setShowAddCustomerModal(false);
      setNewCustomer({ name: '', phone: '', address: '' });
      setCustomerSearch('');
      showToast('Thêm khách hàng thành công', 'success');
    } catch (err) {
      showToast('Lỗi khi thêm khách hàng', 'error');
    } finally {
      setSavingCustomer(false);
    }
  };

  const addProduct = (product: Product) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.product_id === product.id);
      if (existing) {
        return prev.map(i =>
          i.product_id === product.id
            ? { ...i, quantity: Number(i.quantity) + 1, subtotal: (Number(i.quantity) + 1) * i.product_price }
            : i
        );
      }
      return [
        ...prev,
        {
          tempId: Date.now().toString(36),
          product_id: product.id,
          product_name: product.name,
          product_unit: product.unit,
          product_price: product.price,
          quantity: 1,
          subtotal: product.price,
        },
      ];
    });
    setProductSearch('');
    setShowProductDropdown(false);
  };

  const updateQuantity = (tempId: string, qty: number | string) => {
    if (qty === '') {
      setCartItems(prev => prev.map(i => i.tempId === tempId ? { ...i, quantity: '', subtotal: 0 } : i));
      return;
    }
    const numQty = Number(qty);
    if (isNaN(numQty) || Math.round(numQty * 1000) / 1000 < 0) return;
    setCartItems(prev =>
      prev.map(i =>
        i.tempId === tempId
          ? { ...i, quantity: numQty, subtotal: numQty * i.product_price }
          : i
      )
    );
  };

  const updatePrice = (tempId: string, price: number) => {
    setCartItems(prev =>
      prev.map(i =>
        i.tempId === tempId
          ? { ...i, product_price: price, subtotal: price * Number(i.quantity) }
          : i
      )
    );
  };

  const removeItem = (tempId: string) => {
    setCartItems(prev => prev.filter(i => i.tempId !== tempId));
  };

  const subtotal = cartItems.reduce((s, i) => s + i.subtotal, 0);
  const total = subtotal + shippingFee;

  const handleSave = async () => {
    if (cartItems.length === 0) {
      showToast('Vui lòng thêm ít nhất 1 sản phẩm', 'error');
      return;
    }
    const cleanItems = cartItems.map(item => ({ ...item, quantity: Number(item.quantity) || 0 })).filter(i => i.quantity > 0);
    if (cleanItems.length === 0) {
      showToast('Số lượng sản phẩm không hợp lệ', 'error');
      return;
    }
    setSaving(true);
    try {
      const createdInvoice = await createInvoice(
        { customer_id: selectedCustomer?.id || null, note, shipping_fee: shippingFee },
        cleanItems as InvoiceItem[]
      );
      showToast('Tạo hóa đơn thành công!', 'success');
      // Reset
      setCartItems([]);
      setSelectedCustomer(null);
      setNote('');
      setProductSearch('');
      setShippingFee(0);

      // Tell parent to open it in list
      if (typeof onInvoiceCreated === 'function') {
        onInvoiceCreated(createdInvoice.id);
      }
    } catch (e) {
      showToast('Lỗi khi tạo hóa đơn. Vui lòng thử lại.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = async () => {
    if (cartItems.length === 0) return;
    const cleanItems = cartItems.map(item => ({ ...item, quantity: Number(item.quantity) || 0 })).filter(i => i.quantity > 0);
    if (cleanItems.length === 0) {
      showToast('Số lượng sản phẩm không hợp lệ', 'error');
      return;
    }
    setSaving(true);
    try {
      const createdInvoice = await createInvoice(
        { customer_id: selectedCustomer?.id || null, note, shipping_fee: shippingFee },
        cleanItems as InvoiceItem[]
      );

      await exportInvoiceToPDF({
        shopName: "Asia Home Mart",
        phone: "010-6709-1705",
        address: "천안시 서북구 성환읍 대학로7",
        invoiceNumber: createdInvoice.invoice_number || ("TEMP-" + Date.now().toString().slice(-4)),
        createdAt: new Date(createdInvoice.created_at || new Date()),
        customer: {
          name: selectedCustomer?.name || "Khách lẻ",
          phone: selectedCustomer?.phone || "---",
          address: selectedCustomer?.address || "---"
        },
        items: cleanItems.map(i => ({
          name: i.product_name,
          unitPrice: i.product_price,
          quantity: i.quantity,
          subtotal: i.subtotal
        })),
        subtotal: subtotal,
        shippingFee: shippingFee,
        total: total,
        paymentMethod: "Thu hộ (COD)",
        currency: "₩",
        thankYouMessage: "Cảm ơn quý khách!\nHẹn gặp lại"
      }, true); // true opens auto print pdf
      
      showToast('Đã lưu và mở lệnh in!', 'success');
      
      // Reset
      setCartItems([]);
      setSelectedCustomer(null);
      setNote('');
      setProductSearch('');
      setShippingFee(0);

      // Tell parent to open it in list
      if (typeof onInvoiceCreated === 'function') {
        onInvoiceCreated(createdInvoice.id);
      }
    } catch {
      showToast('Lỗi khi thao tác', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tạo hóa đơn mới</h1>
          <p className="text-sm text-gray-500 mt-0.5">Thêm sản phẩm và chọn khách hàng</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Product selection & cart */}
        <div className="lg:col-span-2 space-y-4">
          {/* Product search */}
          <div className="card p-5 overflow-visible">
            <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Package className="w-4 h-4 text-red-600" />
              Thêm sản phẩm
            </h2>
            <div className="relative" ref={productRef}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Tìm tên sản phẩm..."
                  className="input-field pl-9"
                  value={productSearch}
                  onChange={e => {
                    setProductSearch(e.target.value);
                    setShowProductDropdown(true);
                  }}
                  onFocus={() => setShowProductDropdown(true)}
                  id="product-search"
                />
              </div>
              {showProductDropdown && (
                <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-xl max-h-64 overflow-y-auto">
                  {loadingProducts ? (
                    <div className="px-4 py-8 text-center text-sm text-gray-400">Đang tải...</div>
                  ) : filteredProducts.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-gray-400">Không tìm thấy sản phẩm</div>
                  ) : (
                    filteredProducts.map(p => (
                      <button
                        key={p.id}
                        onClick={() => addProduct(p)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-red-50 text-left transition-colors"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-800">{p.name}</p>
                          <p className="text-xs text-gray-400">{p.unit}</p>
                        </div>
                        <span className="text-sm font-semibold text-red-700">
                          {formatCurrency(p.price)}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Cart */}
          <div className="card overflow-visible">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <FileText className="w-4 h-4 text-red-600" />
                Danh sách sản phẩm
              </h2>
              {cartItems.length > 0 && (
                <span className="badge bg-red-100 text-red-700">{cartItems.length} sản phẩm</span>
              )}
            </div>

            {cartItems.length === 0 ? (
              <div className="px-5 py-16 text-center">
                <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400">Chưa có sản phẩm nào. Tìm và thêm ở trên.</p>
              </div>
            ) : (
              <div>
                {/* Table header */}
                <div className="hidden lg:grid grid-cols-12 px-5 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-50">
                  <span className="col-span-5">Tên sản phẩm</span>
                  <span className="col-span-2 text-center">Đơn vị</span>
                  <span className="col-span-2 text-right">Đơn giá</span>
                  <span className="col-span-2 text-center">SL</span>
                  <span className="col-span-1" />
                </div>
                {cartItems.map((item, idx) => (
                  <div
                    key={item.tempId}
                    className={`flex flex-col lg:grid lg:grid-cols-12 items-start lg:items-center px-4 lg:px-5 py-4 lg:py-3 gap-3 lg:gap-0 hover:bg-gray-50 transition-colors ${
                      idx < cartItems.length - 1 ? 'border-b border-gray-50' : ''
                    }`}
                  >
                    <div className="w-full lg:col-span-5 flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-800 leading-tight">{item.product_name}</p>
                        <p className="text-xs text-gray-400 mt-0.5 lg:hidden">Đơn vị: {item.product_unit}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Thành tiền: <span className="font-semibold text-red-700">{formatCurrency(item.subtotal)}</span>
                        </p>
                      </div>
                      <button
                        onClick={() => removeItem(item.tempId)}
                        className="lg:hidden p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="hidden lg:block lg:col-span-2 text-center">
                      <span className="text-xs text-gray-500">{item.product_unit}</span>
                    </div>
                    
                    <div className="w-full flex items-center justify-between lg:w-auto lg:col-span-2 lg:block lg:text-right">
                      <span className="text-xs font-medium text-gray-500 lg:hidden">Đơn giá:</span>
                      <input
                        type="number"
                        className="w-28 lg:w-full text-xs text-right border border-gray-200 rounded-lg px-2 py-1.5 lg:py-1 focus:outline-none focus:ring-1 focus:ring-red-400"
                        value={item.product_price}
                        min={0}
                        onChange={e => updatePrice(item.tempId, Number(e.target.value))}
                      />
                    </div>
                    
                    <div className="w-full flex items-center justify-between lg:w-auto lg:col-span-2 lg:flex lg:justify-center">
                      <span className="text-xs font-medium text-gray-500 lg:hidden">Số lượng:</span>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => updateQuantity(item.tempId, Math.max(0, Number(item.quantity) - 1))}
                          className="w-8 h-8 lg:w-6 lg:h-6 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-sm transition-colors"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min={0}
                          step="any"
                          className="w-12 lg:w-10 text-center text-sm font-semibold border border-gray-200 rounded-md py-1 lg:py-0.5 focus:outline-none focus:ring-1 focus:ring-red-400"
                          value={item.quantity}
                          onChange={e => updateQuantity(item.tempId, e.target.value)}
                        />
                        <button
                          onClick={() => updateQuantity(item.tempId, Number(item.quantity) + 1)}
                          className="w-8 h-8 lg:w-6 lg:h-6 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-sm transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    
                    <div className="hidden lg:flex lg:col-span-1 justify-end">
                      <button
                        onClick={() => removeItem(item.tempId)}
                        className="w-7 h-7 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {/* Total row */}
                <div className="border-t border-gray-100 px-5 py-4 flex items-center justify-between bg-gray-50">
                  <span className="text-sm font-semibold text-gray-600">
                    Thành tiền ({cartItems.length} sản phẩm)
                  </span>
                  <span className="text-xl font-bold text-red-700">{formatCurrency(subtotal)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Customer & actions */}
        <div className="space-y-4 overflow-visible">
          {/* Customer selector */}
          <div className="card p-5 overflow-visible">
            <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-red-600" />
              Khách hàng
            </h2>

            {selectedCustomer ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-green-800">{selectedCustomer.name}</p>
                  {selectedCustomer.phone && (
                    <p className="text-xs text-green-700">{selectedCustomer.phone}</p>
                  )}
                  {selectedCustomer.address && (
                    <p className="text-xs text-gray-500 mt-0.5">{selectedCustomer.address}</p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="relative" ref={customerRef}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Tìm tên / SĐT..."
                    className="input-field pl-9"
                    value={customerSearch}
                    onChange={e => {
                      setCustomerSearch(e.target.value);
                      setShowCustomerDropdown(true);
                    }}
                    onFocus={() => setShowCustomerDropdown(true)}
                    id="customer-search"
                  />
                </div>
                {showCustomerDropdown && (
                  <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden flex flex-col">
                    <div className="max-h-48 overflow-y-auto">
                      {filteredCustomers.length === 0 ? (
                        <div className="px-4 py-6 text-center text-sm text-gray-400">Không tìm thấy khách hàng</div>
                      ) : (
                        filteredCustomers.map(c => (
                          <button
                            key={c.id}
                            onClick={() => {
                              setSelectedCustomer(c);
                              setCustomerSearch('');
                              setShowCustomerDropdown(false);
                            }}
                            className="w-full flex flex-col items-start px-4 py-2.5 hover:bg-red-50 text-left transition-colors"
                          >
                            <p className="text-sm font-medium text-gray-800">{c.name}</p>
                            {c.phone && <p className="text-xs text-gray-400">{c.phone}</p>}
                          </button>
                        ))
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setShowCustomerDropdown(false);
                        setShowAddCustomerModal(true);
                      }}
                      className="w-full bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center p-3 font-medium text-sm border-t border-red-100 transition-colors"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Thêm khách hàng mới
                    </button>
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  Để trống nếu là khách vãng lai
                </p>
              </div>
            )}
          </div>

          {/* Note & Shipping */}
          <div className="card p-5 space-y-4">
            <div>
              <h2 className="font-semibold text-gray-800 mb-2 text-sm">Phí giao hàng (Won)</h2>
              <input
                type="number"
                min={0}
                className="input-field"
                placeholder="0"
                value={shippingFee || ''}
                onChange={e => setShippingFee(Number(e.target.value))}
              />
            </div>
            <div>
              <h2 className="font-semibold text-gray-800 mb-2 text-sm">Ghi chú</h2>
              <textarea
                className="input-field resize-none"
                rows={2}
                placeholder="Giao hàng, thanh toán sau..."
                value={note}
                onChange={e => setNote(e.target.value)}
                id="invoice-note"
              />
            </div>
          </div>

          <div className="card p-5 bg-gradient-to-br from-red-600 to-red-800 text-white">
            <div className="flex justify-between items-center mb-1">
              <p className="text-sm font-medium text-red-200">Tiền hàng</p>
              <p className="text-sm font-bold">{formatCurrency(subtotal)}</p>
            </div>
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-medium text-red-200">Phí ship</p>
              <p className="text-sm font-bold">{formatCurrency(shippingFee)}</p>
            </div>
            <div className="border-t border-red-500/30 my-2"></div>
            <p className="text-sm font-medium text-red-100 mb-1">TỔNG THANH TOÁN</p>
            <p className="text-3xl font-bold">{formatCurrency(total)}</p>
            <p className="text-xs text-red-200 mt-1">
              • {cartItems.length} mặt hàng
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <button
              onClick={handleSave}
              disabled={saving || cartItems.length === 0}
              className={`w-full btn-success flex items-center justify-center gap-2 py-3 ${
                cartItems.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              id="save-invoice-btn"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Đang lưu...' : 'Lưu hóa đơn'}
            </button>
            <button
              onClick={handlePrint}
              disabled={cartItems.length === 0}
              className={`w-full btn-secondary flex items-center justify-center gap-2 py-2.5 ${
                cartItems.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Printer className="w-4 h-4" />
              In hóa đơn
            </button>
          </div>
        </div>
      </div>

      {/* Print preview (hidden, shown only on print) */}
      <div className="print-area">
        <div style={{ fontFamily: 'Be Vietnam Pro, Arial, sans-serif', padding: '20px', maxWidth: '350px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <h1 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>ASIA HOME MART</h1>
            <p style={{ fontSize: '12px', color: '#666', margin: '4px 0' }}>Hóa đơn bán hàng</p>
            <p style={{ fontSize: '11px', color: '#999', margin: 0 }}>{new Date().toLocaleString('ko-KR')}</p>
          </div>
          {selectedCustomer && (
            <div style={{ marginBottom: '12px', fontSize: '12px', borderTop: '1px dashed #ccc', paddingTop: '10px' }}>
              <p><strong>KH:</strong> {selectedCustomer.name}</p>
              {selectedCustomer.phone && <p><strong>SĐT:</strong> {selectedCustomer.phone}</p>}
            </div>
          )}
          <div style={{ borderTop: '1px dashed #ccc', paddingTop: '10px', marginBottom: '10px' }}>
            {cartItems.map((item, i) => (
              <div key={i} style={{ marginBottom: '6px', fontSize: '12px' }}>
                <p style={{ margin: 0 }}>{item.product_name}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#555' }}>
                  <span>{formatCurrency(item.product_price)} × {item.quantity} {item.product_unit}</span>
                  <span>{formatCurrency(item.subtotal)}</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '2px solid #000', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '14px' }}>
            <span>TỔNG CỘNG</span>
            <span>{formatCurrency(total)}</span>
          </div>
          {note && <p style={{ fontSize: '11px', color: '#666', marginTop: '8px' }}>Ghi chú: {note}</p>}
          <p style={{ textAlign: 'center', fontSize: '11px', color: '#999', marginTop: '16px' }}>
            Cảm ơn quý khách!
          </p>
        </div>
      </div>

      {showAddCustomerModal && (
        <Modal title="Thêm khách hàng mới" onClose={() => setShowAddCustomerModal(false)}>
          <form onSubmit={handleAddCustomer} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên khách hàng <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                className="input-field"
                placeholder="Nhập tên khách hàng"
                value={newCustomer.name}
                onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
              <input
                type="text"
                className="input-field"
                placeholder="Nhập số điện thoại"
                value={newCustomer.phone}
                onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
              <input
                type="text"
                className="input-field"
                placeholder="Nhập địa chỉ (không bắt buộc)"
                value={newCustomer.address}
                onChange={e => setNewCustomer({ ...newCustomer, address: e.target.value })}
              />
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowAddCustomerModal(false)}
                className="btn-secondary flex-1"
                disabled={savingCustomer}
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={savingCustomer || !newCustomer.name.trim()}
                className={`btn-primary flex-1 ${(!newCustomer.name.trim() || savingCustomer) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {savingCustomer ? 'Đang lưu...' : 'Lưu khách hàng'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
