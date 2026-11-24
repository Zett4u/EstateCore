import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, ShieldCheck, Mail, Phone, MapPin, ArrowUpRight } from 'lucide-react';

export const PublicFooter: React.FC = () => {
  return (
    <footer className="bg-stone-900 text-stone-300 pt-16 pb-12 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-stone-800">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-forest-600 text-white flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="font-serif font-bold text-xl tracking-tight text-white">
                Estate<span className="text-forest-400">Core</span>
              </span>
            </Link>
            <p className="text-xs text-stone-400 leading-relaxed">
              Enterprise real estate information management platform connecting property buyers, licensed agents, and brokerage administrators through verified data and seamless workflows.
            </p>
            <div className="flex items-center space-x-2 text-[11px] text-stone-400 font-mono">
              <ShieldCheck className="w-4 h-4 text-forest-400" />
              <span>ITEC 116 Systems Integration Prototype</span>
            </div>
          </div>

          {/* Quick Properties */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-200">
              Browse Listings
            </p>
            <ul className="space-y-2 text-xs text-stone-400">
              <li><Link to="/properties?propertyType=CONDOMINIUM" className="hover:text-white transition">High-Rise Condominiums</Link></li>
              <li><Link to="/properties?propertyType=HOUSE" className="hover:text-white transition">Suburban Residences</Link></li>
              <li><Link to="/properties?propertyType=TOWNHOUSE" className="hover:text-white transition">Gated Townhouses</Link></li>
              <li><Link to="/properties?propertyType=COMMERCIAL" className="hover:text-white transition">Commercial Development</Link></li>
              <li><Link to="/properties?propertyType=LAND" className="hover:text-white transition">Agricultural & Prime Land</Link></li>
            </ul>
          </div>

          {/* Platform Links */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-200">
              Platform & System
            </p>
            <ul className="space-y-2 text-xs text-stone-400">
              <li><Link to="/about" className="hover:text-white transition">About EstateCore</Link></li>
              <li><Link to="/contact" className="hover:text-white transition">Contact & Locations</Link></li>
              <li><Link to="/login" className="hover:text-white transition">Agent & Admin Portal</Link></li>
              <li><Link to="/register" className="hover:text-white transition">Client Registration</Link></li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-200">
              Headquarters
            </p>
            <div className="space-y-2.5 text-xs text-stone-400">
              <p className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 text-forest-400 shrink-0 mt-0.5" />
                <span>7th Avenue corner 28th Street, Bonifacio Global City, Taguig, Philippines</span>
              </p>
              <p className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-forest-400 shrink-0" />
                <span>inquiries@estatecore.local</span>
              </p>
              <p className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-forest-400 shrink-0" />
                <span>+63 (2) 8888-CORE (2673)</span>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-400 gap-4">
          <p>© 2026 EstateCore Platform. Developed for ITEC 116 — Systems Integration and Architecture 2.</p>
          <div className="flex items-center space-x-6">
            <Link to="/about" className="hover:text-white transition">System Architecture</Link>
            <Link to="/properties" className="hover:text-white transition">Verified Listings</Link>
            <a href="https://github.com/Zett4u/EstateCore" target="_blank" rel="noreferrer" className="hover:text-white transition flex items-center space-x-1">
              <span>GitHub Code</span>
              <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
