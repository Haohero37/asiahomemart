/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Asia Home Mart — Invoice Management System
 * Built with React + TypeScript + Tailwind CSS + Supabase
 */

import React, { useState, useCallback } from 'react';
import type { Tab } from './types';
import { Sidebar, MobileHeader } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { InvoiceForm } from './components/InvoiceForm';
import { InvoiceList } from './components/InvoiceList';
import { ProductsManager } from './components/ProductsManager';
import { CustomersManager } from './components/CustomersManager';
import { Settings } from './components/Settings';
import { ToastContainer, useToast } from './components/Toast';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandInvoiceId, setExpandInvoiceId] = useState<string | null>(null);
  const { toasts, showToast, dismissToast } = useToast();

  const handleTabChange = useCallback((tab: Tab) => {
    setActiveTab(tab);
    // On mobile, collapse sidebar after selection
    if (window.innerWidth < 1024) {
      setSidebarCollapsed(true);
    }
  }, []);

  const handleNewInvoice = useCallback(() => {
    setActiveTab('invoice-new');
    if (window.innerWidth < 1024) {
      setSidebarCollapsed(true);
    }
  }, []);

  const handleInvoiceCreated = useCallback((invoiceId: string) => {
    setActiveTab('invoices');
    if (window.innerWidth < 1024) {
      setSidebarCollapsed(true);
    }
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onNewInvoice={handleNewInvoice} />;
      case 'invoice-new':
        return (
          <InvoiceForm
            onSuccess={msg => showToast(msg, 'success')}
            onError={msg => showToast(msg, 'error')}
            showToast={showToast}
            onInvoiceCreated={handleInvoiceCreated}
          />
        );
      case 'invoices':
        return (
          <InvoiceList 
            showToast={showToast} 
            onNewInvoice={handleNewInvoice} 
            expandInvoiceId={expandInvoiceId} 
          />
        );
      case 'products':
        return <ProductsManager showToast={showToast} />;
      case 'customers':
        return <CustomersManager showToast={showToast} />;
      case 'settings':
        return <Settings showToast={showToast} />;
      default:
        return null;
    }
  };

  // Sidebar width calculations
  const sidebarWidth = sidebarCollapsed ? 72 : 256;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(c => !c)}
      />

      {/* Mobile header */}
      <MobileHeader
        activeTab={activeTab}
        onMenuOpen={() => setSidebarCollapsed(false)}
      />

      {/* Main content */}
      <main
        className={`transition-all duration-300 ease-in-out min-h-screen flex flex-col ${
          sidebarCollapsed ? 'lg:pl-[72px]' : 'lg:pl-64'
        }`}
      >
        <div className="flex-1 px-4 py-6 pb-20 lg:px-8 lg:py-8 pt-20 lg:pt-8 max-w-[1400px] w-full mx-auto">
          {renderContent()}
        </div>
      </main>

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
