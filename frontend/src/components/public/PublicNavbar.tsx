import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Building2, Menu, X, ArrowRight, User as UserIcon, LogOut } from 'lucide-react';
import { Button } from '../ui/Button';

export const PublicNavbar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardLink = () => {
    if (!user) return '/login';
    if (user.role === 'ADMIN') return '/admin';
    if (user.role === 'AGENT') return '/agent';
    return '/client';
  };

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Properties', href: '/properties' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-stone-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-forest-700 text-white flex items-center justify-center shadow-subtle group-hover:bg-forest-800 transition-colors">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-serif font-bold text-xl tracking-tight text-stone-900 group-hover:text-forest-700 transition-colors">
              Estate<span className="text-forest-700">Core</span>
            </span>
            <span className="text-[10px] uppercase font-mono tracking-widest text-stone-600 -mt-0.5">
              Real Estate Platform
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.href;
            return (
              <Link
                key={link.href}
                to={link.href}
                className={`text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-forest-700 font-semibold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Action Buttons */}
        <div className="hidden md:flex items-center space-x-3">
          {user ? (
            <div className="flex items-center space-x-2">
              <Link to={getDashboardLink()}>
                <Button size="sm" className="bg-forest-700 hover:bg-forest-800">
                  <UserIcon className="w-3.5 h-3.5 mr-1" />
                  <span>Dashboard ({user.role})</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 text-stone-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition border border-stone-200"
                title="Sign out of system"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-stone-700 hover:bg-stone-100 rounded-lg transition"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-stone-200 bg-white px-6 py-5 space-y-4 shadow-elevated animate-in slide-in-from-top-2 duration-150">
          <nav className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-medium text-stone-800 hover:text-forest-700 py-1"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="pt-4 border-t border-stone-100 flex flex-col gap-2">
            {user ? (
              <Link to={getDashboardLink()} onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full">Go to Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full">Sign In</Button>
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full">Register Account</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
