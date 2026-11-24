import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { UserCheck, Lock, Save, AlertCircle, CheckCircle, Shield, Mail } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

export const UserProfile: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setMessage(null);

    const payload: any = { fullName };
    if (password) payload.password = password;

    try {
      await api.updateUser(user.id, payload);
      await refreshUser();
      setMessage({ type: 'success', text: 'Account settings updated successfully!' });
      setPassword('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-stone-200">
        <span className="text-xs font-bold uppercase tracking-wider text-forest-700">Security & Credentials</span>
        <h1 className="text-3xl font-serif font-bold text-stone-900 tracking-tight mt-1">
          Account Profile & Security
        </h1>
        <p className="text-sm text-stone-600 mt-1">
          Manage your verified full name, password, and session credentials.
        </p>
      </div>

      <div className="bg-white border border-stone-200/90 rounded-2xl p-6 md:p-8 shadow-card space-y-6">
        {/* Profile Card Header */}
        <div className="flex items-center space-x-4 pb-6 border-b border-stone-100">
          <div className="w-16 h-16 rounded-2xl bg-forest-700 text-white font-serif font-bold text-2xl flex items-center justify-center shadow-md">
            {user?.fullName.charAt(0) || 'U'}
          </div>
          <div>
            <h2 className="text-lg font-serif font-bold text-stone-900">{user?.fullName}</h2>
            <p className="text-xs text-stone-500 flex items-center gap-1.5 mt-0.5">
              <Mail className="w-3.5 h-3.5 text-stone-400" />
              <span>{user?.email}</span>
            </p>
            <div className="mt-2">
              <Badge variant={user?.role === 'ADMIN' ? 'amber' : user?.role === 'AGENT' ? 'forest' : 'stone'}>
                Role: {user?.role}
              </Badge>
            </div>
          </div>
        </div>

        {message && (
          <div
            className={`p-3.5 rounded-xl flex items-center space-x-2.5 text-xs font-medium ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
              Display Full Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-forest-600 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
              Account Email (Immutable)
            </label>
            <input
              type="email"
              disabled
              value={user?.email || ''}
              className="w-full px-3.5 py-2.5 bg-stone-100 border border-stone-200 rounded-xl text-sm text-stone-500 cursor-not-allowed font-mono"
            />
          </div>

          <div className="pt-2 border-t border-stone-100">
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
              Update Password
            </label>
            <input
              type="password"
              placeholder="Leave blank to keep your current password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-forest-600 transition"
            />
            <p className="text-[11px] text-stone-400 mt-1">
              Minimum 6 characters with mixed letters and numbers recommended.
            </p>
          </div>

          <div className="pt-4 flex justify-end">
            <Button type="submit" variant="primary" loading={loading} className="px-6 shadow-md">
              <Save className="w-4 h-4 mr-2" />
              <span>Save Changes</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
