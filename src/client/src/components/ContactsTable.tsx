import React, { useState } from 'react';
import {
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2,
  Copy,
  Check,
  Building,
  Mail,
  Calendar,
  Layers,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { Contact, Pagination, LeadStatus } from '../types';

interface ContactsTableProps {
  contacts: Contact[];
  pagination: Pagination;
  selectedStatus: string;
  onSelectStatus: (status: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onPageChange: (page: number) => void;
  onViewContact: (contact: Contact) => void;
  onQuickStatusChange: (id: string, newStatus: LeadStatus) => void;
  onDeleteContact: (id: string) => void;
  onOpenTestModal: () => void;
}

export const ContactsTable: React.FC<ContactsTableProps> = ({
  contacts,
  pagination,
  selectedStatus,
  onSelectStatus,
  searchQuery,
  onSearchChange,
  onPageChange,
  onViewContact,
  onQuickStatusChange,
  onDeleteContact,
  onOpenTestModal,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyEmail = (e: React.MouseEvent, email: string, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(email);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusBadge = (status: LeadStatus) => {
    switch (status) {
      case 'new':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            New
          </span>
        );
      case 'contacting':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            Contacting
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            Completed
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-800 text-neutral-400 border border-neutral-700">
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
            Archived
          </span>
        );
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const statusTabs = [
    { id: 'all', label: 'All Leads' },
    { id: 'new', label: 'New' },
    { id: 'contacting', label: 'In Contact' },
    { id: 'completed', label: 'Completed' },
    { id: 'archived', label: 'Archived' },
  ];

  return (
    <div className="bg-[#0c0c0e] border border-neutral-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Table Controls Bar */}
      <div className="p-4 border-b border-neutral-800/80 flex flex-col md:flex-row gap-3.5 items-center justify-between">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-neutral-900/90 rounded-lg border border-neutral-800 w-full md:w-auto overflow-x-auto">
          {statusTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onSelectStatus(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                selectedStatus === tab.id
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search leads, email, company..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-neutral-400 focus:outline-none focus:border-neutral-600 transition-colors"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        {contacts.length === 0 ? (
          <div className="py-16 text-center px-4">
            <div className="w-12 h-12 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto mb-3">
              <MessageSquare className="w-5 h-5 text-neutral-400" />
            </div>
            <h3 className="text-sm font-medium text-neutral-300 mb-1">No contact submissions found</h3>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto mb-4">
              {searchQuery
                ? `No submissions matched your search query "${searchQuery}".`
                : 'Your contact form submissions from the landing page will appear here.'}
            </p>
            <button
              onClick={onOpenTestModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-400 bg-emerald-950/30 border border-emerald-800/50 hover:bg-emerald-900/40 rounded-lg transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Send a Test Lead Now
            </button>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-900/50 border-b border-neutral-800/80 text-neutral-400 uppercase tracking-wider font-mono text-[10px]">
              <tr>
                <th className="px-4 py-3">Lead Contact</th>
                <th className="px-4 py-3">Company & Scope</th>
                <th className="px-4 py-3">Agent Need</th>
                <th className="px-4 py-3">Message Excerpt</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Received</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {contacts.map(contact => {
                const isCopied = copiedId === contact.id;

                return (
                  <tr
                    key={contact.id}
                    onClick={() => onViewContact(contact)}
                    className="hover:bg-neutral-900/40 transition-colors cursor-pointer group"
                  >
                    {/* Lead Contact */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xs font-semibold text-neutral-200 uppercase font-mono">
                          {contact.full_name ? contact.full_name.charAt(0) : 'U'}
                        </div>
                        <div>
                          <div className="font-medium text-white group-hover:text-emerald-400 transition-colors">
                            {contact.full_name}
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-neutral-400 font-mono">
                            <span>{contact.email}</span>
                            <button
                              onClick={e => handleCopyEmail(e, contact.email, contact.id)}
                              className="text-neutral-400 hover:text-white transition-colors"
                              title="Copy email"
                            >
                              {isCopied ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Company */}
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-neutral-300">
                        {contact.company || <span className="text-neutral-600 italic">Not specified</span>}
                      </div>
                      {contact.team_size && (
                        <div className="text-[11px] text-neutral-400 font-mono">
                          {contact.team_size} members
                        </div>
                      )}
                    </td>

                    {/* Need */}
                    <td className="px-4 py-3.5">
                      <span className="inline-block px-2 py-0.5 rounded bg-neutral-800/70 border border-neutral-700/60 text-neutral-300 text-[11px] font-mono">
                        {contact.need || 'General Advisory'}
                      </span>
                    </td>

                    {/* Message */}
                    <td className="px-4 py-3.5 max-w-xs">
                      <p className="truncate text-neutral-400 text-xs">
                        {contact.message || <span className="text-neutral-600 italic">No message</span>}
                      </p>
                      {contact.notes && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-mono mt-0.5">
                          • Has Admin Note
                        </span>
                      )}
                    </td>

                    {/* Status Dropdown */}
                    <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                      <select
                        value={contact.status}
                        onChange={e =>
                          onQuickStatusChange(contact.id, e.target.value as LeadStatus)
                        }
                        className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-200 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-neutral-600 font-sans"
                      >
                        <option value="new">🟢 New</option>
                        <option value="contacting">🔵 Contacting</option>
                        <option value="completed">🟣 Completed</option>
                        <option value="archived">⚪ Archived</option>
                      </select>
                    </td>

                    {/* Received Date */}
                    <td className="px-4 py-3.5 font-mono text-[11px] text-neutral-400 whitespace-nowrap">
                      {formatDate(contact.created_at)}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => onViewContact(contact)}
                          title="View Details"
                          className="p-1.5 text-neutral-400 hover:text-white bg-neutral-900 hover:bg-neutral-800 rounded-md transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteContact(contact.id)}
                          title="Delete Lead"
                          className="p-1.5 text-neutral-400 hover:text-red-400 bg-neutral-900 hover:bg-neutral-800 rounded-md transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer */}
      {contacts.length > 0 && (
        <div className="px-4 py-3 border-t border-neutral-800/80 bg-neutral-900/30 flex items-center justify-between text-xs text-neutral-400">
          <div>
            Showing{' '}
            <span className="font-mono text-neutral-200">
              {(pagination.page - 1) * pagination.limit + 1}
            </span>{' '}
            to{' '}
            <span className="font-mono text-neutral-200">
              {Math.min(pagination.page * pagination.limit, pagination.total)}
            </span>{' '}
            of <span className="font-mono text-neutral-200">{pagination.total}</span> leads
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => onPageChange(pagination.page - 1)}
              className="p-1.5 rounded-md bg-neutral-900 border border-neutral-800 text-neutral-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-neutral-300">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => onPageChange(pagination.page + 1)}
              className="p-1.5 rounded-md bg-neutral-900 border border-neutral-800 text-neutral-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-800 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
