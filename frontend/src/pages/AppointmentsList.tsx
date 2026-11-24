import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Appointment, AppointmentStatus } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { CalendarDays, Trash2, Check, X, Clock, MapPin, UserCheck } from 'lucide-react';

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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-forest-700">Tour Scheduling</span>
          <h1 className="text-3xl font-serif font-bold text-stone-900 tracking-tight mt-1">
            Property Viewing Appointments
          </h1>
          <p className="text-sm text-stone-600 mt-1">
            Coordinate private inspections, client visits, and walkthroughs with verified agents.
          </p>
        </div>
      </div>

      <div className="bg-white border border-stone-200/90 rounded-2xl overflow-hidden shadow-card">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-48">
            <div className="w-10 h-10 border-4 border-forest-700 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-stone-500 text-sm mt-3 font-medium">Loading tour schedules...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="p-12 text-center text-stone-500 space-y-3">
            <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
              <CalendarDays className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-base text-stone-900">No Viewing Appointments</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Scheduled client property viewings will appear here with confirmation status.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-stone-600">
              <thead className="bg-stone-50 text-[11px] uppercase font-bold text-stone-500 border-b border-stone-200 tracking-wider">
                <tr>
                  <th className="px-6 py-4">Date & Time Slot</th>
                  <th className="px-6 py-4">Property Location</th>
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Assigned Agent</th>
                  <th className="px-6 py-4">Status & Management</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {appointments.map((appt) => (
                  <tr key={appt.id} className="hover:bg-stone-50/70 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-lg bg-forest-50 text-forest-700 flex items-center justify-center shrink-0">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-stone-900">{appt.appointmentDate}</p>
                          <p className="text-xs text-stone-500 font-mono">{appt.appointmentTime}</p>
                        </div>
                      </div>
                      {appt.notes && (
                        <p className="text-[11px] text-stone-400 mt-2 bg-stone-50 p-2 rounded-lg border border-stone-100">
                          <strong>Note:</strong> {appt.notes}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-stone-900">{appt.property?.title}</p>
                      <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-stone-400" />
                        <span>{appt.property?.location}</span>
                      </p>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-stone-800">
                      <p className="font-semibold text-stone-900">{appt.client?.fullName}</p>
                      <p className="text-stone-400">{appt.client?.email}</p>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {appt.agent ? (
                        <div>
                          <p className="font-semibold text-stone-900">{appt.agent.fullName}</p>
                          <p className="text-stone-400">{appt.agent.email}</p>
                        </div>
                      ) : (
                        <span className="text-stone-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <StatusBadge status={appt.status} />
                        {canManageStatus && (
                          <select
                            value={appt.status}
                            onChange={(e) => handleStatusChange(appt.id, e.target.value as AppointmentStatus)}
                            className="text-xs py-1 px-2 border border-stone-200 rounded-lg bg-stone-50 font-medium text-stone-700 focus:bg-white focus:ring-1 focus:ring-forest-600"
                          >
                            <option value="PENDING">PENDING</option>
                            <option value="CONFIRMED">CONFIRMED</option>
                            <option value="COMPLETED">COMPLETED</option>
                            <option value="CANCELLED">CANCELLED</option>
                          </select>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {(user?.role === 'ADMIN' || appt.clientId === user?.id) && (
                        <button
                          onClick={() => handleDelete(appt.id)}
                          className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                          title="Cancel and delete appointment"
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
