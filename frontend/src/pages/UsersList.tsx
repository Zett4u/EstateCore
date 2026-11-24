import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { User, UserRole } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Users as UsersIcon, UserCheck, UserX, Shield } from 'lucide-react';

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System User Management</h1>
        <p className="text-sm text-slate-500">Administrator controls for system roles, permissions, and active account statuses.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">ID</th>
                  <th className="px-6 py-3">Full Name & Email</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Created</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">#{u.id}</td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">{u.fullName}</p>
                      <p className="text-xs text-slate-500">{u.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                        className="text-xs py-1 px-2 border border-slate-300 rounded font-medium bg-white focus:ring-blue-600"
                      >
                        <option value="ADMIN">ADMIN</option>
                        <option value="AGENT">AGENT</option>
                        <option value="CLIENT">CLIENT</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={u.isActive ? 'Active' : 'Inactive'} />
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleToggleActive(u.id, u.isActive)}
                        className={`px-3 py-1 text-xs font-medium rounded border transition ${
                          u.isActive
                            ? 'text-red-700 bg-red-50 hover:bg-red-100 border-red-200'
                            : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
                        }`}
                      >
                        {u.isActive ? 'Deactivate' : 'Activate'}
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
