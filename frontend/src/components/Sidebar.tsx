import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Building,
  MessageSquareText,
  CalendarDays,
  Users,
  UserCheck,
  ShieldCheck,
  Sparkles,
  CreditCard,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  if (!user) return null;

  const role = user.role;

  const getDashboardPath = () => {
    if (role === 'ADMIN') return '/admin';
    if (role === 'AGENT') return '/agent';
    return '/client';
  };

  const navItems = [
    {
      to: getDashboardPath(),
      label: 'Executive Overview',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'AGENT', 'CLIENT'],
    },
    {
      to: '/properties',
      label: 'Property Catalog',
      icon: Building,
      roles: ['ADMIN', 'AGENT', 'CLIENT'],
    },
    {
      to: '/inquiries',
      label: 'Inquiry Center',
      icon: MessageSquareText,
      roles: ['ADMIN', 'AGENT', 'CLIENT'],
    },
    {
      to: '/transactions',
      label: 'Transactions & Deals',
      icon: CreditCard,
      roles: ['ADMIN', 'AGENT', 'CLIENT'],
    },
    {
      to: '/agents',
      label: 'Agent Directory',
      icon: UserCheck,
      roles: ['ADMIN', 'AGENT', 'CLIENT'],
    },
    {
      to: '/appointments',
      label: 'Viewing Tours',
      icon: CalendarDays,
      roles: ['ADMIN', 'AGENT', 'CLIENT'],
    },
    {
      to: '/users',
      label: 'User Management',
      icon: Users,
      roles: ['ADMIN'],
    },
    {
      to: '/profile',
      label: 'Account Settings',
      icon: UserCheck,
      roles: ['ADMIN', 'AGENT', 'CLIENT'],
    },
  ];

  const visibleItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="w-64 bg-[#14171A] text-stone-300 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between shrink-0 border-r border-stone-800">
      <div className="space-y-6">
        <div>
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-3 mb-2">
            Navigation Menu
          </p>
          <nav className="space-y-1">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                      isActive
                        ? 'bg-forest-700 text-white shadow-sm'
                        : 'text-stone-300 hover:bg-stone-800/80 hover:text-white'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="space-y-3">
        <div className="p-3.5 bg-stone-900/90 rounded-2xl border border-stone-800/80 text-xs space-y-1.5">
          <div className="flex items-center gap-1.5 text-stone-200 font-semibold">
            <ShieldCheck className="w-4 h-4 text-forest-400" />
            <span>EstateCore Engine</span>
          </div>
          <p className="text-[11px] text-stone-400">Production REST API v1.0</p>
          <div className="pt-1.5 border-t border-stone-800 flex items-center justify-between text-[10px] text-stone-400">
            <span>MySQL 8.4</span>
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
        </div>
      </div>
    </aside>
  );
};
