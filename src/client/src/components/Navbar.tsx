import React from 'react';
import { Shield, Database, Plus, Download, LogOut, Terminal, RefreshCw } from 'lucide-react';

interface NavbarProps {
  onOpenTestModal: () => void;
  onExportCsv: () => void;
  onLogout: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenTestModal,
  onExportCsv,
  onLogout,
  onRefresh,
  isRefreshing,
}) => {
  return (
    <header className="border-b border-neutral-800 bg-[#0c0c0e]/80 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Badge */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 p-[1px] flex items-center justify-center shadow-lg shadow-emerald-950/40">
              <div className="w-full h-full bg-black rounded-[7px] flex items-center justify-center">
                <Terminal className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white tracking-tight text-base">ViezAI</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  Admin Portal
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">Lead Ingestion & Pipeline Manager</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 pl-4 border-l border-neutral-800 text-xs text-neutral-400">
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-neutral-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              SQLite Database Connected
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onRefresh}
            title="Refresh leads data"
            className="p-2 text-neutral-400 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
          </button>

          <button
            onClick={onExportCsv}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-300 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>

          <button
            onClick={onOpenTestModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-all shadow-sm shadow-emerald-950/50"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Simulate Lead</span>
          </button>

          <button
            onClick={onLogout}
            title="Lock session / Logout"
            className="p-2 text-neutral-400 hover:text-red-400 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg transition-colors ml-1"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
