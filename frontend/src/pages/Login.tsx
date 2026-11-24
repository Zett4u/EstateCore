import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building2, Lock, Mail, AlertCircle, ArrowRight, ShieldCheck, Check } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await login(email, password);
      if (user.role === 'ADMIN') navigate('/admin');
      else if (user.role === 'AGENT') navigate('/agent');
      else navigate('/client');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillQuick = (testEmail: string) => {
    setEmail(testEmail);
    setPassword('Password123!');
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
              Management Portal
            </span>
          </div>
        </Link>
        <h2 className="text-2xl font-serif font-bold tracking-tight text-stone-900">
          Sign In to Your Account
        </h2>
        <p className="mt-1 text-sm text-stone-500">
          Access your real estate portfolio, client inquiries, and viewing tours.
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

          <form onSubmit={handleLogin} className="space-y-4">
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
                  placeholder="name@estatecore.local"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                  Password
                </label>
              </div>
              <div className="relative rounded-xl shadow-subtle">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-forest-600 focus:border-forest-600 transition"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="w-full py-3 shadow-md mt-2 font-semibold"
            >
              <span>Sign In to Portal</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>

          {/* Quick Demo Autofill */}
          <div className="mt-8 pt-6 border-t border-stone-100">
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                Demo Evaluation Accounts
              </p>
              <span className="text-[10px] text-stone-400 font-mono">ITEC 116</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => fillQuick('admin@estatecore.local')}
                className="py-1.5 px-2 text-center rounded-xl border border-stone-200 bg-stone-50 hover:bg-forest-50 hover:border-forest-300 hover:text-forest-900 text-stone-700 font-semibold transition"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => fillQuick('maria.santos@estatecore.local')}
                className="py-1.5 px-2 text-center rounded-xl border border-stone-200 bg-stone-50 hover:bg-forest-50 hover:border-forest-300 hover:text-forest-900 text-stone-700 font-semibold transition"
              >
                Agent
              </button>
              <button
                type="button"
                onClick={() => fillQuick('juan.delacruz@client.local')}
                className="py-1.5 px-2 text-center rounded-xl border border-stone-200 bg-stone-50 hover:bg-forest-50 hover:border-forest-300 hover:text-forest-900 text-stone-700 font-semibold transition"
              >
                Client
              </button>
            </div>
            <p className="text-[11px] text-stone-400 mt-2 text-center">
              Clicking an account fills verified seed credentials with password <code className="text-stone-600">Password123!</code>
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-stone-100 text-center">
            <p className="text-xs text-stone-500">
              Don't have a client account?{' '}
              <Link to="/register" className="font-semibold text-forest-700 hover:underline">
                Create one now
              </Link>
            </p>
            <div className="mt-3">
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
