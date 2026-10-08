import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from './api/client';
import { Contact, ContactStats, Pagination, LeadStatus } from './types';
import { Navbar } from './components/Navbar';
import { StatsCards } from './components/StatsCards';
import { ContactsTable } from './components/ContactsTable';
import { ContactDetailModal } from './components/ContactDetailModal';
import { TestLeadModal } from './components/TestLeadModal';
import { LoginModal } from './components/LoginModal';

export const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);

  const [stats, setStats] = useState<ContactStats>({
    total: 0,
    new: 0,
    contacting: 0,
    completed: 0,
    archived: 0,
    responseRate: 0,
  });

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 15,
    totalPages: 1,
  });

  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isTestModalOpen, setIsTestModalOpen] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Check auth on mount
  useEffect(() => {
    apiClient.verifyAuth().then(authed => {
      setIsAuthenticated(authed);
      setIsCheckingAuth(false);
    });
  }, []);

  const loadData = useCallback(async (pageToLoad = pagination.page) => {
    try {
      setIsRefreshing(true);
      const [newStats, contactsRes] = await Promise.all([
        apiClient.getStats(),
        apiClient.getContacts({
          status: selectedStatus,
          search: searchQuery,
          page: pageToLoad,
          limit: pagination.limit,
        }),
      ]);
      setStats(newStats);
      setContacts(contactsRes.data);
      setPagination(contactsRes.pagination);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [selectedStatus, searchQuery, pagination.limit, pagination.page]);

  useEffect(() => {
    if (isAuthenticated) {
      loadData(1);
    }
  }, [isAuthenticated, selectedStatus, searchQuery]);

  const handleQuickStatusChange = async (id: string, newStatus: LeadStatus) => {
    try {
      const updated = await apiClient.updateContact(id, { status: newStatus });
      setContacts(prev => prev.map(c => (c.id === id ? updated : c)));
      const newStats = await apiClient.getStats();
      setStats(newStats);
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleUpdateContact = async (
    id: string,
    updates: { status?: LeadStatus; notes?: string }
  ) => {
    const updated = await apiClient.updateContact(id, updates);
    setContacts(prev => prev.map(c => (c.id === id ? updated : c)));
    setSelectedContact(updated);
    const newStats = await apiClient.getStats();
    setStats(newStats);
  };

  const handleDeleteContact = async (id: string) => {
    await apiClient.deleteContact(id);
    setContacts(prev => prev.filter(c => c.id !== id));
    const newStats = await apiClient.getStats();
    setStats(newStats);
  };

  const handleLogout = () => {
    apiClient.clearToken();
    setIsAuthenticated(false);
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-[#ededed] flex flex-col font-sans selection:bg-neutral-800 selection:text-white">
      {/* Login Gate */}
      {!isAuthenticated && (
        <LoginModal
          onLoginSuccess={() => {
            setIsAuthenticated(true);
          }}
        />
      )}

      {/* Admin Dashboard */}
      {isAuthenticated && (
        <>
          <Navbar
            onOpenTestModal={() => setIsTestModalOpen(true)}
            onExportCsv={() => apiClient.downloadCsv()}
            onLogout={handleLogout}
            onRefresh={() => loadData()}
            isRefreshing={isRefreshing}
          />

          <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
            {/* KPI Cards */}
            <StatsCards
              stats={stats}
              selectedStatus={selectedStatus}
              onSelectStatus={setSelectedStatus}
            />

            {/* Contacts Table & Controls */}
            <ContactsTable
              contacts={contacts}
              pagination={pagination}
              selectedStatus={selectedStatus}
              onSelectStatus={setSelectedStatus}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onPageChange={newPage => loadData(newPage)}
              onViewContact={setSelectedContact}
              onQuickStatusChange={handleQuickStatusChange}
              onDeleteContact={handleDeleteContact}
              onOpenTestModal={() => setIsTestModalOpen(true)}
            />
          </main>

          {/* Contact Detail Modal */}
          <ContactDetailModal
            contact={selectedContact}
            onClose={() => setSelectedContact(null)}
            onUpdate={handleUpdateContact}
            onDelete={handleDeleteContact}
          />

          {/* Test Lead Ingestion Modal */}
          <TestLeadModal
            isOpen={isTestModalOpen}
            onClose={() => setIsTestModalOpen(false)}
            onSuccess={() => {
              loadData(1);
            }}
          />

          {/* Footer note */}
          <footer className="border-t border-neutral-900 py-6 text-center text-xs text-neutral-400 font-mono">
            ViezAI Ingestion Admin • Lightweight SQLite Architecture • SOC2 Type II Native
          </footer>
        </>
      )}
    </div>
  );
};
