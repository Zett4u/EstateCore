import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Property, Inquiry, Appointment } from '../types';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { Building, MessageSquare, CalendarDays, Plus, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

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
      <div className="flex flex-col items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-forest-700 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-stone-500 text-sm mt-3 font-medium">Loading your agent portfolio...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-forest-700">Real Estate Advisor Workspace</span>
          <h1 className="text-3xl font-serif font-bold text-stone-900 tracking-tight mt-1">
            Agent Dashboard
          </h1>
          <p className="text-sm text-stone-600 mt-1">
            Welcome back, {user?.fullName}. Here are your assigned property listings, prospect inquiries, and viewing tours.
          </p>
        </div>
        <Link to="/properties/new">
          <Button variant="primary">
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Publish New Listing</span>
          </Button>
        </Link>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard title="My Assigned Properties" value={properties.length} icon={Building} subtitle="Active listings under your care" />
        <StatCard title="Active Inquiries" value={activeInquiries.length} icon={MessageSquare} subtitle="Pending response or contacted" />
        <StatCard title="Viewing Tours" value={upcomingViewings.length} icon={CalendarDays} subtitle="Pending or confirmed visits" />
      </div>

      {/* Quick Access Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Assigned Inquiries */}
        <div className="bg-white border border-stone-200/90 rounded-2xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-serif font-bold text-stone-900">Prospect Inquiries Needing Follow-up</h2>
              <p className="text-xs text-stone-500">Client questions on your listings</p>
            </div>
            <Link to="/inquiries" className="text-xs font-semibold text-forest-700 hover:text-forest-800 flex items-center space-x-1">
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {inquiries.length === 0 ? (
            <p className="text-sm text-stone-400 py-6 text-center">No assigned inquiries at this time.</p>
          ) : (
            <div className="divide-y divide-stone-100">
              {inquiries.slice(0, 5).map((inq) => (
                <div key={inq.id} className="py-3.5 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-xs md:text-sm font-semibold text-stone-900">{inq.subject}</p>
                    <p className="text-xs text-stone-500">
                      Client: <span className="font-medium text-stone-800">{inq.client?.fullName}</span> • Phone: <span className="font-medium text-stone-800">{inq.contactNumber}</span>
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

        {/* Assigned Appointments */}
        <div className="bg-white border border-stone-200/90 rounded-2xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-serif font-bold text-stone-900">Your Scheduled Property Tours</h2>
              <p className="text-xs text-stone-500">Upcoming on-site client viewings</p>
            </div>
            <Link to="/appointments" className="text-xs font-semibold text-forest-700 hover:text-forest-800 flex items-center space-x-1">
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {appointments.length === 0 ? (
            <p className="text-sm text-stone-400 py-6 text-center">No scheduled viewing tours.</p>
          ) : (
            <div className="divide-y divide-stone-100">
              {appointments.slice(0, 5).map((appt) => (
                <div key={appt.id} className="py-3.5 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-xs md:text-sm font-semibold text-stone-900">
                      {appt.appointmentDate} at {appt.appointmentTime}
                    </p>
                    <p className="text-xs text-stone-500">
                      Property: <span className="font-medium text-stone-800">{appt.property?.title}</span> • Client: <span className="font-medium text-stone-800">{appt.client?.fullName}</span>
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
