import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Property, Inquiry, Appointment, User } from '../types';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { Building, CheckCircle2, MessageSquare, Calendar, Users, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminDashboard: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [props, inqs, appts, usrs] = await Promise.all([
          api.getProperties(),
          api.getInquiries(),
          api.getAppointments(),
          api.getUsers(),
        ]);
        setProperties(props);
        setInquiries(inqs);
        setAppointments(appts);
        setUsers(usrs);
      } catch (err) {
        console.error('Failed to load admin dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const availableCount = properties.filter((p) => p.status === 'AVAILABLE').length;
  const pendingAppointments = appointments.filter((a) => a.status === 'PENDING').length;
  const recentInquiries = inquiries.slice(0, 5);
  const recentAppointments = appointments.slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Executive Administrator Dashboard</h1>
        <p className="text-sm text-slate-500">Live operational overview across property listings, client inquiries, viewing schedules, and agent activities.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Total Properties" value={properties.length} icon={Building} subtitle="All cataloged listings" />
        <StatCard title="Available Properties" value={availableCount} icon={CheckCircle2} badge="Active" subtitle="Ready for offer" />
        <StatCard title="Total Inquiries" value={inquiries.length} icon={MessageSquare} subtitle="Client inquiries logged" />
        <StatCard title="Pending Appointments" value={pendingAppointments} icon={Calendar} subtitle="Awaiting agent action" />
        <StatCard title="System Users" value={users.length} icon={Users} subtitle="Admins, Agents, Clients" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Inquiries */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900">Recent Inquiries</h2>
            <Link to="/inquiries" className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center space-x-1">
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {recentInquiries.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">No inquiries logged yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentInquiries.map((inq) => (
                <div key={inq.id} className="py-3 flex items-start justify-between">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-slate-900">{inq.subject}</p>
                    <p className="text-xs text-slate-500">
                      Client: <span className="font-medium text-slate-700">{inq.client?.fullName || 'N/A'}</span> • Property: <span className="font-medium text-slate-700">{inq.property?.title}</span>
                    </p>
                  </div>
                  <StatusBadge status={inq.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Appointments */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900">Upcoming Appointments</h2>
            <Link to="/appointments" className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center space-x-1">
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {recentAppointments.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">No appointments scheduled.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentAppointments.map((appt) => (
                <div key={appt.id} className="py-3 flex items-start justify-between">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-slate-900">
                      {appt.appointmentDate} at {appt.appointmentTime}
                    </p>
                    <p className="text-xs text-slate-500">
                      Property: <span className="font-medium text-slate-700">{appt.property?.title}</span> • Agent: <span className="font-medium text-slate-700">{appt.agent?.fullName}</span>
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
