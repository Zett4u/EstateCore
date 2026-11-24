import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Building2, LogOut, User as UserIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  const getRoleBadgeClass = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'AGENT':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 px-6 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <Link to="/" className="flex items-center space-x-2 text-slate-900 group">
          <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm group-hover:bg-blue-700 transition">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight text-slate-900">EstateCore</span>
            <span className="hidden sm:inline-block ml-2 text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
              ITEC 116
            </span>
          </div>
        </Link>
      </div>

      {user && (
        <div className="flex items-center space-x-4">
          <div className="hidden sm:flex flex-col items-end">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-semibold text-slate-800">{user.fullName}</span>
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${getRoleBadgeClass(user.role)}`}>
                {user.role}
              </span>
            </div>
            <span className="text-xs text-slate-500">{user.email}</span>
          </div>

          <Link
            to="/profile"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
            title="Profile"
          >
            <UserIcon className="w-5 h-5" />
          </Link>

          <button
            onClick={logout}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition border border-transparent hover:border-red-200"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden md:inline">Sign Out</span>
          </button>
        </div>
      )}
    </header>
  );
};
