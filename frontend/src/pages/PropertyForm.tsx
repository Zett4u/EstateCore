import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Property, PropertyType, ListingType, PropertyStatus, User } from '../types';
import { ArrowLeft, Save } from 'lucide-react';

export const PropertyForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [agents, setAgents] = useState<User[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

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
        alert('Property listing created successfully!');
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
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/properties"
          className="inline-flex items-center space-x-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Properties</span>
        </Link>
        <h1 className="text-xl font-bold text-slate-900">
          {isEdit ? 'Edit Property Listing' : 'Create New Property Listing'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-600"
              placeholder="e.g. Modern Two-Storey Residence with Garden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">Description</label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-600"
              placeholder="Detailed description of features, materials, and community amenities..."
            ></textarea>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">Property Type</label>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value as PropertyType)}
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-blue-600"
              >
                <option value="CONDOMINIUM">Condominium</option>
                <option value="HOUSE">House</option>
                <option value="TOWNHOUSE">Townhouse</option>
                <option value="APARTMENT">Apartment</option>
                <option value="COMMERCIAL">Commercial</option>
                <option value="LAND">Land</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">Listing Type</label>
              <select
                value={listingType}
                onChange={(e) => setListingType(e.target.value as ListingType)}
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-blue-600"
              >
                <option value="SALE">For Sale</option>
                <option value="RENT">For Rent</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PropertyStatus)}
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-blue-600"
              >
                <option value="AVAILABLE">Available</option>
                <option value="RESERVED">Reserved</option>
                <option value="SOLD">Sold</option>
                <option value="RENTED">Rented</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">Price (PHP)</label>
              <input
                type="number"
                required
                min={0}
                step="1000"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">City / Location</label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-600"
                placeholder="e.g. Makati City, Metro Manila"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">Full Street Address</label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-600"
              placeholder="e.g. Unit 1804 Grand Tower, Dela Rosa Street"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">Bedrooms</label>
              <input
                type="number"
                min={0}
                value={bedrooms}
                onChange={(e) => setBedrooms(Number(e.target.value))}
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">Bathrooms</label>
              <input
                type="number"
                min={0}
                value={bathrooms}
                onChange={(e) => setBathrooms(Number(e.target.value))}
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">Floor Area (sqm)</label>
              <input
                type="number"
                min={0}
                value={floorArea}
                onChange={(e) => setFloorArea(Number(e.target.value))}
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">Lot Area (sqm)</label>
              <input
                type="number"
                min={0}
                value={lotArea}
                onChange={(e) => setLotArea(Number(e.target.value))}
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5"
              />
            </div>
          </div>

          {user?.role === 'ADMIN' && (
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">Assigned Agent</label>
              <select
                value={agentId || ''}
                onChange={(e) => setAgentId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5"
              >
                <option value="">Unassigned / Admin</option>
                {agents.map((ag) => (
                  <option key={ag.id} value={ag.id}>
                    {ag.fullName} ({ag.email})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
          <Link
            to="/properties"
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center space-x-1.5 px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm disabled:opacity-50 transition"
          >
            <Save className="w-4 h-4" />
            <span>{submitting ? 'Saving...' : 'Save Property'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
