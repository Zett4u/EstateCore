import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Property, PropertyType, ListingType, PropertyStatus } from '../types';
import { getPropertyImage, formatPHP } from '../lib/utils';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import {
  Building2,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit3,
  ArrowRight,
  Bed,
  Bath,
  Maximize2,
  MapPin,
  SlidersHorizontal,
  RotateCcw,
} from 'lucide-react';

export const PropertiesList: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters initialized from search query parameters if available
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [propertyType, setPropertyType] = useState<string>(searchParams.get('type') || '');
  const [listingType, setListingType] = useState<string>(searchParams.get('listing') || '');
  const [status, setStatus] = useState<string>(searchParams.get('status') || '');

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const data = await api.getProperties({
        search: search || undefined,
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

  const handleResetFilters = () => {
    setSearch('');
    setPropertyType('');
    setListingType('');
    setStatus('');
    setSearchParams({});
    api.getProperties().then(setProperties).catch(console.error);
  };

  const handleDelete = async (id: number, title: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete listing '${title}'?`)) return;
    try {
      await api.deleteProperty(id);
      setProperties(properties.filter((p) => p.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete property.');
    }
  };

  const canManage = user?.role === 'ADMIN' || user?.role === 'AGENT';

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-forest-700">EstateCore Catalog</span>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-stone-900 tracking-tight mt-1">
            Curated Real Estate Portfolio
          </h1>
          <p className="text-sm md:text-base text-stone-600 mt-1">
            Browse premium residential developments, penthouses, modern villas, and commercial assets.
          </p>
        </div>
        {canManage && (
          <Link to="/properties/new">
            <Button variant="primary" className="shrink-0">
              <Plus className="w-4 h-4 mr-2" />
              <span>Publish New Listing</span>
            </Button>
          </Link>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-card space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-stone-400" />
            <input
              type="text"
              placeholder="Search by property title, municipality, or street address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-forest-600 focus:border-forest-600 transition"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" variant="primary" className="px-5">
              Search
            </Button>
            {(search || propertyType || listingType || status) && (
              <Button type="button" variant="outline" onClick={handleResetFilters} title="Reset filters">
                <RotateCcw className="w-4 h-4 text-stone-600" />
              </Button>
            )}
          </div>
        </form>

        {/* Filter dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-stone-100 text-xs">
          <div>
            <label className="block text-stone-500 font-semibold mb-1">Property Type</label>
            <select
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              className="w-full py-2 px-3 bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-forest-600 text-stone-800 font-medium"
            >
              <option value="">All Architectural Types</option>
              <option value="CONDOMINIUM">Condominium</option>
              <option value="HOUSE">House / Villa</option>
              <option value="TOWNHOUSE">Townhouse</option>
              <option value="APARTMENT">Apartment</option>
              <option value="COMMERCIAL">Commercial</option>
              <option value="LAND">Land / Plot</option>
            </select>
          </div>

          <div>
            <label className="block text-stone-500 font-semibold mb-1">Listing Type</label>
            <select
              value={listingType}
              onChange={(e) => setListingType(e.target.value)}
              className="w-full py-2 px-3 bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-forest-600 text-stone-800 font-medium"
            >
              <option value="">All Transactions</option>
              <option value="SALE">For Sale</option>
              <option value="RENT">For Rent</option>
            </select>
          </div>

          <div>
            <label className="block text-stone-500 font-semibold mb-1">Listing Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full py-2 px-3 bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-forest-600 text-stone-800 font-medium"
            >
              <option value="">All Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="RESERVED">Reserved</option>
              <option value="SOLD">Sold</option>
              <option value="RENTED">Rented</option>
            </select>
          </div>

          <div className="flex flex-col justify-end">
            <p className="text-[11px] text-stone-500 pb-2">
              Showing <span className="font-semibold text-stone-800">{properties.length}</span> listed properties
            </p>
          </div>
        </div>
      </div>

      {/* Property Cards Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-forest-700 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-stone-500 text-sm mt-4 font-medium">Loading catalog records from database...</p>
        </div>
      ) : properties.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center max-w-xl mx-auto shadow-sm">
          <div className="w-14 h-14 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-serif font-bold text-stone-900 mb-2">No Matching Properties Found</h3>
          <p className="text-stone-500 text-sm mb-6">
            We couldn't find any listings matching your current filter criteria. Try adjusting your search keywords or resetting filters.
          </p>
          <Button variant="outline" onClick={handleResetFilters}>
            Reset Search Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((prop) => {
            const isOwner = user?.role === 'ADMIN' || (user?.role === 'AGENT' && prop.agentId === user.id);
            const imageSrc = getPropertyImage(prop.id, prop.propertyType);

            return (
              <div
                key={prop.id}
                className="group bg-white rounded-2xl border border-stone-200/90 overflow-hidden shadow-subtle hover:shadow-card transition-all duration-300 flex flex-col"
              >
                {/* Photo Thumbnail */}
                <div className="relative aspect-[16/10] overflow-hidden bg-stone-100">
                  <img
                    src={imageSrc}
                    alt={prop.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/60 via-transparent to-black/20 pointer-events-none" />

                  {/* Badges on image */}
                  <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
                    <Badge variant={prop.listingType === 'SALE' ? 'forest' : 'blue'}>
                      {prop.listingType === 'SALE' ? 'For Sale' : 'For Rent'}
                    </Badge>
                    <Badge
                      variant={
                        prop.status === 'AVAILABLE'
                          ? 'forest'
                          : prop.status === 'RESERVED'
                          ? 'amber'
                          : 'stone'
                      }
                    >
                      {prop.status}
                    </Badge>
                  </div>

                  <div className="absolute top-3 right-3">
                    <span className="bg-stone-900/85 backdrop-blur-sm text-stone-200 text-[11px] font-medium px-2 py-0.5 rounded-md">
                      {prop.propertyType}
                    </span>
                  </div>

                  {/* Price Tag Overlay */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-baseline justify-between text-white">
                    <div>
                      <span className="text-xl font-bold tracking-tight text-white drop-shadow-sm font-sans">
                        {formatPHP(prop.price)}
                      </span>
                      {prop.listingType === 'RENT' && <span className="text-xs text-stone-200 font-normal"> / month</span>}
                    </div>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-serif font-bold text-lg text-stone-900 group-hover:text-forest-700 transition line-clamp-1">
                      {prop.title}
                    </h3>
                    <p className="text-xs text-stone-500 flex items-center mt-1">
                      <MapPin className="w-3.5 h-3.5 mr-1 text-stone-400 shrink-0" />
                      <span className="truncate">{prop.location}</span>
                    </p>

                    <p className="text-xs text-stone-600 mt-3 line-clamp-2 leading-relaxed">
                      {prop.description || 'Exclusive property listing with modern architectural design, premium finishes, and strategic metropolitan access.'}
                    </p>
                  </div>

                  {/* Specifications bar */}
                  <div className="pt-4 mt-4 border-t border-stone-100">
                    <div className="flex items-center justify-between text-xs text-stone-600 mb-4">
                      <span className="flex items-center gap-1 font-medium">
                        <Bed className="w-3.5 h-3.5 text-stone-400" />
                        {prop.bedrooms} {prop.bedrooms === 1 ? 'Bed' : 'Beds'}
                      </span>
                      <span className="text-stone-300">•</span>
                      <span className="flex items-center gap-1 font-medium">
                        <Bath className="w-3.5 h-3.5 text-stone-400" />
                        {prop.bathrooms} {prop.bathrooms === 1 ? 'Bath' : 'Baths'}
                      </span>
                      <span className="text-stone-300">•</span>
                      <span className="flex items-center gap-1 font-medium">
                        <Maximize2 className="w-3.5 h-3.5 text-stone-400" />
                        {prop.floorArea ? `${prop.floorArea} sqm` : 'N/A'}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-100/80">
                      <Link
                        to={`/properties/${prop.id}`}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-stone-100 hover:bg-forest-50 hover:text-forest-800 text-stone-800 text-xs font-semibold transition"
                      >
                        <span>View Details</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>

                      {isOwner && (
                        <div className="flex items-center gap-1">
                          <Link
                            to={`/properties/${prop.id}/edit`}
                            className="p-2 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition"
                            title="Edit Listing"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(prop.id, prop.title)}
                            className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Delete Listing"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
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
