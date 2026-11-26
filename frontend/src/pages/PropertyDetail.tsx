import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Property, PropertyPhoto } from '../types';
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
  Camera,
  DollarSign,
  Plus,
  Image as ImageIcon,
  Receipt,
} from 'lucide-react';

export const PropertyDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [property, setProperty] = useState<Property | null>(null);
  const [photosList, setPhotosList] = useState<PropertyPhoto[]>([]);
  const [loading, setLoading] = useState(true);

  // Inquiry form modal state
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [inquiryType, setInquiryType] = useState('Inquiry');
  const [offerAmount, setOfferAmount] = useState<number | ''>('');
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

  // Photo upload modal state
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoCaption, setPhotoCaption] = useState('');
  const [photoUploading, setPhotoUploading] = useState(false);

  useEffect(() => {
    async function loadProperty() {
      if (!id) return;
      try {
        const propId = Number(id);
        const data = await api.getProperty(propId);
        setProperty(data);
        setInquirySubject(`Inquiry regarding ${data.title}`);

        try {
          const photosRes = await api.getPropertyPhotos(propId);
          setPhotosList(photosRes.data || []);
        } catch {
          setPhotosList(data.photos || []);
        }
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
      await api.createPropertyInquiry(property.id, {
        subject: inquirySubject,
        message: inquiryMessage,
        inquiryType,
        offerAmount: offerAmount ? Number(offerAmount) : undefined,
        contactNumber: inquiryPhone || 'N/A',
      });
      alert(
        inquiryType === 'Offer'
          ? 'Your price offer has been submitted! The listing agent will review your offer.'
          : 'Your inquiry has been submitted! An assigned agent will respond promptly.'
      );
      setShowInquiryModal(false);
      setInquiryMessage('');
      setOfferAmount('');
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

  const handlePhotoUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!property) return;
    if (!photoFile && !photoUrl) {
      alert('Please select an image file or enter an image URL.');
      return;
    }

    setPhotoUploading(true);
    try {
      if (photoFile) {
        const formData = new FormData();
        formData.append('photo', photoFile);
        if (photoCaption) formData.append('caption', photoCaption);
        await api.uploadPropertyPhoto(property.id, formData);
      } else {
        await api.uploadPropertyPhoto(property.id, {
          filePath: photoUrl,
          caption: photoCaption || undefined,
        });
      }
      alert('Property photo uploaded and attached successfully!');
      setShowPhotoModal(false);
      setPhotoUrl('');
      setPhotoFile(null);
      setPhotoCaption('');
      const photosRes = await api.getPropertyPhotos(property.id);
      setPhotosList(photosRes.data || []);
    } catch (err: any) {
      alert(err.message || 'Failed to upload photo.');
    } finally {
      setPhotoUploading(false);
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

  const assignedAgentUserId = property.agent?.userId ?? property.agent?.user?.id;
  const isOwner = user?.role === 'ADMIN' || (user?.role === 'AGENT' && assignedAgentUserId === user.id) || (user?.role === 'CLIENT' && property.ownerId === user.id);
  const isAssignedAgentOrAdmin = user?.role === 'ADMIN' || (user?.role === 'AGENT' && assignedAgentUserId === user.id);
  const imageSrc = getPropertyImage(property.id, property.propertyType);
  const containerClasses = user
    ? 'space-y-8'
    : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8';

  return (
    <div className={containerClasses}>
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPhotoModal(true)}
              className="text-stone-700 border-stone-300 hover:bg-stone-50"
            >
              <Camera className="w-3.5 h-3.5 mr-1.5" />
              <span>Add Photo</span>
            </Button>
            {isAssignedAgentOrAdmin && (
              <Link to="/transactions">
                <Button variant="outline" size="sm" className="text-forest-700 border-forest-300 hover:bg-forest-50">
                  <Receipt className="w-3.5 h-3.5 mr-1.5" />
                  <span>Record Deal</span>
                </Button>
              </Link>
            )}
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
        {/* Left Column: Specs, Narrative, Photos */}
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
                  <span className="text-xs text-stone-500 block">Floor Space</span>
                  <span className="text-base font-bold text-stone-900">{property.floorArea} sqm</span>
                </div>
              </div>

              <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-forest-50 text-forest-700 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-stone-500 block">Lot Extent</span>
                  <span className="text-base font-bold text-stone-900">{property.lotArea} sqm</span>
                </div>
              </div>
            </div>
          </div>

          {/* Narrative Dossier */}
          <div className="bg-white border border-stone-200/90 rounded-2xl p-6 md:p-8 shadow-card space-y-4">
            <h2 className="text-xl font-serif font-bold text-stone-900 tracking-tight">Property Overview</h2>
            <p className="text-stone-700 text-sm md:text-base leading-relaxed whitespace-pre-line font-serif">
              {property.description}
            </p>
          </div>

          {/* Photo Gallery (Lab 04/05 PropertyPhoto) */}
          <div className="bg-white border border-stone-200/90 rounded-2xl p-6 md:p-8 shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-serif font-bold text-stone-900 tracking-tight">Photo Gallery</h2>
                <p className="text-xs text-stone-500">Official verified property photography.</p>
              </div>
              {isOwner && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPhotoModal(true)}
                  className="flex items-center space-x-1.5 text-xs text-forest-700 border-forest-300"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Attach Photo</span>
                </Button>
              )}
            </div>

            {photosList.length === 0 ? (
              <div className="p-8 text-center text-stone-400 bg-stone-50 rounded-xl border border-stone-200/60">
                <ImageIcon className="w-8 h-8 mx-auto mb-2 text-stone-300" />
                <p className="text-xs">No additional photos attached to this listing.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {photosList.map((photo, idx) => (
                  <div
                    key={photo.photoId || photo.id || idx}
                    className="group relative rounded-xl overflow-hidden aspect-[4/3] bg-stone-100 border border-stone-200 shadow-sm"
                  >
                    <img
                      src={photo.filePath}
                      alt={photo.caption || property.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {photo.caption && (
                      <div className="absolute inset-x-0 bottom-0 bg-stone-900/70 p-2 text-white text-[11px] truncate">
                        {photo.caption}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Assigned Agent Card & Action Portal */}
        <div className="space-y-6">
          <div className="bg-white border border-stone-200/90 rounded-2xl p-6 shadow-card space-y-6 sticky top-24">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-2">
                Assigned Representation
              </span>
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-2xl bg-forest-700 text-white font-serif font-bold text-xl flex items-center justify-center shrink-0 shadow-sm">
                  {property.agent?.user?.fullName?.charAt(0) || property.agent?.fullName?.charAt(0) || 'E'}
                </div>
                <div>
                  <h3 className="font-serif font-bold text-stone-900 text-lg leading-tight">
                    {property.agent?.user?.fullName || property.agent?.fullName || 'EstateCore Broker'}
                  </h3>
                  <p className="text-xs text-stone-500 font-mono">
                    PRC #{property.agent?.id ? `REB-00${property.agent.id}82` : 'VERIFIED'}
                  </p>
                  <p className="text-xs text-forest-700 font-medium mt-0.5">
                    Licensed Real Estate Specialist
                  </p>
                </div>
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

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="w-full py-2.5 text-xs font-semibold"
                  onClick={() => {
                    setInquiryType('Inquiry');
                    setShowInquiryModal(true);
                  }}
                >
                  <MessageSquare className="w-3.5 h-3.5 mr-1.5 text-forest-700" />
                  <span>Send Inquiry</span>
                </Button>

                <Button
                  variant="outline"
                  className="w-full py-2.5 text-xs font-semibold text-amber-700 border-amber-300 hover:bg-amber-50"
                  onClick={() => {
                    setInquiryType('Offer');
                    setShowInquiryModal(true);
                  }}
                >
                  <DollarSign className="w-3.5 h-3.5 mr-1.5" />
                  <span>Make an Offer</span>
                </Button>
              </div>
            </div>

            {/* Quick Property Facts Card */}
            <div className="bg-stone-50/80 border border-stone-200/80 rounded-2xl p-4 space-y-2 text-xs">
              <div className="py-1 flex justify-between">
                <span className="text-stone-500">Property ID</span>
                <span className="font-mono font-semibold text-stone-800">#EC-{property.id.toString().padStart(4, '0')}</span>
              </div>
              <div className="py-1 flex justify-between">
                <span className="text-stone-500">Type</span>
                <span className="font-semibold text-stone-800">{property.propertyType}</span>
              </div>
              <div className="py-1 flex justify-between">
                <span className="text-stone-500">Transaction</span>
                <span className="font-semibold text-stone-800">{property.listingType === 'SALE' ? 'Outright Sale' : 'Lease Agreement'}</span>
              </div>
              <div className="py-1 flex justify-between">
                <span className="text-stone-500">Listing Status</span>
                <span className="font-semibold text-forest-800">{property.status}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Inquiry / Offer Modal */}
      <Modal
        isOpen={showInquiryModal}
        onClose={() => setShowInquiryModal(false)}
        title={inquiryType === 'Offer' ? 'Submit Formal Price Offer' : 'Submit Property Inquiry'}
      >
        <form onSubmit={handleInquirySubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              Property Listing
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
                Inquiry Type
              </label>
              <select
                value={inquiryType}
                onChange={(e) => setInquiryType(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-forest-600"
              >
                <option value="Inquiry">General Inquiry</option>
                <option value="Offer">Formal Price Offer</option>
              </select>
            </div>

            {inquiryType === 'Offer' ? (
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Offer Amount (PHP) *
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 4500000"
                  value={offerAmount}
                  onChange={(e) => setOfferAmount(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-forest-600"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Callback Contact
                </label>
                <input
                  type="text"
                  placeholder="e.g. 09171234567"
                  value={inquiryPhone}
                  onChange={(e) => setInquiryPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-forest-600"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              Message / Inquiries *
            </label>
            <textarea
              required
              rows={4}
              value={inquiryMessage}
              onChange={(e) => setInquiryMessage(e.target.value)}
              placeholder={
                inquiryType === 'Offer'
                  ? 'I would like to make an offer of the stated price subject to property inspection.'
                  : 'I am interested in this listing. Please provide payment terms, bank financing options, and association dues.'
              }
              className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-forest-600"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setShowInquiryModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={inquirySubmitting}>
              {inquiryType === 'Offer' ? 'Transmit Price Offer' : 'Send Inquiry'}
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

      {/* Photo Upload Modal (Lab 05 EP 14) */}
      <Modal
        isOpen={showPhotoModal}
        onClose={() => setShowPhotoModal(false)}
        title="Upload Property Photograph"
      >
        <form onSubmit={handlePhotoUpload} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              Upload Image File
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setPhotoFile(e.target.files[0]);
                }
              }}
              className="w-full text-xs text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-forest-50 file:text-forest-700 hover:file:bg-forest-100"
            />
          </div>

          <div className="text-center text-xs text-stone-400 font-bold uppercase">— OR —</div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              Image URL / File Path
            </label>
            <input
              type="text"
              placeholder="https://... or /uploads/properties/..."
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-forest-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              Photo Caption (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Master Bedroom with garden view"
              value={photoCaption}
              onChange={(e) => setPhotoCaption(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-forest-600"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setShowPhotoModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={photoUploading}>
              Attach Photo to Listing
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
