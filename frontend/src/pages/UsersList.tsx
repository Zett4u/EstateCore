import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { User, UserRole } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Users as UsersIcon, UserCheck, UserX, Shield, Mail, Calendar } from 'lucide-react';
import { Badge } from '../components/ui/Badge';

export const UsersList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (err: any) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (id: number, newRole: UserRole) => {
    try {
      await api.updateUser(id, { role: newRole });
      setUsers(users.map((u) => (u.id === id ? { ...u, role: newRole } : u)));
    } catch (err: any) {
      alert(err.message || 'Failed to update user role.');
    }
  };

  const handleToggleActive = async (id: number, currentActive: boolean) => {
    try {
      if (currentActive) {
        await api.deactivateUser(id);
        setUsers(users.map((u) => (u.id === id ? { ...u, isActive: false } : u)));
      } else {
        await api.updateUser(id, { isActive: true });
        setUsers(users.map((u) => (u.id === id ? { ...u, isActive: true } : u)));
      }
    } catch (err: any) {
      alert(err.message || 'Failed to toggle account status.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-forest-700">Enterprise Administration</span>
          <h1 className="text-3xl font-serif font-bold text-stone-900 tracking-tight mt-1">
            System User Management
          </h1>
          <p className="text-sm text-stone-600 mt-1">
            RBAC role permissions, authorized agents, and client accounts across EstateCore.
          </p>
        </div>
      </div>

      <div className="bg-white border border-stone-200/90 rounded-2xl overflow-hidden shadow-card">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-48">
            <div className="w-10 h-10 border-4 border-forest-700 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-stone-500 text-sm mt-3 font-medium">Loading user directory...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-stone-600">
              <thead className="bg-stone-50 text-[11px] uppercase font-bold text-stone-500 border-b border-stone-200 tracking-wider">
                <tr>
                  <th className="px-6 py-4">User ID</th>
                  <th className="px-6 py-4">Full Name & Email</th>
                  <th className="px-6 py-4">Assigned Role</th>
                  <th className="px-6 py-4">Account Status</th>
                  <th className="px-6 py-4">Created Date</th>
                  <th className="px-6 py-4 text-right">Access Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-stone-50/70 transition">
                    <td className="px-6 py-4 font-mono text-xs text-stone-400">#USR-{u.id.toString().padStart(3, '0')}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-forest-50 text-forest-800 font-serif font-bold flex items-center justify-center shrink-0">
                          {u.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-stone-900">{u.fullName}</p>
                          <p className="text-xs text-stone-500 flex items-center gap-1">
                            <Mail className="w-3 h-3 text-stone-400" />
                            <span>{u.email}</span>
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                        className="text-xs py-1.5 px-2.5 border border-stone-200 rounded-xl bg-stone-50 font-semibold text-stone-800 focus:bg-white focus:ring-1 focus:ring-forest-600 cursor-pointer"
                      >
                        <option value="ADMIN">ADMIN</option>
                        <option value="AGENT">AGENT</option>
                        <option value="CLIENT">CLIENT</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={String(u.isActive)} />
                    </td>
                    <td className="px-6 py-4 text-xs text-stone-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleToggleActive(u.id, u.isActive)}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                          u.isActive
                            ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        }`}
                      >
                        {u.isActive ? (
                          <>
                            <UserX className="w-3.5 h-3.5" />
                            <span>Deactivate</span>
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Reactivate</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
