import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Inquiry, InquiryStatus } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { MessageSquare, Trash2, CheckCircle } from 'lucide-react';

export const InquiriesList: React.FC = () => {
  const { user } = useAuth();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const data = await api.getInquiries();
      setInquiries(data);
    } catch (err: any) {
      console.error('Failed to load inquiries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  const handleStatusChange = async (id: number, newStatus: InquiryStatus) => {
    try {
      await api.updateInquiry(id, { status: newStatus });
      setInquiries(inquiries.map((inq) => (inq.id === id ? { ...inq, status: newStatus } : inq)));
    } catch (err: any) {
      alert(err.message || 'Failed to update status.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this inquiry?')) return;
    try {
      await api.deleteInquiry(id);
      setInquiries(inquiries.filter((inq) => inq.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete inquiry.');
    }
  };

  const canUpdateStatus = user?.role === 'ADMIN' || user?.role === 'AGENT';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Property Inquiries</h1>
        <p className="text-sm text-slate-500">Track and respond to client inquiries regarding real estate listings.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : inquiries.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <MessageSquare className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <p className="font-medium">No inquiries recorded.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Inquiry Subject & Details</th>
                  <th className="px-6 py-3">Property</th>
                  <th className="px-6 py-3">Client Contact</th>
                  <th className="px-6 py-3">Assigned Agent</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inquiries.map((inq) => (
                  <tr key={inq.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">{inq.subject}</p>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 max-w-xs">{inq.message}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-800">{inq.property?.title || `Property #${inq.propertyId}`}</p>
                      <p className="text-xs text-slate-500">{inq.property?.location}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-800">{inq.client?.fullName}</p>
                      <p className="text-xs text-slate-500">{inq.contactNumber}</p>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {inq.assignedAgent ? (
                        <span className="font-medium text-slate-700">{inq.assignedAgent.fullName}</span>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={inq.status} />
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {canUpdateStatus && (
                        <select
                          value={inq.status}
                          onChange={(e) => handleStatusChange(inq.id, e.target.value as InquiryStatus)}
                          className="text-xs py-1 px-2 border border-slate-300 rounded focus:ring-blue-600 bg-white"
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="CONTACTED">CONTACTED</option>
                          <option value="QUALIFIED">QUALIFIED</option>
                          <option value="CLOSED">CLOSED</option>
                        </select>
                      )}
                      {(user?.role === 'ADMIN' || inq.clientId === user?.id) && (
                        <button
                          onClick={() => handleDelete(inq.id)}
                          className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition inline-block align-middle"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
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
