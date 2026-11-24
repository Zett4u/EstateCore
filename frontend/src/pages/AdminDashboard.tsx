import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Property, Inquiry, Appointment, User } from '../types';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { Building, CheckCircle2, MessageSquare, Calendar, Users, ArrowUpRight, Plus, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

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
      <div className="flex flex-col items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-forest-700 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-stone-500 text-sm mt-3 font-medium">Gathering enterprise analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-forest-700">Administrator Command Center</span>
          <h1 className="text-3xl font-serif font-bold text-stone-900 tracking-tight mt-1">
            Executive Operations Dashboard
          </h1>
          <p className="text-sm text-stone-600 mt-1">
            Real-time multi-tenant overview across property listings, client pipelines, and viewing coordination.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/properties/new">
            <Button variant="primary">
              <Plus className="w-4 h-4 mr-1.5" />
              <span>Create Listing</span>
            </Button>
          </Link>
          <Link to="/users">
            <Button variant="outline">
              <Users className="w-4 h-4 mr-1.5" />
              <span>Manage Users</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Total Portfolio" value={properties.length} icon={Building} subtitle="All cataloged properties" />
        <StatCard title="Active Listings" value={availableCount} icon={CheckCircle2} badge="Live" subtitle="Available on market" />
        <StatCard title="Client Inquiries" value={inquiries.length} icon={MessageSquare} subtitle="Pipeline leads captured" />
        <StatCard title="Pending Tours" value={pendingAppointments} icon={Calendar} subtitle="Awaiting agent confirmation" />
        <StatCard title="Platform Users" value={users.length} icon={Users} subtitle="Admins, Agents & Clients" />
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Inquiries */}
        <div className="bg-white border border-stone-200/90 rounded-2xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-serif font-bold text-stone-900">Recent Property Inquiries</h2>
              <p className="text-xs text-stone-500">Inbound inquiries needing qualification</p>
            </div>
            <Link to="/inquiries" className="text-xs font-semibold text-forest-700 hover:text-forest-800 flex items-center space-x-1">
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentInquiries.length === 0 ? (
            <p className="text-sm text-stone-400 py-6 text-center">No inquiries logged yet.</p>
          ) : (
            <div className="divide-y divide-stone-100">
              {recentInquiries.map((inq) => (
                <div key={inq.id} className="py-3.5 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-xs md:text-sm font-semibold text-stone-900">{inq.subject}</p>
                    <p className="text-xs text-stone-500">
                      Client: <span className="font-medium text-stone-800">{inq.client?.fullName || 'N/A'}</span> • Property: <span className="font-medium text-stone-800">{inq.property?.title}</span>
                    </p>
                  </div>
                  <div className="shrink-0">
                    <StatusBadge status={inq.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Appointments */}
        <div className="bg-white border border-stone-200/90 rounded-2xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-serif font-bold text-stone-900">Upcoming Viewing Appointments</h2>
              <p className="text-xs text-stone-500">On-site property tours and inspection schedules</p>
            </div>
            <Link to="/appointments" className="text-xs font-semibold text-forest-700 hover:text-forest-800 flex items-center space-x-1">
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentAppointments.length === 0 ? (
            <p className="text-sm text-stone-400 py-6 text-center">No viewing appointments recorded.</p>
          ) : (
            <div className="divide-y divide-stone-100">
              {recentAppointments.map((appt) => (
                <div key={appt.id} className="py-3.5 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-xs md:text-sm font-semibold text-stone-900">
                      {appt.appointmentDate} at {appt.appointmentTime}
                    </p>
                    <p className="text-xs text-stone-500">
                      Client: <span className="font-medium text-stone-800">{appt.client?.fullName}</span> • Property: <span className="font-medium text-stone-800">{appt.property?.title}</span>
                    </p>
                  </div>
                  <div className="shrink-0">
                    <StatusBadge status={appt.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
