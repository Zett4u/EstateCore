import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Property, Inquiry, Appointment } from '../types';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { getPropertyImage, formatPHP } from '../lib/utils';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Building, MessageSquare, CalendarCheck, Search, ArrowRight, MapPin, Bed, Bath, Maximize2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ClientDashboard: React.FC = () => {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [myInquiries, setMyInquiries] = useState<Inquiry[]>([]);
  const [myAppointments, setMyAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [props, inqs, appts] = await Promise.all([
          api.getProperties(),
          api.getInquiries(),
          api.getAppointments(),
        ]);
        setProperties(props);
        setMyInquiries(inqs);
        setMyAppointments(appts);
      } catch (err) {
        console.error('Failed to load client dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-forest-700 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-stone-500 text-sm mt-3 font-medium">Loading your client portal...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome banner */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-forest-700">Client Portal</span>
          <h1 className="text-3xl font-serif font-bold text-stone-900 tracking-tight mt-1">
            Welcome back, {user?.fullName}
          </h1>
          <p className="text-sm text-stone-600 mt-1">
            Discover verified architectural listings, check your inquiries, and manage your property viewing schedules.
          </p>
        </div>
        <Link to="/properties">
          <Button variant="primary">
            <Search className="w-4 h-4 mr-1.5" />
            <span>Explore Properties</span>
          </Button>
        </Link>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          title="Verified Properties"
          value={properties.filter((p) => p.status === 'AVAILABLE').length}
          icon={Building}
          subtitle="Available for viewing today"
        />
        <StatCard
          title="My Inquiries"
          value={myInquiries.length}
          icon={MessageSquare}
          subtitle="Direct questions submitted"
        />
        <StatCard
          title="Scheduled Viewings"
          value={myAppointments.length}
          icon={CalendarCheck}
          subtitle="Upcoming on-site appointments"
        />
      </div>

      {/* Client Active Inquiries and Viewings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Inquiries */}
        <div className="bg-white border border-stone-200/90 rounded-2xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-serif font-bold text-stone-900">My Inquiries Tracker</h2>
            <Link to="/inquiries" className="text-xs font-semibold text-forest-700 hover:text-forest-800">
              View all
            </Link>
          </div>
          {myInquiries.length === 0 ? (
            <p className="text-xs text-stone-400 py-6 text-center">You haven't submitted any inquiries yet.</p>
          ) : (
            <div className="divide-y divide-stone-100">
              {myInquiries.slice(0, 4).map((inq) => (
                <div key={inq.id} className="py-3 flex items-start justify-between">
                  <div>
                    <p className="text-xs md:text-sm font-semibold text-stone-900">{inq.subject}</p>
                    <p className="text-xs text-stone-500 mt-0.5">Property: {inq.property?.title}</p>
                  </div>
                  <StatusBadge status={inq.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Viewing appointments */}
        <div className="bg-white border border-stone-200/90 rounded-2xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-serif font-bold text-stone-900">My Scheduled Viewing Tours</h2>
            <Link to="/appointments" className="text-xs font-semibold text-forest-700 hover:text-forest-800">
              View all
            </Link>
          </div>
          {myAppointments.length === 0 ? (
            <p className="text-xs text-stone-400 py-6 text-center">No viewing appointments booked yet.</p>
          ) : (
            <div className="divide-y divide-stone-100">
              {myAppointments.slice(0, 4).map((appt) => (
                <div key={appt.id} className="py-3 flex items-start justify-between">
                  <div>
                    <p className="text-xs md:text-sm font-semibold text-stone-900">{appt.property?.title}</p>
                    <p className="text-xs text-stone-500 mt-0.5">{appt.appointmentDate} at {appt.appointmentTime}</p>
                  </div>
                  <StatusBadge status={appt.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Featured Properties Spotlight */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-serif font-bold text-stone-900">Featured Available Residences</h2>
            <p className="text-xs text-stone-500">Selected properties ready for private viewings</p>
          </div>
          <Link to="/properties" className="text-xs font-semibold text-forest-700 hover:text-forest-800 flex items-center gap-1">
            <span>Browse Full Catalog</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {properties.slice(0, 3).map((prop) => {
            const imageSrc = getPropertyImage(prop.id, prop.propertyType);
            return (
              <div
                key={prop.id}
                className="group bg-white rounded-2xl border border-stone-200/90 overflow-hidden shadow-subtle hover:shadow-card transition flex flex-col justify-between"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-stone-100">
                  <img src={imageSrc} alt={prop.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                  <div className="absolute top-3 left-3">
                    <Badge variant={prop.listingType === 'SALE' ? 'forest' : 'blue'}>
                      {prop.listingType === 'SALE' ? 'For Sale' : 'For Rent'}
                    </Badge>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <span className="text-lg font-bold font-sans drop-shadow-sm">{formatPHP(prop.price)}</span>
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  <h3 className="font-serif font-bold text-base text-stone-900 line-clamp-1">{prop.title}</h3>
                  <p className="text-xs text-stone-500 flex items-center">
                    <MapPin className="w-3.5 h-3.5 mr-1 text-stone-400" />
                    <span>{prop.location}</span>
                  </p>
                  <Link
                    to={`/properties/${prop.id}`}
                    className="mt-3 inline-flex items-center justify-center w-full py-2 px-3 rounded-xl bg-stone-100 hover:bg-forest-50 hover:text-forest-800 text-stone-800 text-xs font-semibold transition"
                  >
                    <span>View Property Details</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
