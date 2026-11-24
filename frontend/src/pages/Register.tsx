import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building2, Lock, Mail, User, AlertCircle, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const Register: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await register(fullName, email, password);
      navigate('/client');
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-forest-100 selection:text-forest-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center space-x-2.5 group mb-4">
          <div className="w-11 h-11 rounded-2xl bg-forest-700 text-white flex items-center justify-center font-bold text-xl shadow-md group-hover:bg-forest-800 transition">
            <Building2 className="w-6 h-6" />
          </div>
          <div className="text-left">
            <span className="font-serif font-bold text-2xl tracking-tight text-stone-900 block leading-tight">
              EstateCore
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-forest-700 block">
              Client Onboarding
            </span>
          </div>
        </Link>
        <h2 className="text-2xl font-serif font-bold tracking-tight text-stone-900">
          Create Client Account
        </h2>
        <p className="mt-1 text-sm text-stone-500">
          Sign up to schedule private property tours and submit inquiries.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-card border border-stone-200/90 rounded-3xl sm:px-10">
          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="font-medium leading-relaxed">{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Full Legal Name
              </label>
              <div className="relative rounded-xl shadow-subtle">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="block w-full pl-10 pr-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-forest-600 focus:border-forest-600 transition"
                  placeholder="Juan Dela Cruz"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Email Address
              </label>
              <div className="relative rounded-xl shadow-subtle">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-forest-600 focus:border-forest-600 transition"
                  placeholder="juan@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Account Password
              </label>
              <div className="relative rounded-xl shadow-subtle">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-forest-600 focus:border-forest-600 transition"
                  placeholder="Minimum 6 characters"
                />
              </div>
            </div>

            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 text-[11px] text-stone-600 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-stone-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-forest-700" />
                <span>Default Role: CLIENT</span>
              </div>
              <p>
                Self-registration grants client viewing and inquiry privileges. Real Estate Agent and Administrator roles are assigned internally.
              </p>
            </div>

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="w-full py-3 shadow-md mt-2 font-semibold"
            >
              <span>Complete Registration</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-stone-100 text-center space-y-2">
            <p className="text-xs text-stone-500">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-forest-700 hover:underline">
                Sign in here
              </Link>
            </p>
            <div>
              <Link to="/" className="text-xs text-stone-400 hover:text-stone-700 transition">
                ← Return to Public Homepage
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
