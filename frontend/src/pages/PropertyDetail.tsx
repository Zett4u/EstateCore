import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Property } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import {
  Building2,
  MapPin,
  Bed,
  Bath,
  Maximize2,
  Calendar,
  MessageSquare,
  ArrowLeft,
  Edit,
  Trash2,
} from 'lucide-react';

export const PropertyDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);

  // Inquiry form modal state
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [inquirySubject, setInquirySubject] = useState('');
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [inquiryPhone, setInquiryPhone] = useState('');
  const [inquirySubmitting, setInquirySubmitting] = useState(false);

  // Appointment form modal state
  const [showApptModal, setShowApptModal] = useState(false);
  const [apptDate, setApptDate] = useState('');
  const [apptTime, setApptTime] = useState('10:00');
  const [apptNotes, setApptNotes] = useState('');
  const [apptSubmitting, setApptSubmitting] = useState(false);

  useEffect(() => {
    async function loadProperty() {
      if (!id) return;
      try {
        const data = await api.getProperty(Number(id));
        setProperty(data);
        setInquirySubject(`Inquiry regarding ${data.title}`);
      } catch (err: any) {
        alert(err.message || 'Property not found.');
        navigate('/properties');
      } finally {
        setLoading(false);
      }
    }
    loadProperty();
  }, [id, navigate]);

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!property) return;
    setInquirySubmitting(true);
    try {
      await api.createInquiry({
        propertyId: property.id,
        subject: inquirySubject,
        message: inquiryMessage,
        contactNumber: inquiryPhone,
      });
      alert('Your inquiry has been submitted! An agent will respond promptly.');
      setShowInquiryModal(false);
    } catch (err: any) {
      alert(err.message || 'Failed to submit inquiry.');
    } finally {
      setInquirySubmitting(false);
    }
  };

  const handleApptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!property) return;
    setApptSubmitting(true);
    try {
      await api.createAppointment({
        propertyId: property.id,
        appointmentDate: apptDate,
        appointmentTime: apptTime,
        notes: apptNotes,
      });
      alert('Viewing appointment requested! Check your appointments dashboard for confirmation status.');
      setShowApptModal(false);
    } catch (err: any) {
      alert(err.message || 'Failed to schedule appointment.');
    } finally {
      setApptSubmitting(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (loading || !property) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const isOwner = user?.role === 'ADMIN' || (user?.role === 'AGENT' && property.agentId === user.id);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/properties"
          className="inline-flex items-center space-x-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Listings</span>
        </Link>
        {isOwner && (
          <div className="flex items-center space-x-2">
            <Link
              to={`/properties/${property.id}/edit`}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit Property</span>
            </Link>
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-6 md:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-slate-100 pb-6">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  {property.listingType} • {property.propertyType}
                </span>
                <StatusBadge status={property.status} />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">{property.title}</h1>
              <p className="text-sm text-slate-500 flex items-center">
                <MapPin className="w-4 h-4 mr-1 text-slate-400" />
                {property.address}, {property.location}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-xs uppercase text-slate-400 font-semibold tracking-wider">Price</span>
              <p className="text-3xl font-bold text-slate-900">{formatPrice(property.price)}</p>
            </div>
          </div>

          {/* Key Specs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-slate-100 rounded-lg text-slate-700">
                <Bed className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Bedrooms</p>
                <p className="text-base font-semibold text-slate-900">{property.bedrooms} Beds</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="p-2 bg-slate-100 rounded-lg text-slate-700">
                <Bath className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Bathrooms</p>
                <p className="text-base font-semibold text-slate-900">{property.bathrooms} Baths</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="p-2 bg-slate-100 rounded-lg text-slate-700">
                <Maximize2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Floor Area</p>
                <p className="text-base font-semibold text-slate-900">{property.floorArea} sqm</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="p-2 bg-slate-100 rounded-lg text-slate-700">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Lot Area</p>
                <p className="text-base font-semibold text-slate-900">{property.lotArea} sqm</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900">Property Description</h2>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{property.description}</p>
          </div>

          {/* Assigned Agent Box */}
          {property.agent && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs uppercase font-semibold text-slate-500">Listing Agent</p>
                <p className="text-sm font-bold text-slate-900">{property.agent.fullName}</p>
                <p className="text-xs text-slate-500">{property.agent.email}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowInquiryModal(true)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center space-x-1"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Send Inquiry</span>
                </button>
                <button
                  onClick={() => setShowApptModal(true)}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center space-x-1"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Schedule Tour</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Inquiry Modal */}
      {showInquiryModal && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Submit Property Inquiry</h3>
            <form onSubmit={handleInquirySubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={inquirySubject}
                  onChange={(e) => setInquirySubject(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  required
                  placeholder="+63 917 123 4567"
                  value={inquiryPhone}
                  onChange={(e) => setInquiryPhone(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Message</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Inquire about price terms, financing, or property visit details..."
                  value={inquiryMessage}
                  onChange={(e) => setInquiryMessage(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2"
                ></textarea>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInquiryModal(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inquirySubmitting}
                  className="px-4 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
                >
                  {inquirySubmitting ? 'Sending...' : 'Submit Inquiry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Appointment Modal */}
      {showApptModal && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Request Viewing Appointment</h3>
            <form onSubmit={handleApptSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Tour Date</label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={apptDate}
                  onChange={(e) => setApptDate(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Preferred Time</label>
                <input
                  type="time"
                  required
                  value={apptTime}
                  onChange={(e) => setApptTime(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Notes / Requests</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Requesting afternoon viewing with family engineer..."
                  value={apptNotes}
                  onChange={(e) => setApptNotes(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2"
                ></textarea>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowApptModal(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={apptSubmitting}
                  className="px-4 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
                >
                  {apptSubmitting ? 'Requesting...' : 'Request Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
