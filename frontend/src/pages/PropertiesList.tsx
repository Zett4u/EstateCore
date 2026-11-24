import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Property, PropertyType, ListingType, PropertyStatus } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Building, Plus, Search, Filter, Trash2, Edit3, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const PropertiesList: React.FC = () => {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [propertyType, setPropertyType] = useState<string>('');
  const [listingType, setListingType] = useState<string>('');
  const [status, setStatus] = useState<string>('');

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const data = await api.getProperties({
        search,
        propertyType: propertyType || undefined,
        listingType: listingType || undefined,
        status: status || undefined,
      });
      setProperties(data);
    } catch (err) {
      console.error('Failed to fetch properties:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [propertyType, listingType, status]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProperties();
  };

  const handleDelete = async (id: number, title: string) => {
    if (!window.confirm(`Are you sure you want to delete listing '${title}'?`)) return;
    try {
      await api.deleteProperty(id);
      setProperties(properties.filter((p) => p.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete property.');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const canManage = user?.role === 'ADMIN' || user?.role === 'AGENT';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Real Estate Listings</h1>
          <p className="text-sm text-slate-500">Explore and manage available properties for sale and rent.</p>
        </div>
        {canManage && (
          <Link
            to="/properties/new"
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Listing</span>
          </Link>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, location, or address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium rounded-lg transition"
          >
            Search
          </button>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 text-xs">
          <div>
            <label className="block text-slate-500 mb-1 font-medium">Property Type</label>
            <select
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              className="w-full py-1.5 px-2 border border-slate-300 rounded-lg focus:ring-blue-600"
            >
              <option value="">All Types</option>
              <option value="CONDOMINIUM">Condominium</option>
              <option value="HOUSE">House</option>
              <option value="TOWNHOUSE">Townhouse</option>
              <option value="APARTMENT">Apartment</option>
              <option value="COMMERCIAL">Commercial</option>
              <option value="LAND">Land</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-500 mb-1 font-medium">Listing Type</label>
            <select
              value={listingType}
              onChange={(e) => setListingType(e.target.value)}
              className="w-full py-1.5 px-2 border border-slate-300 rounded-lg focus:ring-blue-600"
            >
              <option value="">All Listings</option>
              <option value="SALE">For Sale</option>
              <option value="RENT">For Rent</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-500 mb-1 font-medium">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full py-1.5 px-2 border border-slate-300 rounded-lg focus:ring-blue-600"
            >
              <option value="">All Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="RESERVED">Reserved</option>
              <option value="SOLD">Sold</option>
              <option value="RENTED">Rented</option>
            </select>
          </div>
        </div>
      </div>

      {/* Property Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : properties.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">
          <Building className="w-8 h-8 mx-auto text-slate-400 mb-2" />
          <p className="font-medium">No properties match your search criteria.</p>
          <p className="text-xs text-slate-400 mt-1">Try resetting the filters or searching with different keywords.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {properties.map((prop) => {
            const isOwner = user?.role === 'ADMIN' || (user?.role === 'AGENT' && prop.agentId === user.id);
            return (
              <div
                key={prop.id}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:border-slate-300 transition flex flex-col justify-between"
              >
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      {prop.listingType} • {prop.propertyType}
                    </span>
                    <StatusBadge status={prop.status} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 text-base">{prop.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{prop.location}</p>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2">{prop.description}</p>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>{prop.bedrooms} Beds • {prop.bathrooms} Baths</span>
                    <span>{prop.floorArea} sqm</span>
                  </div>
                  {prop.agent && (
                    <div className="text-[11px] text-slate-400">
                      Agent: <span className="font-medium text-slate-600">{prop.agent.fullName}</span>
                    </div>
                  )}
                </div>

                <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-base font-bold text-slate-900">{formatPrice(prop.price)}</span>
                  <div className="flex items-center space-x-2">
                    <Link
                      to={`/properties/${prop.id}`}
                      className="px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded border border-blue-200 transition flex items-center space-x-1"
                    >
                      <span>View</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                    {isOwner && (
                      <>
                        <Link
                          to={`/properties/${prop.id}/edit`}
                          className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded transition"
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(prop.id, prop.title)}
                          className="p-1 text-red-600 hover:text-red-700 hover:bg-red-100 rounded transition"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
