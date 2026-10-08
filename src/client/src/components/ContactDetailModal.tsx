import React, { useState } from 'react';
import {
  X,
  Mail,
  Building,
  User,
  Calendar,
  Layers,
  MessageSquare,
  FileText,
  Save,
  Trash2,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Terminal
} from 'lucide-react';
import { Contact, LeadStatus } from '../types';

interface ContactDetailModalProps {
  contact: Contact | null;
  onClose: () => void;
  onUpdate: (id: string, updates: { status?: LeadStatus; notes?: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const ContactDetailModal: React.FC<ContactDetailModalProps> = ({
  contact,
  onClose,
  onUpdate,
  onDelete,
}) => {
  if (!contact) return null;

  const [status, setStatus] = useState<LeadStatus>(contact.status);
  const [notes, setNotes] = useState<string>(contact.notes || '');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate(contact.id, { status, notes });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (err) {
      alert('Failed to save updates');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete lead from "${contact.full_name}"?`)) {
      await onDelete(contact.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#0e0e11] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-sm font-semibold text-emerald-400 font-mono">
              {contact.full_name ? contact.full_name.charAt(0) : 'U'}
            </div>
            <div>
              <h3 className="text-base font-semibold text-white tracking-tight">
                {contact.full_name}
              </h3>
              <p className="text-xs text-neutral-400 font-mono">{contact.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white bg-neutral-800/80 hover:bg-neutral-800 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
          {/* Status & Priority Ribbon */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-3.5 bg-neutral-900/80 border border-neutral-800 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="text-neutral-400 font-medium">Processing Status:</span>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as LeadStatus)}
                className="bg-black border border-neutral-700 text-white rounded-lg px-2.5 py-1 text-xs font-sans focus:outline-none focus:border-emerald-500"
              >
                <option value="new">🟢 New Lead</option>
                <option value="contacting">🔵 Contacting</option>
                <option value="completed">🟣 Completed / Qualified</option>
                <option value="archived">⚪ Archived</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={`mailto:${contact.email}?subject=ViezAI Enterprise Consultation Follow-up`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors font-medium"
              >
                <Mail className="w-3.5 h-3.5 text-emerald-400" />
                Reply via Email
              </a>
            </div>
          </div>

          {/* Company & Request Scope Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-neutral-900/40 border border-neutral-800/80 rounded-lg">
              <span className="text-neutral-400 block text-[11px] mb-1">Company</span>
              <span className="text-neutral-200 font-medium text-xs">
                {contact.company || 'Not specified'}
              </span>
            </div>

            <div className="p-3 bg-neutral-900/40 border border-neutral-800/80 rounded-lg">
              <span className="text-neutral-400 block text-[11px] mb-1">Agent Need</span>
              <span className="text-emerald-400 font-mono text-xs">
                {contact.need || 'General Advisory'}
              </span>
            </div>

            <div className="p-3 bg-neutral-900/40 border border-neutral-800/80 rounded-lg">
              <span className="text-neutral-400 block text-[11px] mb-1">Team Size</span>
              <span className="text-neutral-200 font-medium text-xs">
                {contact.team_size || 'N/A'}
              </span>
            </div>

            <div className="p-3 bg-neutral-900/40 border border-neutral-800/80 rounded-lg">
              <span className="text-neutral-400 block text-[11px] mb-1">Deployment Mode</span>
              <span className="text-neutral-200 font-medium text-xs">
                {contact.deployment_mode || 'N/A'}
              </span>
            </div>

            <div className="p-3 bg-neutral-900/40 border border-neutral-800/80 rounded-lg">
              <span className="text-neutral-400 block text-[11px] mb-1">Submitted At</span>
              <span className="text-neutral-300 font-mono text-[11px]">
                {new Date(contact.created_at).toLocaleString()}
              </span>
            </div>

            <div className="p-3 bg-neutral-900/40 border border-neutral-800/80 rounded-lg">
              <span className="text-neutral-400 block text-[11px] mb-1">Lead ID</span>
              <span className="text-neutral-400 font-mono text-[10px] truncate block" title={contact.id}>
                {contact.id}
              </span>
            </div>
          </div>

          {/* Lead Message */}
          <div>
            <label className="block text-neutral-400 font-medium mb-1.5 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-neutral-400" />
              Contact Message / Ingestion Payload
            </label>
            <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-200 text-xs whitespace-pre-wrap leading-relaxed font-sans min-h-[90px]">
              {contact.message || <span className="text-neutral-600 italic">No message was included in this submission.</span>}
            </div>
          </div>

          {/* Internal Notes Editor */}
          <div>
            <label className="block text-neutral-300 font-medium mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                Internal Team Notes
              </span>
              <span className="text-neutral-400 text-[11px]">Visible to team admins only</span>
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add internal notes about lead qualification, budget, next meeting..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-white placeholder-neutral-400 focus:outline-none focus:border-neutral-600 font-sans"
            />
          </div>

          {/* Technical Telemetry Card */}
          <div className="p-3 bg-neutral-950/60 border border-neutral-800/60 rounded-xl font-mono text-[11px] text-neutral-400 space-y-1">
            <div className="flex items-center gap-1.5 text-neutral-400 mb-1">
              <Terminal className="w-3 h-3 text-neutral-400" />
              <span>Ingestion Telemetry</span>
            </div>
            <div>
              <span className="text-neutral-400">Client IP:</span>{' '}
              <span className="text-neutral-300">{contact.ip_address || 'unknown'}</span>
            </div>
            <div className="truncate">
              <span className="text-neutral-400">User Agent:</span>{' '}
              <span className="text-neutral-300">{contact.user_agent || 'unknown'}</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-900/40 flex items-center justify-between">
          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-950/30 transition-colors text-xs font-medium"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Lead
          </button>

          <div className="flex items-center gap-3">
            {savedSuccess && (
              <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-mono">
                <CheckCircle2 className="w-3.5 h-3.5" /> Saved!
              </span>
            )}
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 transition-colors text-xs font-medium"
            >
              Close
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 transition-colors text-xs font-medium shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
