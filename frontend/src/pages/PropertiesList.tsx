import React, { useEffect, useState, useMemo } from 'react';
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
  X,
  RotateCcw,
  SlidersHorizontal,
  Home,
  Building,
  Landmark,
  Trees,
  Check,
} from 'lucide-react';

const PROPERTY_CATEGORIES = [
  { key: '', label: 'All Categories', icon: Building2 },
  { key: 'CONDOMINIUM', label: 'Condominiums', icon: Building },
  { key: 'HOUSE', label: 'Houses & Villas', icon: Home },
  { key: 'TOWNHOUSE', label: 'Townhouses', icon: Landmark },
  { key: 'APARTMENT', label: 'Apartments', icon: Building2 },
  { key: 'COMMERCIAL', label: 'Commercial', icon: Building },
  { key: 'LAND', label: 'Land & Plots', icon: Trees },
];

export const PropertiesList: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Read initial query params from URL (supporting both parameter naming schemes)
  const querySearch = searchParams.get('search') || searchParams.get('q') || '';
  const queryPropType = searchParams.get('propertyType') || searchParams.get('type') || '';
  const queryListingType = searchParams.get('listingType') || searchParams.get('listing') || '';
  const queryStatus = searchParams.get('status') || '';
  const queryMaxPrice = searchParams.get('maxPrice') || '';

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  // Active filter state
  const [search, setSearch] = useState(querySearch);
  const [propertyType, setPropertyType] = useState<string>(queryPropType);
  const [listingType, setListingType] = useState<string>(queryListingType);
  const [status, setStatus] = useState<string>(queryStatus);
  const [maxPrice, setMaxPrice] = useState<string>(queryMaxPrice);
  const [sortBy, setSortBy] = useState<string>('newest');

  // Synchronize state whenever URL search parameters change (e.g. from LandingPage or browser navigation)
  useEffect(() => {
    setSearch(querySearch);
    setPropertyType(queryPropType);
    setListingType(queryListingType);
    setStatus(queryStatus);
    setMaxPrice(queryMaxPrice);
  }, [searchParams]);

  const updateURLParams = (newParams: Record<string, string>) => {
    const params = new URLSearchParams();
    const merged = {
      search,
      propertyType,
      listingType,
      status,
      maxPrice,
      ...newParams,
    };

    Object.entries(merged).forEach(([key, val]) => {
      if (val) params.set(key, val);
    });

    setSearchParams(params);
  };

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const data = await api.getProperties({
        search: search || undefined,
        propertyType: propertyType || undefined,
        listingType: listingType || undefined,
        status: status || undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
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
  }, [propertyType, listingType, status, maxPrice]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateURLParams({ search });
    fetchProperties();
  };

  const handleSelectCategory = (catKey: string) => {
    setPropertyType(catKey);
    updateURLParams({ propertyType: catKey });
  };

  const handleSelectListingType = (typeKey: string) => {
    setListingType(typeKey);
    updateURLParams({ listingType: typeKey });
  };

  const handleResetFilters = () => {
    setSearch('');
    setPropertyType('');
    setListingType('');
    setStatus('');
    setMaxPrice('');
    setSortBy('newest');
    setSearchParams(new URLSearchParams());
    api.getProperties().then(setProperties).catch(console.error);
  };

  const handleDelete = async (id: number, title: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete listing '${title}'?`)) return;
    try {
      await api.deleteProperty(id);
      setProperties(properties.filter((p) => p.id !== id));
      alert('Listing deleted successfully.');
    } catch (err: any) {
      alert(err.message || 'Failed to delete property.');
    }
  };

  // Client-side sorting applied on filtered results
  const sortedProperties = useMemo(() => {
    const list = [...properties];
    if (sortBy === 'price-asc') {
      list.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => Number(b.price) - Number(a.price));
    } else {
      // Default: newest first
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return list;
  }, [properties, sortBy]);

  const canManage = user?.role === 'ADMIN' || user?.role === 'AGENT';
  const hasActiveFilters = Boolean(search || propertyType || listingType || status || maxPrice);

  return (
    <div className="space-y-8">
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-forest-700">EstateCore Catalog</span>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-stone-900 tracking-tight mt-1">
            Curated Real Estate Portfolio
          </h1>
          <p className="text-sm md:text-base text-stone-600 mt-1">
            Explore verified condominiums, luxury residences, townhouses, and prime commercial plots.
          </p>
        </div>
        {canManage && (
          <Link to="/properties/new">
            <Button variant="primary" className="shrink-0 shadow-sm">
              <Plus className="w-4 h-4 mr-2" />
              <span>Publish New Listing</span>
            </Button>
          </Link>
        )}
      </div>

      {/* 2. Interactive Category Tabs Bar */}
      <div className="overflow-x-auto pb-2 -mb-2 no-scrollbar">
        <div className="flex items-center space-x-2 min-w-max">
          {PROPERTY_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = propertyType === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => handleSelectCategory(cat.key)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition duration-150 border ${
                  isSelected
                    ? 'bg-forest-700 text-white border-forest-700 shadow-sm'
                    : 'bg-white text-stone-700 border-stone-200/90 hover:bg-stone-50 hover:border-stone-300'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-stone-400'}`} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Search & Comprehensive Filter Controls */}
      <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-card space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-stone-400" />
            <input
              type="text"
              placeholder="Search by property title, municipality, location, or street address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-forest-600 focus:border-forest-600 transition"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  updateURLParams({ search: '' });
                  api.getProperties({
                    propertyType: propertyType || undefined,
                    listingType: listingType || undefined,
                    status: status || undefined,
                    maxPrice: maxPrice ? Number(maxPrice) : undefined,
                  }).then(setProperties).catch(console.error);
                }}
                className="absolute right-3 top-3 text-stone-400 hover:text-stone-700"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="submit" variant="primary" className="px-6 font-semibold">
              Search
            </Button>
            {hasActiveFilters && (
              <Button
                type="button"
                variant="outline"
                onClick={handleResetFilters}
                className="text-stone-600"
                title="Reset all filters"
              >
                <RotateCcw className="w-4 h-4 mr-1.5" />
                <span>Reset</span>
              </Button>
            )}
          </div>
        </form>

        {/* Filter Toolbar: Listing Type, Status, Max Price, Sorting */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-3 border-t border-stone-100 text-xs">
          {/* Transaction Toggle */}
          <div>
            <label className="block text-stone-500 font-semibold mb-1">Transaction Type</label>
            <div className="flex bg-stone-100 p-0.5 rounded-xl border border-stone-200">
              <button
                type="button"
                onClick={() => handleSelectListingType('')}
                className={`flex-1 py-1.5 rounded-lg font-medium transition ${
                  listingType === '' ? 'bg-white text-stone-900 shadow-sm font-semibold' : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => handleSelectListingType('SALE')}
                className={`flex-1 py-1.5 rounded-lg font-medium transition ${
                  listingType === 'SALE' ? 'bg-white text-stone-900 shadow-sm font-semibold' : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                For Sale
              </button>
              <button
                type="button"
                onClick={() => handleSelectListingType('RENT')}
                className={`flex-1 py-1.5 rounded-lg font-medium transition ${
                  listingType === 'RENT' ? 'bg-white text-stone-900 shadow-sm font-semibold' : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                For Rent
              </button>
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-stone-500 font-semibold mb-1">Listing Status</label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                updateURLParams({ status: e.target.value });
              }}
              className="w-full py-2 px-3 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-forest-600 text-stone-800 font-medium"
            >
              <option value="">All Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="RESERVED">Reserved</option>
              <option value="SOLD">Sold</option>
              <option value="RENTED">Rented</option>
            </select>
          </div>

          {/* Max Price Filter */}
          <div>
            <label className="block text-stone-500 font-semibold mb-1">Price Range</label>
            <select
              value={maxPrice}
              onChange={(e) => {
                setMaxPrice(e.target.value);
                updateURLParams({ maxPrice: e.target.value });
              }}
              className="w-full py-2 px-3 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-forest-600 text-stone-800 font-medium"
            >
              <option value="">All Price Tiers</option>
              <option value="100000">Under ₱100,000 / mo</option>
              <option value="5000000">Under ₱5,000,000</option>
              <option value="20000000">Under ₱20,000,000</option>
              <option value="50000000">Under ₱50,000,000</option>
            </select>
          </div>

          {/* Sorting Control */}
          <div>
            <label className="block text-stone-500 font-semibold mb-1">Sort Catalog By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full py-2 px-3 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-forest-600 text-stone-800 font-medium"
            >
              <option value="newest">Newest First</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* 4. Active Filter Chips & Results Count */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-100 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-stone-500 font-semibold">Active Filters:</span>
            {!hasActiveFilters && <span className="text-stone-400 italic">None (Displaying full portfolio)</span>}

            {propertyType && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-forest-50 text-forest-800 border border-forest-200 font-semibold">
                Type: {propertyType}
                <button type="button" onClick={() => handleSelectCategory('')} className="hover:text-forest-950">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {listingType && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 font-semibold">
                {listingType === 'SALE' ? 'For Sale' : 'For Rent'}
                <button type="button" onClick={() => handleSelectListingType('')} className="hover:text-blue-950">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {status && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
                Status: {status}
                <button type="button" onClick={() => { setStatus(''); updateURLParams({ status: '' }); }} className="hover:text-amber-950">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {search && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 text-stone-800 border border-stone-200 font-semibold">
                Keyword: "{search}"
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    updateURLParams({ search: '' });
                    api.getProperties({
                      propertyType: propertyType || undefined,
                      listingType: listingType || undefined,
                      status: status || undefined,
                      maxPrice: maxPrice ? Number(maxPrice) : undefined,
                    }).then(setProperties).catch(console.error);
                  }}
                  className="hover:text-stone-950"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>

          <p className="text-stone-500 font-medium">
            Showing <span className="font-bold text-stone-900">{sortedProperties.length}</span> curated properties
          </p>
        </div>
      </div>

      {/* 5. Property Cards Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-forest-700 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-stone-500 text-sm mt-4 font-medium">Loading catalog records from database...</p>
        </div>
      ) : sortedProperties.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-3xl p-12 text-center max-w-xl mx-auto shadow-card space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
            <Building2 className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-serif font-bold text-stone-900">No Matching Properties Found</h3>
          <p className="text-stone-500 text-sm leading-relaxed max-w-sm mx-auto">
            No active listings matched your filter criteria. Try resetting your search filters to view available portfolio holdings.
          </p>
          <Button variant="primary" onClick={handleResetFilters} className="px-6">
            <RotateCcw className="w-4 h-4 mr-2" />
            <span>Reset All Filters</span>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedProperties.map((prop) => {
            const isOwner = user?.role === 'ADMIN' || (user?.role === 'AGENT' && prop.agentId === user.id);
            const imageSrc = getPropertyImage(prop.id, prop.propertyType);

            return (
              <div
                key={prop.id}
                className="group bg-white rounded-3xl border border-stone-200/90 overflow-hidden shadow-subtle hover:shadow-card transition-all duration-300 flex flex-col justify-between"
              >
                {/* Photo Header */}
                <div className="relative aspect-[16/10] overflow-hidden bg-stone-100">
                  <img
                    src={imageSrc}
                    alt={prop.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    onError={(e) => {
                      // High-contrast clean architectural SVG fallback
                      e.currentTarget.src =
                        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='500' viewBox='0 0 800 500'%3E%3Crect width='800' height='500' fill='%231B4332'/%3E%3Ctext x='50%25' y='50%25' fill='%23FAF9F6' font-family='serif' font-size='24' text-anchor='middle' dominant-baseline='middle'%3EEstateCore Architectural Portfolio%3C/text%3E%3C/svg%3E";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-transparent to-black/20 pointer-events-none" />

                  {/* Badges on image */}
                  <div className="absolute top-3.5 left-3.5 flex gap-1.5 flex-wrap">
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

                  <div className="absolute top-3.5 right-3.5">
                    <span className="bg-stone-950/80 backdrop-blur-md text-stone-200 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg">
                      {prop.propertyType}
                    </span>
                  </div>

                  {/* Price Tag Overlay */}
                  <div className="absolute bottom-3.5 left-3.5 right-3.5 flex items-baseline justify-between text-white">
                    <div>
                      <span className="text-xl md:text-2xl font-bold tracking-tight text-white drop-shadow-sm font-sans">
                        {formatPHP(prop.price)}
                      </span>
                      {prop.listingType === 'RENT' && (
                        <span className="text-xs text-stone-200 font-normal"> / month</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <h3 className="font-serif font-bold text-lg text-stone-900 group-hover:text-forest-700 transition line-clamp-1">
                      {prop.title}
                    </h3>
                    <p className="text-xs text-stone-500 flex items-center">
                      <MapPin className="w-3.5 h-3.5 mr-1 text-stone-400 shrink-0" />
                      <span className="truncate">{prop.location}</span>
                    </p>
                    <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed pt-1">
                      {prop.description ||
                        'Exclusive property listing with modern architectural design, premium finishes, and strategic metropolitan access.'}
                    </p>
                  </div>

                  {/* Specifications & Actions */}
                  <div className="pt-4 mt-4 border-t border-stone-100 space-y-3">
                    <div className="flex items-center justify-between text-xs text-stone-600">
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
                        {prop.floorArea ? `${prop.floorArea} m²` : 'N/A'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-100/80">
                      <Link
                        to={`/properties/${prop.id}`}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-forest-50 hover:text-forest-800 text-stone-800 text-xs font-bold transition shadow-subtle"
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
                            type="button"
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
