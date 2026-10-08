import React, { useState } from 'react';
import { X, Send, Sparkles, ShieldAlert, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiClient } from '../api/client';

interface TestLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const TestLeadModal: React.FC<TestLeadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  if (!isOpen) return null;

  const [fullName, setFullName] = useState('Dr. Bruce Wayne');
  const [email, setEmail] = useState('bruce@wayne-enterprises.com');
  const [company, setCompany] = useState('Wayne Enterprises Gotham');
  const [need, setNeed] = useState('autonomous-coding');
  const [teamSize, setTeamSize] = useState('101-500');
  const [deploymentMode, setDeploymentMode] = useState('private-vpc');
  const [message, setMessage] = useState('We require an autonomous AI agent swarm to manage infrastructure deployments and automated security patching in our private air-gapped datacenter.');
  const [isBotTrap, setIsBotTrap] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setResult(null);

    try {
      const payload: any = {
        fullName,
        email,
        company,
        need,
        teamSize,
        deploymentMode,
        message,
      };

      if (isBotTrap) {
        payload.honeypot = 'http://spammer-bot-link.xyz';
      }

      const res = await apiClient.submitTestLead(payload);
      setResult({
        success: true,
        message: isBotTrap
          ? 'Honeypot Triggered! Bot trap simulated — response returned 200 without writing to database.'
          : res.message || 'Lead ingested successfully into SQLite database!',
      });
      if (!isBotTrap) {
        onSuccess();
      }
    } catch (err: any) {
      setResult({
        success: false,
        message: err.message || 'Submission failed',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#0e0e11] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-tight">
                Simulate Contact Form Lead
              </h3>
              <p className="text-[11px] text-neutral-400">
                Directly calls POST /api/contacts ingestion API
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white bg-neutral-800/80 hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-300 font-medium mb-1">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-neutral-300 font-medium mb-1">Business Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-300 font-medium mb-1">Company</label>
              <input
                type="text"
                value={company}
                onChange={e => setCompany(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-neutral-300 font-medium mb-1">Agent Need</label>
              <select
                value={need}
                onChange={e => setNeed(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-sans"
              >
                <option value="autonomous-coding">Autonomous Coding Agents</option>
                <option value="security-guardrails">Security & Guardrails</option>
                <option value="private-vpc">Private LLM / VPC Deployment</option>
                <option value="workflow-integration">Enterprise Integration</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-neutral-300 font-medium mb-1">Message</label>
            <textarea
              rows={3}
              value={message}
              onChange={e => setMessage(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-sans"
            />
          </div>

          {/* Bot Honeypot Simulator Toggle */}
          <div className="p-3 bg-neutral-900/60 border border-neutral-800 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className={`w-4 h-4 ${isBotTrap ? 'text-amber-400' : 'text-neutral-500'}`} />
              <div>
                <span className="text-neutral-200 font-medium block text-xs">Simulate Bot Honeypot</span>
                <span className="text-neutral-400 text-[11px]">Injects hidden field to test anti-spam trap</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isBotTrap}
              onChange={e => setIsBotTrap(e.target.checked)}
              className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
            />
          </div>

          {result && (
            <div
              className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
                result.success
                  ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300'
                  : 'bg-red-950/30 border-red-800/50 text-red-300'
              }`}
            >
              {result.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              )}
              <span>{result.message}</span>
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-neutral-400 hover:text-white bg-neutral-800 text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-xs font-medium transition-colors shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              {isSubmitting ? 'Sending...' : 'Send Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
