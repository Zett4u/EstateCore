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
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'AGENT', 'CLIENT'],
    },
    {
      to: '/properties',
      label: 'Properties',
      icon: Building,
      roles: ['ADMIN', 'AGENT', 'CLIENT'],
    },
    {
      to: '/inquiries',
      label: 'Inquiries',
      icon: MessageSquareText,
      roles: ['ADMIN', 'AGENT', 'CLIENT'],
    },
    {
      to: '/appointments',
      label: 'Appointments',
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
      label: 'Account Profile',
      icon: UserCheck,
      roles: ['ADMIN', 'AGENT', 'CLIENT'],
    },
  ];

  const visibleItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between shrink-0">
      <div className="space-y-6">
        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
            Main Navigation
          </p>
          <nav className="space-y-1">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
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

      <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700/60 text-xs space-y-1">
        <p className="text-slate-400">Connected System:</p>
        <p className="font-semibold text-white">EstateCore v1.0.0</p>
        <p className="text-[10px] text-slate-400">MySQL 8.4 • NestJS • JWT</p>
      </div>
    </aside>
  );
};
