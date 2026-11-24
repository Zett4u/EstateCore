import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Property, PropertyType, ListingType, PropertyStatus, User } from '../types';
import { ArrowLeft, Save, Building2, MapPin, DollarSign, Bed, Bath, Maximize2, ShieldAlert } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const PropertyForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [agents, setAgents] = useState<User[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [propertyType, setPropertyType] = useState<PropertyType>('CONDOMINIUM');
  const [listingType, setListingType] = useState<ListingType>('SALE');
  const [price, setPrice] = useState<number>(1000000);
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [bedrooms, setBedrooms] = useState<number>(2);
  const [bathrooms, setBathrooms] = useState<number>(1);
  const [floorArea, setFloorArea] = useState<number>(60);
  const [lotArea, setLotArea] = useState<number>(0);
  const [status, setStatus] = useState<PropertyStatus>('AVAILABLE');
  const [agentId, setAgentId] = useState<number | undefined>(undefined);

  useEffect(() => {
    async function loadData() {
      try {
        if (user?.role === 'ADMIN') {
          const userList = await api.getUsers({ role: 'AGENT' });
          setAgents(userList);
        }

        if (isEdit && id) {
          const prop = await api.getProperty(Number(id));

          // Strict ownership check: AGENT cannot edit listings assigned to another agent
          if (user?.role === 'AGENT' && prop.agentId !== user.id) {
            setAuthError('You are not authorized to edit properties assigned to other agents.');
            alert('Access Denied: You are not authorized to edit properties assigned to other agents.');
            navigate('/properties', { replace: true });
            return;
          }

          setTitle(prop.title);
          setDescription(prop.description);
          setPropertyType(prop.propertyType);
          setListingType(prop.listingType);
          setPrice(Number(prop.price));
          setLocation(prop.location);
          setAddress(prop.address);
          setBedrooms(prop.bedrooms);
          setBathrooms(prop.bathrooms);
          setFloorArea(Number(prop.floorArea));
          setLotArea(Number(prop.lotArea));
          setStatus(prop.status);
          setAgentId(prop.agentId || undefined);
        }
      } catch (err: any) {
        alert(err.message || 'Failed to load form data');
        navigate('/properties');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id, isEdit, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      title,
      description,
      propertyType,
      listingType,
      price: Number(price),
      location,
      address,
      bedrooms: Number(bedrooms),
      bathrooms: Number(bathrooms),
      floorArea: Number(floorArea),
      lotArea: Number(lotArea),
      status,
      agentId: user?.role === 'ADMIN' ? agentId : undefined,
    };

    try {
      if (isEdit && id) {
        await api.updateProperty(Number(id), payload);
        alert('Property listing updated successfully!');
      } else {
        await api.createProperty(payload);
        alert('Property listing published successfully!');
      }
      navigate('/properties');
    } catch (err: any) {
      alert(err.message || 'Failed to save property listing.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-forest-700 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-stone-500 text-sm mt-3 font-medium">Loading property editor...</p>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="max-w-md mx-auto p-8 bg-red-50 border border-red-200 rounded-2xl text-center space-y-3">
        <ShieldAlert className="w-10 h-10 text-red-600 mx-auto" />
        <h3 className="font-serif font-bold text-red-900 text-lg">Unauthorized Access</h3>
        <p className="text-xs text-red-700">{authError}</p>
        <Link to="/properties">
          <Button variant="outline" size="sm" className="mt-2">
            Return to Properties
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Top back bar */}
      <div className="flex items-center justify-between pb-6 border-b border-stone-200">
        <div>
          <Link
            to="/properties"
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 transition mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Property Catalog</span>
          </Link>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-stone-900">
            {isEdit ? 'Edit Property Listing' : 'Publish New Property Listing'}
          </h1>
          <p className="text-xs md:text-sm text-stone-500 mt-1">
            Fill in architectural specifications, pricing, and location details.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: General Info */}
        <div className="bg-white border border-stone-200/90 rounded-2xl p-6 md:p-8 shadow-card space-y-5">
          <h2 className="text-base font-serif font-bold text-stone-900 pb-2 border-b border-stone-100">
            1. Title & Narrative Description
          </h2>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
              Property Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. The Grand Botanica Penthouse"
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-forest-600 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
              Property Description *
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe architectural style, finishes, views, orientation, and building features..."
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-forest-600 transition"
            />
          </div>
        </div>

        {/* Section 2: Type, Pricing & Transaction */}
        <div className="bg-white border border-stone-200/90 rounded-2xl p-6 md:p-8 shadow-card space-y-5">
          <h2 className="text-base font-serif font-bold text-stone-900 pb-2 border-b border-stone-100">
            2. Classification & Financials
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Property Type *
              </label>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value as PropertyType)}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-forest-600 font-medium"
              >
                <option value="CONDOMINIUM">Condominium</option>
                <option value="HOUSE">House / Villa</option>
                <option value="TOWNHOUSE">Townhouse</option>
                <option value="APARTMENT">Apartment</option>
                <option value="COMMERCIAL">Commercial</option>
                <option value="LAND">Land / Plot</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Transaction Type *
              </label>
              <select
                value={listingType}
                onChange={(e) => setListingType(e.target.value as ListingType)}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-forest-600 font-medium"
              >
                <option value="SALE">For Sale</option>
                <option value="RENT">For Rent</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Listing Status *
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PropertyStatus)}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-forest-600 font-medium"
              >
                <option value="AVAILABLE">Available</option>
                <option value="RESERVED">Reserved</option>
                <option value="SOLD">Sold</option>
                <option value="RENTED">Rented</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
              Price (PHP ₱) *
            </label>
            <input
              type="number"
              required
              min={1}
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-forest-600 font-mono transition"
            />
          </div>
        </div>

        {/* Section 3: Physical Specifications & Dimensions */}
        <div className="bg-white border border-stone-200/90 rounded-2xl p-6 md:p-8 shadow-card space-y-5">
          <h2 className="text-base font-serif font-bold text-stone-900 pb-2 border-b border-stone-100">
            3. Dimensions & Physical Metrics
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Bedrooms
              </label>
              <input
                type="number"
                min={0}
                value={bedrooms}
                onChange={(e) => setBedrooms(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-forest-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Bathrooms
              </label>
              <input
                type="number"
                min={0}
                value={bathrooms}
                onChange={(e) => setBathrooms(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-forest-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Floor Area (m²)
              </label>
              <input
                type="number"
                min={0}
                value={floorArea}
                onChange={(e) => setFloorArea(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-forest-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Lot Area (m²)
              </label>
              <input
                type="number"
                min={0}
                value={lotArea}
                onChange={(e) => setLotArea(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-forest-600"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Location & Address */}
        <div className="bg-white border border-stone-200/90 rounded-2xl p-6 md:p-8 shadow-card space-y-5">
          <h2 className="text-base font-serif font-bold text-stone-900 pb-2 border-b border-stone-100">
            4. Location & Geographic Address
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                City / Municipality / Province *
              </label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Bonifacio Global City, Taguig"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-forest-600 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Street Address / Landmark
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 5th Avenue corner 28th Street"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-forest-600 transition"
              />
            </div>
          </div>

          {/* Admin only: Agent assignment */}
          {user?.role === 'ADMIN' && (
            <div className="pt-4 border-t border-stone-100">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Assign Listing Agent
              </label>
              <select
                value={agentId || ''}
                onChange={(e) => setAgentId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-forest-600 font-medium"
              >
                <option value="">-- Unassigned (System Default) --</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.fullName} ({agent.email})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Submission Bar */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Link to="/properties">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" variant="primary" loading={submitting} className="px-8 shadow-md">
            <Save className="w-4 h-4 mr-2" />
            <span>{isEdit ? 'Save Changes' : 'Publish Property Listing'}</span>
          </Button>
        </div>
      </form>
    </div>
  );
};
