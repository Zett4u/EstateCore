import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Property, PropertyType, ListingType } from '../types';
import { formatPHP, getPropertyImage } from '../lib/utils';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  Search,
  Building2,
  CalendarCheck,
  MessageSquare,
  ShieldCheck,
  ArrowRight,
  Bed,
  Bath,
  Maximize2,
  MapPin,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  // Search Filter State
  const [searchLocation, setSearchLocation] = useState('');
  const [selectedListingType, setSelectedListingType] = useState<string>('');
  const [selectedPropertyType, setSelectedPropertyType] = useState<string>('');

  useEffect(() => {
    async function loadFeatured() {
      try {
        const data = await api.getProperties();
        setProperties(data);
      } catch (err) {
        console.error('Failed to load featured properties:', err);
      } finally {
        setLoading(false);
      }
    }
    loadFeatured();
  }, []);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchLocation) params.append('search', searchLocation);
    if (selectedListingType) params.append('listingType', selectedListingType);
    if (selectedPropertyType) params.append('propertyType', selectedPropertyType);
    navigate(`/properties?${params.toString()}`);
  };

  return (
    <div className="space-y-24 pb-20">
      {/* 1. HERO SECTION */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 px-6 overflow-hidden">
        {/* Soft background luxury atmosphere */}
        <div className="absolute inset-0 bg-gradient-to-b from-stone-100/70 via-stone-50 to-stone-50 pointer-events-none -z-10"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-forest-100/40 rounded-full blur-3xl pointer-events-none -z-10"></div>

        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-forest-100/80 border border-forest-200/80 text-forest-800 text-xs font-semibold tracking-wide">
            <span className="w-2 h-2 rounded-full bg-forest-600 animate-pulse"></span>
            <span>EstateCore Real Estate Platform</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-stone-900 leading-[1.1]">
            Find a place that <br className="hidden sm:inline" />
            <span className="italic font-normal text-forest-800">feels like yours.</span>
          </h1>

          <p className="text-base sm:text-lg text-stone-600 max-w-2xl mx-auto font-normal leading-relaxed">
            Discover verified properties, connect directly with licensed real estate agents, and coordinate property viewing appointments with confidence.
          </p>

          {/* Search Box Card */}
          <div className="pt-4 max-w-4xl mx-auto">
            <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-elevated border border-stone-200/80 text-left space-y-4">
              {/* Type Switcher Pills */}
              <div className="flex items-center space-x-1 border-b border-stone-100 pb-3 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setSelectedListingType('')}
                  className={`px-4 py-1.5 rounded-lg transition ${
                    selectedListingType === '' ? 'bg-forest-700 text-white' : 'text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  All Properties
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedListingType('SALE')}
                  className={`px-4 py-1.5 rounded-lg transition ${
                    selectedListingType === 'SALE' ? 'bg-forest-700 text-white' : 'text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  For Sale
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedListingType('RENT')}
                  className={`px-4 py-1.5 rounded-lg transition ${
                    selectedListingType === 'RENT' ? 'bg-forest-700 text-white' : 'text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  For Rent
                </button>
              </div>

              {/* Input Grid */}
              <form onSubmit={handleHeroSearch} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Location */}
                <div className="relative">
                  <label className="block text-[11px] uppercase font-bold text-stone-500 mb-1 tracking-wider">
                    Location or Keyword
                  </label>
                  <div className="relative flex items-center">
                    <MapPin className="w-4 h-4 text-stone-400 absolute left-3 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="e.g. BGC, Makati, Alabang..."
                      value={searchLocation}
                      onChange={(e) => setSearchLocation(e.target.value)}
                      className="w-full text-sm pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-forest-700 bg-stone-50/50"
                    />
                  </div>
                </div>

                {/* Property Type */}
                <div>
                  <label className="block text-[11px] uppercase font-bold text-stone-500 mb-1 tracking-wider">
                    Property Type
                  </label>
                  <select
                    value={selectedPropertyType}
                    onChange={(e) => setSelectedPropertyType(e.target.value)}
                    className="w-full text-sm px-3 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-forest-700 bg-stone-50/50"
                  >
                    <option value="">All Categories</option>
                    <option value="CONDOMINIUM">Condominium</option>
                    <option value="HOUSE">House & Lot</option>
                    <option value="TOWNHOUSE">Townhouse</option>
                    <option value="APARTMENT">Apartment</option>
                    <option value="COMMERCIAL">Commercial Hub</option>
                    <option value="LAND">Land Parcel</option>
                  </select>
                </div>

                {/* Submit Action */}
                <div className="flex items-end">
                  <Button type="submit" className="w-full h-[42px] bg-forest-700 hover:bg-forest-800 text-white">
                    <Search className="w-4 h-4 mr-2" />
                    <span>Search Listings</span>
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="pt-6 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto text-left">
            <div className="p-3 bg-white/70 backdrop-blur-sm rounded-xl border border-stone-200/70">
              <span className="block text-xl font-bold text-stone-900 font-serif">100%</span>
              <span className="text-xs text-stone-500">Verified Property Titles</span>
            </div>
            <div className="p-3 bg-white/70 backdrop-blur-sm rounded-xl border border-stone-200/70">
              <span className="block text-xl font-bold text-stone-900 font-serif">Direct</span>
              <span className="text-xs text-stone-500">Licensed Agent Contact</span>
            </div>
            <div className="p-3 bg-white/70 backdrop-blur-sm rounded-xl border border-stone-200/70">
              <span className="block text-xl font-bold text-stone-900 font-serif">Live</span>
              <span className="text-xs text-stone-500">Viewing Tour Scheduling</span>
            </div>
            <div className="p-3 bg-white/70 backdrop-blur-sm rounded-xl border border-stone-200/70">
              <span className="block text-xl font-bold text-stone-900 font-serif">Zero</span>
              <span className="text-xs text-stone-500">Hidden Broker Fees</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. FEATURED LISTINGS SECTION */}
      <section className="max-w-7xl mx-auto px-6 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-stone-200 pb-5">
          <div>
            <span className="text-xs uppercase font-mono tracking-widest text-forest-700 font-semibold block mb-1">
              Curated Portfolio
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-stone-900">
              Featured Properties
            </h2>
            <p className="text-sm text-stone-500 mt-1">
              Live listings verified by licensed real estate brokers across Metro Manila and CALABARZON.
            </p>
          </div>
          <Link to="/properties">
            <Button variant="outline" size="sm">
              <span>View All Listings</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-96 bg-stone-200/60 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-stone-200 p-8">
            <Building2 className="w-10 h-10 mx-auto text-stone-400 mb-3" />
            <h3 className="font-semibold text-stone-800">No properties cataloged yet.</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {properties.slice(0, 6).map((prop) => (
              <div
                key={prop.id}
                className="group bg-white rounded-2xl overflow-hidden border border-stone-200/90 shadow-subtle hover:shadow-elevated transition-all duration-300 flex flex-col justify-between"
              >
                {/* Photo & Badges */}
                <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
                  <img
                    src={getPropertyImage(prop.propertyType, prop.id)}
                    alt={prop.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute top-3.5 left-3.5 flex items-center space-x-1.5">
                    <Badge variant={prop.listingType === 'SALE' ? 'forest' : 'blue'}>
                      For {prop.listingType === 'SALE' ? 'Sale' : 'Rent'}
                    </Badge>
                    <Badge variant="stone">
                      {prop.propertyType}
                    </Badge>
                  </div>
                  <div className="absolute top-3.5 right-3.5">
                    <Badge variant={prop.status === 'AVAILABLE' ? 'forest' : 'amber'}>
                      {prop.status}
                    </Badge>
                  </div>
                </div>

                {/* Content details */}
                <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-stone-400 flex items-center">
                      <MapPin className="w-3.5 h-3.5 mr-1 text-forest-700" />
                      {prop.location}
                    </p>
                    <h3 className="font-serif font-bold text-lg text-stone-900 group-hover:text-forest-700 transition-colors line-clamp-1">
                      {prop.title}
                    </h3>
                    <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                      {prop.description}
                    </p>
                  </div>

                  {/* Dimension specs */}
                  <div className="pt-3 border-t border-stone-100 grid grid-cols-3 gap-2 text-xs text-stone-600 font-medium">
                    <div className="flex items-center space-x-1">
                      <Bed className="w-3.5 h-3.5 text-stone-400" />
                      <span>{prop.bedrooms} Beds</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Bath className="w-3.5 h-3.5 text-stone-400" />
                      <span>{prop.bathrooms} Baths</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Maximize2 className="w-3.5 h-3.5 text-stone-400" />
                      <span>{prop.floorArea} sqm</span>
                    </div>
                  </div>
                </div>

                {/* Footer price & action */}
                <div className="px-5 py-4 bg-stone-50/70 border-t border-stone-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400 block tracking-wider">
                      Price
                    </span>
                    <span className="text-lg font-bold text-stone-900 font-serif">
                      {formatPHP(Number(prop.price))}
                    </span>
                  </div>
                  <Link to={`/properties/${prop.id}`}>
                    <Button variant="outline" size="sm" className="bg-white hover:bg-forest-50 hover:text-forest-800">
                      <span>Details</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. HOW IT WORKS SECTION */}
      <section className="bg-stone-900 text-white py-20 px-6 rounded-3xl max-w-7xl mx-auto">
        <div className="max-w-4xl mx-auto text-center space-y-4 mb-16">
          <span className="text-xs uppercase font-mono tracking-widest text-forest-400 font-semibold">
            Simple 3-Step Process
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold">
            How EstateCore Works
          </h2>
          <p className="text-sm text-stone-400 max-w-xl mx-auto">
            From discovering listings to signing leases, we streamline the entire property journey.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Step 1 */}
          <div className="bg-stone-800/80 p-8 rounded-2xl border border-stone-700/80 space-y-4 relative">
            <span className="text-3xl font-serif font-bold text-forest-400">01</span>
            <h3 className="text-xl font-bold text-white">Discover Properties</h3>
            <p className="text-xs text-stone-400 leading-relaxed">
              Explore verified listings with detailed architectural floor areas, verified pricing, high-resolution imagery, and location maps.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-stone-800/80 p-8 rounded-2xl border border-stone-700/80 space-y-4 relative">
            <span className="text-3xl font-serif font-bold text-forest-400">02</span>
            <h3 className="text-xl font-bold text-white">Connect with Agents</h3>
            <p className="text-xs text-stone-400 leading-relaxed">
              Submit structured property inquiries directly to the licensed listing agent without intermediary noise or hidden fees.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-stone-800/80 p-8 rounded-2xl border border-stone-700/80 space-y-4 relative">
            <span className="text-3xl font-serif font-bold text-forest-400">03</span>
            <h3 className="text-xl font-bold text-white">Schedule Viewing Tours</h3>
            <p className="text-xs text-stone-400 leading-relaxed">
              Book on-site physical tours with verified availability, instant calendar conflict checking, and live confirmation tracking.
            </p>
          </div>
        </div>
      </section>

      {/* 4. PLATFORM CAPABILITIES SECTION */}
      <section className="max-w-7xl mx-auto px-6 space-y-12">
        <div className="max-w-2xl space-y-3">
          <span className="text-xs uppercase font-mono tracking-widest text-forest-700 font-semibold block">
            System Features
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
            Engineered for Modern Real Estate Operations
          </h2>
          <p className="text-sm text-stone-600">
            EstateCore brings enterprise discipline to listing curation, agent assignment, and client inquiries.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 bg-white rounded-2xl border border-stone-200/90 shadow-subtle space-y-3">
            <div className="w-10 h-10 rounded-xl bg-forest-100 text-forest-700 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-stone-900 text-base">Portfolio Management</h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              Comprehensive inventory tracking across houses, condos, townhouses, apartments, commercial hubs, and agricultural land.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-stone-200/90 shadow-subtle space-y-3">
            <div className="w-10 h-10 rounded-xl bg-forest-100 text-forest-700 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-stone-900 text-base">Inquiry Pipeline</h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              Structured four-stage client inquiry processing from pending submission to contacted, qualified, and closed deal.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-stone-200/90 shadow-subtle space-y-3">
            <div className="w-10 h-10 rounded-xl bg-forest-100 text-forest-700 flex items-center justify-center">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-stone-900 text-base">Conflict-Free Tours</h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              Automated validation preventing past booking dates and agent double-booking for confirmed physical property viewings.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-stone-200/90 shadow-subtle space-y-3">
            <div className="w-10 h-10 rounded-xl bg-forest-100 text-forest-700 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-stone-900 text-base">Enterprise Security</h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              Role-based access guards (Admin, Agent, Client), bcrypt password salting, and stateless JWT authorization.
            </p>
          </div>
        </div>
      </section>

      {/* 5. CALL TO ACTION BANNER */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="bg-forest-800 text-white rounded-3xl p-10 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8 shadow-elevated">
          <div className="space-y-3 text-center md:text-left">
            <h2 className="font-serif text-3xl md:text-4xl font-bold">
              Ready to find your next property?
            </h2>
            <p className="text-sm text-forest-200 max-w-xl">
              Create a client account to submit inquiries, schedule viewing appointments, and connect directly with verified property agents.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Link to="/register">
              <Button size="lg" className="bg-white text-forest-900 hover:bg-stone-100 w-full sm:w-auto">
                Create Free Account
              </Button>
            </Link>
            <Link to="/properties">
              <Button size="lg" variant="outline" className="border-forest-600 text-white hover:bg-forest-700 w-full sm:w-auto">
                Browse Properties
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
