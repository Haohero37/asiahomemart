// ============================================
// Sidebar Navigation Component
// ============================================

import React from 'react';
import {
  LayoutDashboard, FilePlus, FileText, Package,
  Users, Settings, Menu, X, ShoppingBag,
} from 'lucide-react';
import type { Tab } from '../types';
import { isSupabaseConfigured } from '../lib/supabase';

interface SidebarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  collapsed: boolean;
  onToggle: () => void;
}

interface NavItem {
  id: Tab;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Tổng quan', icon: <LayoutDashboard className="w-5 h-5" /> },
  { id: 'invoice-new', label: 'Tạo hóa đơn', icon: <FilePlus className="w-5 h-5" /> },
  { id: 'invoices', label: 'Danh sách HĐ', icon: <FileText className="w-5 h-5" /> },
  { id: 'products', label: 'Sản phẩm', icon: <Package className="w-5 h-5" /> },
  { id: 'customers', label: 'Khách hàng', icon: <Users className="w-5 h-5" /> },
  { id: 'settings', label: 'Cài đặt', icon: <Settings className="w-5 h-5" /> },
];

export function Sidebar({ activeTab, onTabChange, collapsed, onToggle }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <div
          className="fixed inset-0 bg-black/30 z-20 lg:hidden backdrop-blur-sm"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full z-30 flex flex-col bg-white border-r border-gray-100 shadow-xl transition-all duration-300 ease-in-out
          ${collapsed ? '-translate-x-full lg:translate-x-0 lg:w-[72px]' : 'translate-x-0 w-64'}`}
      >
        {/* Logo */}
        <div className={`flex items-center border-b border-gray-100 shrink-0 ${collapsed ? 'px-4 py-5 justify-center' : 'px-5 py-5 gap-3'}`}>
          <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-red-200">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div>
              <p className="font-bold text-gray-900 text-sm leading-tight">Asia Home Mart</p>
              <p className="text-xs text-gray-400">Quản lý hóa đơn</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => onTabChange(item.id)}
              className={`w-full nav-item ${activeTab === item.id ? 'nav-item-active' : 'nav-item-inactive'} 
                ${collapsed ? 'justify-center px-0' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <span className="shrink-0">{item.icon}</span>
              {!collapsed && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
              {!collapsed && item.badge && (
                <span className="ml-auto text-xs bg-white/20 px-1.5 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* DB Status indicator */}
        {!collapsed && (
          <div className="px-4 py-3 border-t border-gray-100 shrink-0">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
              isSupabaseConfigured ? 'bg-green-50' : 'bg-amber-50'
            }`}>
              <div className={`w-2 h-2 rounded-full shrink-0 ${
                isSupabaseConfigured ? 'bg-green-500' : 'bg-amber-500 animate-pulse'
              }`} />
              <span className={`text-xs font-medium ${
                isSupabaseConfigured ? 'text-green-700' : 'text-amber-700'
              }`}>
                {isSupabaseConfigured ? 'Supabase connected' : 'Demo mode'}
              </span>
            </div>
          </div>
        )}

        {/* Toggle button */}
        <button
          onClick={onToggle}
          className="hidden lg:flex items-center justify-center w-full py-4 border-t border-gray-100 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all"
        >
          {collapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
        </button>
      </aside>
    </>
  );
}

// ─── Mobile Header ─────────────────────────────────────────────────────────────
interface MobileHeaderProps {
  activeTab: Tab;
  onMenuOpen: () => void;
}

const tabLabels: Record<Tab, string> = {
  dashboard: 'Tổng quan',
  'invoice-new': 'Tạo hóa đơn',
  invoices: 'Hóa đơn',
  products: 'Sản phẩm',
  customers: 'Khách hàng',
  settings: 'Cài đặt',
};

export function MobileHeader({ activeTab, onMenuOpen }: MobileHeaderProps) {
  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 shadow-sm">
      <button
        onClick={onMenuOpen}
        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
      >
        <Menu className="w-5 h-5" />
      </button>
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 bg-gradient-to-br from-red-500 to-red-700 rounded-lg flex items-center justify-center shrink-0">
          <ShoppingBag className="w-4 h-4 text-white" />
        </div>
        <div>
          <span className="text-sm font-bold text-gray-900">Asia Home Mart</span>
          <span className="text-gray-300 mx-1">·</span>
          <span className="text-sm text-gray-500">{tabLabels[activeTab]}</span>
        </div>
      </div>
    </header>
  );
}
