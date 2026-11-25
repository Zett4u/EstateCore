import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Inquiry, InquiryStatus } from '../types';
import { formatPHP } from '../lib/utils';
import { StatusBadge } from '../components/StatusBadge';
import { Button } from '../components/ui/Button';
import { MessageSquare, Trash2, CheckCircle, Phone, Mail, Building, Clock } from 'lucide-react';

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
    if (!window.confirm('Are you sure you want to permanently delete this inquiry record?')) return;
    try {
      await api.deleteInquiry(id);
      setInquiries(inquiries.filter((inq) => inq.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete inquiry.');
    }
  };

  const canUpdateStatus = user?.role === 'ADMIN' || user?.role === 'AGENT';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-forest-700">Communication Center</span>
          <h1 className="text-3xl font-serif font-bold text-stone-900 tracking-tight mt-1">
            Client Inquiries Management
          </h1>
          <p className="text-sm text-stone-600 mt-1">
            Track, qualify, and respond to buyer and tenant inquiries across property listings.
          </p>
        </div>
      </div>

      <div className="bg-white border border-stone-200/90 rounded-2xl overflow-hidden shadow-card">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-48">
            <div className="w-10 h-10 border-4 border-forest-700 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-stone-500 text-sm mt-3 font-medium">Loading inquiry records...</p>
          </div>
        ) : inquiries.length === 0 ? (
          <div className="p-12 text-center text-stone-500 space-y-3">
            <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-base text-stone-900">No Inquiries Found</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Client messages submitted through property listings will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-stone-600">
              <thead className="bg-stone-50 text-[11px] uppercase font-bold text-stone-500 border-b border-stone-200 tracking-wider">
                <tr>
                  <th className="px-6 py-4">Inquiry & Message</th>
                  <th className="px-6 py-4">Property</th>
                  <th className="px-6 py-4">Client Contact</th>
                  <th className="px-6 py-4">Assigned Agent</th>
                  <th className="px-6 py-4">Status & Action</th>
                  <th className="px-6 py-4 text-right">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {inquiries.map((inq) => (
                  <tr key={inq.id} className="hover:bg-stone-50/70 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-stone-900">{inq.subject}</span>
                        {inq.inquiryType === 'OFFER' || inq.offerAmount ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            OFFER: {inq.offerAmount ? formatPHP(inq.offerAmount) : 'Pending'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-stone-100 text-stone-600">
                            INQUIRY
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-500 mt-1 line-clamp-2 max-w-xs">{inq.message}</p>
                      <span className="text-[10px] text-stone-400 mt-1 block">
                        Received: {new Date(inq.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-stone-800">{inq.property?.title || `Property #${inq.propertyId}`}</p>
                      <p className="text-xs text-stone-500">{inq.property?.location}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-stone-900">{inq.client?.fullName}</p>
                      <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-stone-400" />
                        <span>{inq.contactNumber}</span>
                      </p>
                      <p className="text-xs text-stone-400 flex items-center gap-1">
                        <Mail className="w-3 h-3 text-stone-400" />
                        <span>{inq.client?.email}</span>
                      </p>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {inq.assignedAgent ? (
                        <div>
                          <p className="font-semibold text-stone-900">{inq.assignedAgent.fullName}</p>
                          <p className="text-stone-400">{inq.assignedAgent.email}</p>
                        </div>
                      ) : (
                        <span className="text-stone-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <StatusBadge status={inq.status} />
                        {canUpdateStatus && (
                          <select
                            value={inq.status}
                            onChange={(e) => handleStatusChange(inq.id, e.target.value as InquiryStatus)}
                            className="text-xs py-1 px-2 border border-stone-200 rounded-lg bg-stone-50 font-medium text-stone-700 focus:bg-white focus:ring-1 focus:ring-forest-600"
                          >
                            <option value="PENDING">PENDING</option>
                            <option value="Accepted">Accepted</option>
                            <option value="Rejected">Rejected</option>
                            <option value="Replied">Replied</option>
                            <option value="CONTACTED">CONTACTED</option>
                            <option value="CLOSED">CLOSED</option>
                          </select>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {(user?.role === 'ADMIN' || inq.clientId === user?.id) && (
                        <button
                          onClick={() => handleDelete(inq.id)}
                          className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                          title="Delete Inquiry"
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
