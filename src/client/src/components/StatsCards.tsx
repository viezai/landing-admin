import React from 'react';
import { Users, AlertCircle, PhoneCall, CheckCircle, TrendingUp } from 'lucide-react';
import { ContactStats } from '../types';

interface StatsCardsProps {
  stats: ContactStats;
  selectedStatus: string;
  onSelectStatus: (status: string) => void;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  stats,
  selectedStatus,
  onSelectStatus,
}) => {
  const cards = [
    {
      id: 'all',
      title: 'Total Ingested Leads',
      value: stats.total,
      icon: Users,
      color: 'text-neutral-200',
      bgColor: 'bg-neutral-900/80',
      borderColor: 'border-neutral-800',
      activeBorder: 'ring-1 ring-neutral-400',
      desc: 'All recorded submissions',
    },
    {
      id: 'new',
      title: 'New / Unprocessed',
      value: stats.new,
      icon: AlertCircle,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-950/20',
      borderColor: 'border-emerald-800/40',
      activeBorder: 'ring-1 ring-emerald-500',
      desc: 'Pending first reply',
      pulse: stats.new > 0,
    },
    {
      id: 'contacting',
      title: 'In Active Discussion',
      value: stats.contacting,
      icon: PhoneCall,
      color: 'text-blue-400',
      bgColor: 'bg-blue-950/20',
      borderColor: 'border-blue-800/40',
      activeBorder: 'ring-1 ring-blue-500',
      desc: 'Engaged with team',
    },
    {
      id: 'completed',
      title: 'Qualified / Completed',
      value: stats.completed,
      icon: CheckCircle,
      color: 'text-purple-400',
      bgColor: 'bg-purple-950/20',
      borderColor: 'border-purple-800/40',
      activeBorder: 'ring-1 ring-purple-500',
      desc: 'Closed or converted',
    },
    {
      id: 'rate',
      title: 'Response / Engagement',
      value: `${stats.responseRate}%`,
      icon: TrendingUp,
      color: 'text-amber-400',
      bgColor: 'bg-amber-950/20',
      borderColor: 'border-amber-800/40',
      activeBorder: '',
      desc: 'Responded vs Total',
      isMetricOnly: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-6">
      {cards.map(card => {
        const Icon = card.icon;
        const isSelected = selectedStatus === card.id;

        return (
          <div
            key={card.id}
            onClick={() => {
              if (!card.isMetricOnly) {
                onSelectStatus(card.id);
              }
            }}
            className={`p-4 rounded-xl border ${card.bgColor} ${card.borderColor} ${
              !card.isMetricOnly ? 'cursor-pointer hover:border-neutral-600 transition-all' : ''
            } ${isSelected ? card.activeBorder : ''} relative overflow-hidden`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-neutral-400">{card.title}</span>
              <Icon className={`w-4 h-4 ${card.color}`} />
            </div>

            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-2xl font-bold font-mono tracking-tight text-white">
                {card.value}
              </span>
              {card.pulse && (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              )}
            </div>

            <p className="text-[11px] text-neutral-400 font-sans">{card.desc}</p>
          </div>
        );
      })}
    </div>
  );
};
