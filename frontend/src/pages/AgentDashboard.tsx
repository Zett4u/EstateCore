import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Property, Inquiry, Appointment } from '../types';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { Building, MessageSquare, CalendarDays, Plus, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AgentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [props, inqs, appts] = await Promise.all([
          api.getProperties({ agentId: user?.id }),
          api.getInquiries(),
          api.getAppointments(),
        ]);
        setProperties(props);
        setInquiries(inqs);
        setAppointments(appts);
      } catch (err) {
        console.error('Failed to load agent dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    if (user) loadData();
  }, [user]);

  const activeInquiries = inquiries.filter((i) => i.status === 'PENDING' || i.status === 'CONTACTED');
  const upcomingViewings = appointments.filter((a) => a.status === 'CONFIRMED' || a.status === 'PENDING');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Real Estate Agent Workspace</h1>
          <p className="text-sm text-slate-500">Welcome back, {user?.fullName}. Here are your assigned listings, inquiries, and viewing tours.</p>
        </div>
        <Link
          to="/properties/new"
          className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Listing</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="My Assigned Listings" value={properties.length} icon={Building} subtitle="Active properties managed" />
        <StatCard title="Active Inquiries" value={activeInquiries.length} icon={MessageSquare} subtitle="Pending or contacted" />
        <StatCard title="Upcoming Viewings" value={upcomingViewings.length} icon={CalendarDays} subtitle="Scheduled client visits" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assigned Inquiries */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900">Inquiries Needing Follow-up</h2>
            <Link to="/inquiries" className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center space-x-1">
              <span>Manage Inquiries</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {inquiries.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">No assigned inquiries.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {inquiries.slice(0, 5).map((inq) => (
                <div key={inq.id} className="py-3 flex items-start justify-between">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-slate-900">{inq.subject}</p>
                    <p className="text-xs text-slate-500">
                      Client: {inq.client?.fullName} • Phone: {inq.contactNumber}
                    </p>
                  </div>
                  <StatusBadge status={inq.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Assigned Appointments */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900">Viewing Appointments</h2>
            <Link to="/appointments" className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center space-x-1">
              <span>Manage Appointments</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {appointments.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">No scheduled appointments.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {appointments.slice(0, 5).map((appt) => (
                <div key={appt.id} className="py-3 flex items-start justify-between">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-slate-900">
                      {appt.appointmentDate} at {appt.appointmentTime}
                    </p>
                    <p className="text-xs text-slate-500">
                      Client: {appt.client?.fullName} • Property: {appt.property?.title}
                    </p>
                  </div>
                  <StatusBadge status={appt.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
