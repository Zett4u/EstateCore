import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Property } from '../types';
import { getPropertyImage, formatPHP } from '../lib/utils';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
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
  Clock,
  ShieldCheck,
  UserCheck,
  Check,
  Share2,
  Phone,
  Mail,
  HelpCircle,
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

    if (!user) {
      alert('Please sign in or register to submit inquiries directly to our agent.');
      navigate('/login');
      return;
    }

    setInquirySubmitting(true);
    try {
      await api.createInquiry({
        propertyId: property.id,
        subject: inquirySubject,
        message: inquiryMessage,
        contactNumber: inquiryPhone || 'N/A',
      });
      alert('Your inquiry has been submitted! An assigned agent will respond promptly.');
      setShowInquiryModal(false);
      setInquiryMessage('');
    } catch (err: any) {
      alert(err.message || 'Failed to submit inquiry.');
    } finally {
      setInquirySubmitting(false);
    }
  };

  const handleApptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!property) return;

    if (!user) {
      alert('Please sign in or register to schedule viewing appointments.');
      navigate('/login');
      return;
    }

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
      setApptNotes('');
    } catch (err: any) {
      alert(err.message || 'Failed to schedule appointment.');
    } finally {
      setApptSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!property) return;
    if (!window.confirm(`Are you sure you want to permanently delete listing '${property.title}'?`)) return;
    try {
      await api.deleteProperty(property.id);
      navigate('/properties');
    } catch (err: any) {
      alert(err.message || 'Failed to delete property.');
    }
  };

  if (loading || !property) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-forest-700 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-stone-500 text-sm mt-3 font-medium">Loading property dossier...</p>
      </div>
    );
  }

  const isOwner = user?.role === 'ADMIN' || (user?.role === 'AGENT' && property.agentId === user.id);
  const imageSrc = getPropertyImage(property.id, property.propertyType);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Top Navigation & Controls */}
      <div className="flex items-center justify-between">
        <Link
          to="/properties"
          className="inline-flex items-center space-x-2 text-sm font-semibold text-stone-600 hover:text-stone-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Portfolio</span>
        </Link>

        {isOwner && (
          <div className="flex items-center space-x-2">
            <Link to={`/properties/${property.id}/edit`}>
              <Button variant="outline" size="sm">
                <Edit className="w-3.5 h-3.5 mr-1.5" />
                <span>Edit Listing</span>
              </Button>
            </Link>
            <Button variant="danger" size="sm" onClick={handleDelete}>
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              <span>Delete</span>
            </Button>
          </div>
        )}
      </div>

      {/* Hero Visual Banner */}
      <div className="relative aspect-[21/9] md:aspect-[24/9] rounded-3xl overflow-hidden shadow-card bg-stone-900">
        <img
          src={imageSrc}
          alt={property.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-black/20 to-transparent" />

        <div className="absolute bottom-6 left-6 right-6 md:bottom-8 md:left-8 md:right-8 flex flex-col md:flex-row md:items-end justify-between gap-4 text-white">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={property.listingType === 'SALE' ? 'forest' : 'blue'}>
                {property.listingType === 'SALE' ? 'For Sale' : 'For Rent'}
              </Badge>
              <Badge variant={property.status === 'AVAILABLE' ? 'forest' : 'amber'}>
                {property.status}
              </Badge>
              <span className="text-xs bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full font-medium">
                {property.propertyType}
              </span>
            </div>
            <h1 className="text-2xl md:text-4xl font-serif font-bold text-white tracking-tight drop-shadow-sm">
              {property.title}
            </h1>
            <p className="text-sm md:text-base text-stone-200 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-forest-400 shrink-0" />
              <span>{property.address ? `${property.address}, ` : ''}{property.location}</span>
            </p>
          </div>

          <div className="bg-stone-950/70 backdrop-blur-md border border-white/10 rounded-2xl p-4 md:text-right shrink-0">
            <span className="text-xs text-stone-300 uppercase tracking-wider block font-medium">Offering Price</span>
            <span className="text-2xl md:text-3xl font-bold font-sans text-white">
              {formatPHP(property.price)}
            </span>
            {property.listingType === 'RENT' && (
              <span className="text-xs text-stone-300 block font-normal">per calendar month</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Details (Left 2 cols) vs Action Sidebar (Right 1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Specs, Narrative, Amenities */}
        <div className="lg:col-span-2 space-y-8">
          {/* Key Specifications Bar */}
          <div className="bg-white border border-stone-200/90 rounded-2xl p-6 shadow-card">
            <h2 className="text-sm font-bold uppercase tracking-wider text-stone-500 mb-4">Architectural Specifications</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-forest-50 text-forest-700 flex items-center justify-center shrink-0">
                  <Bed className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-stone-500 block">Bedrooms</span>
                  <span className="text-base font-bold text-stone-900">{property.bedrooms} Chambers</span>
                </div>
              </div>

              <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-forest-50 text-forest-700 flex items-center justify-center shrink-0">
                  <Bath className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-stone-500 block">Bathrooms</span>
                  <span className="text-base font-bold text-stone-900">{property.bathrooms} Baths</span>
                </div>
              </div>

              <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-forest-50 text-forest-700 flex items-center justify-center shrink-0">
                  <Maximize2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-stone-500 block">Floor Area</span>
                  <span className="text-base font-bold text-stone-900">{property.floorArea ? `${property.floorArea} m²` : 'Contact Agent'}</span>
                </div>
              </div>

              <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-forest-50 text-forest-700 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-stone-500 block">Lot Area</span>
                  <span className="text-base font-bold text-stone-900">{property.lotArea ? `${property.lotArea} m²` : 'Integrated'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Narrative Overview */}
          <div className="bg-white border border-stone-200/90 rounded-2xl p-6 md:p-8 shadow-card space-y-4">
            <h2 className="text-xl font-serif font-bold text-stone-900">Property Overview & Character</h2>
            <div className="prose prose-stone text-stone-700 leading-relaxed text-sm md:text-base space-y-3">
              <p>
                {property.description ||
                  'This premium architectural residence represents the pinnacle of contemporary urban living. Meticulously designed with generous spatial proportions, floor-to-ceiling double-glazed windows, and natural ventilation throughout. Constructed using high-grade structural concrete, imported marble accents, and energy-efficient lighting fixtures.'}
              </p>
              <p>
                Situated strategically within {property.location}, the property offers immediate proximity to top international schools, metropolitan commercial centers, medical complexes, and primary expressways while maintaining a tranquil, private neighborhood atmosphere.
              </p>
            </div>
          </div>

          {/* Featured Amenities & Highlights */}
          <div className="bg-white border border-stone-200/90 rounded-2xl p-6 md:p-8 shadow-card space-y-4">
            <h2 className="text-xl font-serif font-bold text-stone-900">Key Features & Building Amenities</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-stone-700">
              {[
                '24/7 Gated Security & Smart Access Control',
                'Dedicated Covered Parking Spaces',
                'High-Speed Fiber-Optic Ready Infrastructure',
                'Custom Modular Kitchen with Stone Countertops',
                'Floor-to-Ceiling Windows with Natural Panorama',
                'Complete Title & Clear Documentation Verified',
                'Emergency Power Backup Generators',
                'Landscaped Outdoor Recreation & Courtyards',
              ].map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-stone-50 transition">
                  <div className="w-5 h-5 rounded-full bg-forest-100 text-forest-800 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span className="font-medium text-stone-800">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Agent Card & Contact CTAs */}
        <div className="space-y-6">
          {/* Agent Information Card */}
          <div className="bg-white border border-stone-200/90 rounded-2xl p-6 shadow-card space-y-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">Exclusively Represented By</h3>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-forest-700 text-white flex items-center justify-center font-serif text-xl font-bold shadow-md">
                {property.agent?.fullName ? property.agent.fullName.charAt(0) : 'A'}
              </div>
              <div>
                <h4 className="font-serif font-bold text-base text-stone-900">
                  {property.agent?.fullName || 'Senior Broker Maria Santos'}
                </h4>
                <p className="text-xs text-forest-700 font-semibold">Licensed Real Estate Specialist</p>
                <p className="text-xs text-stone-500 mt-0.5">{property.agent?.email || 'agent.maria@estatecore.local'}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-stone-100 space-y-2 text-xs text-stone-600">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-forest-600 shrink-0" />
                <span>PRC Real Estate License Verified</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-forest-600 shrink-0" />
                <span>Typical response time: Under 2 hours</span>
              </div>
            </div>

            <div className="pt-3 border-t border-stone-100 space-y-2.5">
              <Button
                variant="primary"
                className="w-full shadow-md py-3 text-sm font-semibold"
                onClick={() => setShowApptModal(true)}
              >
                <Calendar className="w-4 h-4 mr-2" />
                <span>Schedule Private Viewing</span>
              </Button>

              <Button
                variant="outline"
                className="w-full py-3 text-sm font-semibold"
                onClick={() => setShowInquiryModal(true)}
              >
                <MessageSquare className="w-4 h-4 mr-2 text-forest-700" />
                <span>Submit Inquiry</span>
              </Button>
            </div>
          </div>

          {/* Quick Property Facts Card */}
          <div className="bg-stone-100/80 border border-stone-200/80 rounded-2xl p-6 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">Property Details Card</h4>
            <div className="divide-y divide-stone-200 text-xs">
              <div className="py-2 flex justify-between">
                <span className="text-stone-500">Property ID</span>
                <span className="font-mono font-semibold text-stone-800">#EC-{property.id.toString().padStart(4, '0')}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-stone-500">Type</span>
                <span className="font-semibold text-stone-800">{property.propertyType}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-stone-500">Transaction</span>
                <span className="font-semibold text-stone-800">{property.listingType === 'SALE' ? 'Outright Sale' : 'Lease Agreement'}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-stone-500">Listing Status</span>
                <span className="font-semibold text-forest-800">{property.status}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-stone-500">Created Date</span>
                <span className="font-semibold text-stone-800">{new Date(property.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Inquiry Modal */}
      <Modal
        isOpen={showInquiryModal}
        onClose={() => setShowInquiryModal(false)}
        title="Submit Property Inquiry"
      >
        <form onSubmit={handleInquirySubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              Property Title
            </label>
            <input
              type="text"
              disabled
              value={property.title}
              className="w-full px-3 py-2 bg-stone-100 border border-stone-300 rounded-xl text-sm text-stone-600 font-medium cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              Subject
            </label>
            <input
              type="text"
              required
              value={inquirySubject}
              onChange={(e) => setInquirySubject(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-forest-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              Contact Phone / WhatsApp
            </label>
            <input
              type="text"
              required
              value={inquiryPhone}
              onChange={(e) => setInquiryPhone(e.target.value)}
              placeholder="+63 917 123 4567"
              className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-forest-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              Message or Specific Questions
            </label>
            <textarea
              required
              rows={4}
              value={inquiryMessage}
              onChange={(e) => setInquiryMessage(e.target.value)}
              placeholder="I am interested in this listing. Please provide payment terms, bank financing options, and association dues."
              className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-forest-600"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setShowInquiryModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={inquirySubmitting}>
              Send Inquiry
            </Button>
          </div>
        </form>
      </Modal>

      {/* Viewing Appointment Modal */}
      <Modal
        isOpen={showApptModal}
        onClose={() => setShowApptModal(false)}
        title="Schedule Private Viewing Appointment"
      >
        <form onSubmit={handleApptSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              Property
            </label>
            <input
              type="text"
              disabled
              value={property.title}
              className="w-full px-3 py-2 bg-stone-100 border border-stone-300 rounded-xl text-sm text-stone-600 font-medium cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Requested Date
              </label>
              <input
                type="date"
                required
                value={apptDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setApptDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-forest-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Preferred Time
              </label>
              <input
                type="time"
                required
                value={apptTime}
                onChange={(e) => setApptTime(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-forest-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              Viewing Notes (Optional)
            </label>
            <textarea
              rows={3}
              value={apptNotes}
              onChange={(e) => setApptNotes(e.target.value)}
              placeholder="e.g., Arriving with architect, will need visitor parking access."
              className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-forest-600"
            />
          </div>

          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-600">
            <strong>Notice:</strong> Your requested viewing slot is subject to agent confirmation. You will receive an appointment status update on your dashboard.
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setShowApptModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={apptSubmitting}>
              Confirm Appointment Request
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
