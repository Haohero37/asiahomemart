// ============================================
// Dashboard Component
// ============================================

import React, { useEffect, useState, useCallback } from 'react';
import {
  TrendingUp, ShoppingCart, Package, Users,
  ArrowUpRight, Banknote, Calendar, BarChart3,
  RefreshCw,
} from 'lucide-react';
import { fetchStats, fetchRevenueByDay } from '../services';
import type { Stats } from '../types';
import { formatCurrency, formatNumber, formatDate } from '../utils';
import { isSupabaseConfigured } from '../lib/supabase';

interface DashboardProps {
  onNewInvoice: () => void;
}

export function Dashboard({ onNewInvoice }: DashboardProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [revenueData, setRevenueData] = useState<{ date: string; revenue: number; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [s, r] = await Promise.all([fetchStats(), fetchRevenueByDay(7)]);
      setStats(s);
      setRevenueData(r);
    } catch (e) {
      setError('Không thể tải dữ liệu thống kê.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const maxRevenue = Math.max(...revenueData.map(d => d.revenue), 1);

  const statCards = stats
    ? [
        {
          label: 'Hóa đơn hôm nay',
          value: formatNumber(stats.invoicesToday),
          sub: `Tổng: ${formatNumber(stats.totalInvoices)} hóa đơn`,
          icon: <ShoppingCart className="w-6 h-6" />,
          color: 'text-blue-600',
          bg: 'bg-blue-50',
          accent: 'border-blue-200',
        },
        {
          label: 'Doanh thu hôm nay',
          value: formatCurrency(stats.revenueToday),
          sub: `Tổng: ${formatCurrency(stats.totalRevenue)}`,
          icon: <Banknote className="w-6 h-6" />,
          color: 'text-green-600',
          bg: 'bg-green-50',
          accent: 'border-green-200',
        },
        {
          label: 'Sản phẩm',
          value: formatNumber(stats.totalProducts),
          sub: 'Đang niêm yết',
          icon: <Package className="w-6 h-6" />,
          color: 'text-amber-600',
          bg: 'bg-amber-50',
          accent: 'border-amber-200',
        },
        {
          label: 'Khách hàng',
          value: formatNumber(stats.totalCustomers),
          sub: 'Đã đăng ký',
          icon: <Users className="w-6 h-6" />,
          color: 'text-purple-600',
          bg: 'bg-purple-50',
          accent: 'border-purple-200',
        },
      ]
    : [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tổng quan</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {new Date().toLocaleDateString('ko-KR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={load}
            disabled={loading}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
          <button onClick={onNewInvoice} className="btn-primary flex items-center gap-2 text-sm">
            <ShoppingCart className="w-4 h-4" />
            Tạo hóa đơn
          </button>
        </div>
      </div>

      {/* Mode banner */}
      {!isSupabaseConfigured && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-amber-600 text-lg">⚠️</span>
          <div>
            <p className="text-sm font-medium text-amber-800">Đang chạy ở chế độ Demo</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Dữ liệu sẽ mất khi tải lại trang. Cấu hình Supabase trong Settings để lưu trữ thật.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="w-10 h-10 bg-gray-100 rounded-lg mb-3" />
              <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
              <div className="h-7 bg-gray-200 rounded w-1/2 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card, i) => (
            <div key={i} className={`stat-card border ${card.accent}`}>
              <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center mb-3 ${card.color}`}>
                {card.icon}
              </div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{card.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1 leading-tight">{card.value}</p>
              <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Revenue chart */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-red-600" />
            <h2 className="text-base font-semibold text-gray-800">Doanh thu 7 ngày gần nhất</h2>
          </div>
          <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
            <TrendingUp className="w-4 h-4" />
            <span>Theo ngày</span>
          </div>
        </div>
        {loading ? (
          <div className="h-40 bg-gray-50 rounded-xl animate-pulse" />
        ) : (
          <div className="flex items-end gap-2 h-44">
            {revenueData.map((day, i) => {
              const heightPct = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;
              const isToday = day.date === new Date().toISOString().slice(0, 10);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="w-full flex flex-col items-center justify-end relative" style={{ height: '140px' }}>
                    {/* Tooltip */}
                    {day.revenue > 0 && (
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                        {formatCurrency(day.revenue)}
                        <br />
                        {day.count} hóa đơn
                      </div>
                    )}
                    {/* Bar */}
                    <div
                      className={`w-full rounded-t-lg transition-all duration-500 ${
                        isToday
                          ? 'bg-gradient-to-b from-red-500 to-red-700'
                          : 'bg-gradient-to-b from-red-200 to-red-400 group-hover:from-red-400 group-hover:to-red-600'
                      }`}
                      style={{ height: `${Math.max(heightPct, day.revenue > 0 ? 4 : 0)}%` }}
                    />
                  </div>
                  <p className={`text-[10px] font-medium ${isToday ? 'text-red-600' : 'text-gray-400'}`}>
                    {isToday ? 'Hôm nay' : new Date(day.date + 'T00:00:00').toLocaleDateString('ko-KR', { day: '2-digit', month: '2-digit' })}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-800">Thông tin hệ thống</h3>
          </div>
          <dl className="space-y-2">
            {[
              { label: 'Tên cửa hàng', value: 'Asia Home Mart' },
              { label: 'Trạng thái DB', value: isSupabaseConfigured ? '🟢 Đã kết nối Supabase' : '🟡 Demo (không có DB)' },
              { label: 'Phiên bản', value: 'v1.0.0' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-sm">
                <dt className="text-gray-500">{label}</dt>
                <dd className="font-medium text-gray-800">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <ArrowUpRight className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-gray-800">Thao tác nhanh</h3>
          </div>
          <div className="space-y-2">
            <button
              onClick={onNewInvoice}
              className="w-full btn-primary flex items-center justify-center gap-2 text-sm py-2.5"
            >
              <ShoppingCart className="w-4 h-4" />
              Tạo hóa đơn mới
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
