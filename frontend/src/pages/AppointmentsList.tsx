import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Appointment, AppointmentStatus } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { CalendarDays, Trash2, Check, X, Clock } from 'lucide-react';

export const AppointmentsList: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const data = await api.getAppointments();
      setAppointments(data);
    } catch (err: any) {
      console.error('Failed to load appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleStatusChange = async (id: number, newStatus: AppointmentStatus) => {
    try {
      await api.updateAppointment(id, { status: newStatus });
      setAppointments(
        appointments.map((appt) => (appt.id === id ? { ...appt, status: newStatus } : appt))
      );
    } catch (err: any) {
      alert(err.message || 'Failed to update appointment status.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to cancel and delete this viewing appointment?')) return;
    try {
      await api.deleteAppointment(id);
      setAppointments(appointments.filter((a) => a.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete appointment.');
    }
  };

  const canManageStatus = user?.role === 'ADMIN' || user?.role === 'AGENT';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Viewing Appointments</h1>
        <p className="text-sm text-slate-500">Coordinate on-site tours and client visits with verified agents.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : appointments.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <CalendarDays className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <p className="font-medium">No viewing appointments scheduled.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Date & Time</th>
                  <th className="px-6 py-3">Property Location</th>
                  <th className="px-6 py-3">Client</th>
                  <th className="px-6 py-3">Assigned Agent</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.map((appt) => (
                  <tr key={appt.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="font-semibold text-slate-900">{appt.appointmentDate}</p>
                          <p className="text-xs text-slate-500">{appt.appointmentTime}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-800">{appt.property?.title}</p>
                      <p className="text-xs text-slate-500">{appt.property?.location}</p>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-800">
                      {appt.client?.fullName}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-800">
                      {appt.agent?.fullName}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={appt.status} />
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {canManageStatus && appt.status === 'PENDING' && (
                        <button
                          onClick={() => handleStatusChange(appt.id, 'CONFIRMED')}
                          className="px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition inline-flex items-center space-x-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Confirm</span>
                        </button>
                      )}

                      {canManageStatus && appt.status === 'CONFIRMED' && (
                        <button
                          onClick={() => handleStatusChange(appt.id, 'COMPLETED')}
                          className="px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded transition inline-flex items-center space-x-1"
                        >
                          <span>Complete</span>
                        </button>
                      )}

                      {(user?.role === 'ADMIN' || user?.id === appt.clientId) && (
                        <button
                          onClick={() => handleDelete(appt.id)}
                          className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition inline-block align-middle"
                          title="Cancel/Delete"
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
