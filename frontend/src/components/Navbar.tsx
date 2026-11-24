import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Building2, LogOut, User as UserIcon, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from './ui/Badge';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  const getRoleBadgeVariant = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return 'amber' as const;
      case 'AGENT':
        return 'forest' as const;
      default:
        return 'stone' as const;
    }
  };

  return (
    <header className="h-16 bg-white border-b border-stone-200/90 sticky top-0 z-30 px-4 md:px-6 flex items-center justify-between shadow-subtle">
      {/* Brand & public portal link */}
      <div className="flex items-center space-x-4">
        <Link to="/" className="flex items-center space-x-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-forest-700 text-white flex items-center justify-center font-bold text-base shadow-sm group-hover:bg-forest-800 transition">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <span className="font-serif font-bold text-lg tracking-tight text-stone-900">EstateCore</span>
            <span className="hidden sm:inline-block ml-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-stone-100 text-stone-600 border border-stone-200">
              Workspace
            </span>
          </div>
        </Link>

        <Link
          to="/properties"
          className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 transition pl-4 border-l border-stone-200"
        >
          <span>View Public Catalog</span>
          <ExternalLink className="w-3 h-3 text-stone-400" />
        </Link>
      </div>

      {/* User profile & actions */}
      {user && (
        <div className="flex items-center space-x-3 md:space-x-4">
          <div className="flex flex-col items-end text-right">
            <div className="flex items-center space-x-2">
              <span className="text-xs md:text-sm font-bold text-stone-900">{user.fullName}</span>
              <Badge variant={getRoleBadgeVariant(user.role)}>
                {user.role}
              </Badge>
            </div>
            <span className="text-[11px] text-stone-500 hidden sm:block">{user.email}</span>
          </div>

          <Link
            to="/profile"
            className="p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition"
            title="Account Profile"
          >
            <UserIcon className="w-4 h-4" />
          </Link>

          <button
            onClick={logout}
            className="flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 rounded-xl transition border border-stone-200 hover:border-red-200"
            title="Sign out of system"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Sign Out</span>
          </button>
        </div>
      )}
    </header>
  );
};
