import React from 'react';

interface StatusBadgeProps {
  status: string;
  type?: 'property' | 'inquiry' | 'appointment' | 'role' | 'boolean';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type }) => {
  const getBadgeStyle = () => {
    switch (status) {
      case 'AVAILABLE':
      case 'CONFIRMED':
      case 'QUALIFIED':
      case 'true':
      case 'Active':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'PENDING':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'RESERVED':
      case 'CONTACTED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'COMPLETED':
      case 'CLOSED':
      case 'SOLD':
      case 'RENTED':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'CANCELLED':
      case 'false':
      case 'Inactive':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'ADMIN':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'AGENT':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'CLIENT':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getBadgeStyle()}`}
    >
      {status === 'true' ? 'Active' : status === 'false' ? 'Inactive' : status}
    </span>
  );
};
