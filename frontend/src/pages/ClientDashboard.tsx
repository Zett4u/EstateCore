import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Property, Inquiry, Appointment } from '../types';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { Building, MessageSquare, CalendarCheck, Search, ArrowRight } from 'lucide-react';
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      maximumFractionDigits: 0,
    }).format(price);
  };

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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Client Portal</h1>
          <p className="text-sm text-slate-500">Welcome, {user?.fullName}. Explore verified real estate listings or track your inquiries and viewing appointments.</p>
        </div>
        <Link
          to="/properties"
          className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition"
        >
          <Search className="w-4 h-4" />
          <span>Browse All Properties</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Available Properties" value={properties.filter(p => p.status === 'AVAILABLE').length} icon={Building} subtitle="Active on the market" />
        <StatCard title="My Inquiries" value={myInquiries.length} icon={MessageSquare} subtitle="Questions submitted" />
        <StatCard title="My Viewings" value={myAppointments.length} icon={CalendarCheck} subtitle="Scheduled appointments" />
      </div>

      {/* Featured Properties */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Featured Available Listings</h2>
          <Link to="/properties" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1">
            <span>View Catalog</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {properties.slice(0, 6).map((prop) => (
            <div key={prop.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:border-slate-300 transition flex flex-col justify-between">
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    {prop.listingType} • {prop.propertyType}
                  </span>
                  <StatusBadge status={prop.status} />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 line-clamp-1">{prop.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{prop.location}</p>
                </div>
                <p className="text-xs text-slate-600 line-clamp-2">{prop.description}</p>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>{prop.bedrooms} Beds • {prop.bathrooms} Baths</span>
                  <span>{prop.floorArea} sqm</span>
                </div>
              </div>
              <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <span className="text-base font-bold text-slate-900">{formatPrice(prop.price)}</span>
                <Link
                  to={`/properties/${prop.id}`}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                >
                  <span>Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
