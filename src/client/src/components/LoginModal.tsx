import React, { useState } from 'react';
import { Lock, Shield, KeyRound, AlertCircle, ArrowRight } from 'lucide-react';
import { apiClient } from '../api/client';

interface LoginModalProps {
  onLoginSuccess: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess }) => {
  const [adminKey, setAdminKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminKey.trim()) return;

    setIsLoading(true);
    setError(null);

    const res = await apiClient.login(adminKey.trim());
    if (res.success) {
      onLoginSuccess();
    } else {
      setError(res.error || 'Invalid credentials');
    }
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-sm bg-[#0e0e11] border border-neutral-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-emerald-500/10 blur-2xl rounded-full pointer-events-none" />

        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-emerald-400 mb-3 shadow-lg">
            <Lock className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-semibold text-white tracking-tight">ViezAI Admin Access</h2>
          <p className="text-xs text-neutral-400 mt-1 max-w-xs">
            Authenticate using the configured Admin Secret Key to manage contact submissions.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-neutral-300 text-xs font-medium mb-1.5 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-neutral-400" />
              Admin Secret Key
            </label>
            <input
              type="password"
              autoFocus
              placeholder="Enter ADMIN_SECRET_KEY..."
              value={adminKey}
              onChange={e => setAdminKey(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 font-mono transition-colors"
            />
            <p className="text-[11px] text-neutral-400 mt-1.5 font-mono">
              Default env key: <code className="text-neutral-300">viezai_admin_secret_2026</code>
            </p>
          </div>

          {error && (
            <div className="p-2.5 rounded-lg bg-red-950/30 border border-red-800/50 flex items-center gap-2 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !adminKey.trim()}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-emerald-950/50 cursor-pointer"
          >
            <span>{isLoading ? 'Verifying...' : 'Authenticate'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
