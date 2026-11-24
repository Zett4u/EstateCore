import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Badge } from './ui/Badge';

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  badge?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
}) => {
  return (
    <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-subtle hover:shadow-card hover:border-stone-300 transition duration-200">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">{title}</span>
        <div className="w-9 h-9 rounded-xl bg-forest-50 text-forest-700 flex items-center justify-center">
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="flex items-baseline space-x-2">
        <span className="text-2xl md:text-3xl font-serif font-bold text-stone-900 tracking-tight">{value}</span>
        {badge && (
          <Badge variant="forest">
            {badge}
          </Badge>
        )}
      </div>
      {subtitle && <p className="text-xs text-stone-500 mt-1.5">{subtitle}</p>}
    </div>
  );
};
