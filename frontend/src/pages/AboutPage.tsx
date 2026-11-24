import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, Shield, Users, Layers, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const AboutPage: React.FC = () => {
  return (
    <div className="space-y-20 pb-20">
      {/* Header */}
      <section className="pt-16 pb-12 px-6 bg-stone-100/60 border-b border-stone-200/80">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <span className="text-xs uppercase font-mono tracking-widest text-forest-700 font-semibold">
            About EstateCore
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-stone-900">
            A Modern Architecture for Real Estate Integration
          </h1>
          <p className="text-base text-stone-600 max-w-2xl mx-auto">
            EstateCore was engineered as an enterprise prototype for ITEC 116 (Systems Integration and Architecture 2) to resolve fragmented property communication.
          </p>
        </div>
      </section>

      {/* Narrative & Pillars */}
      <section className="max-w-5xl mx-auto px-6 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="space-y-4">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
              Our Academic & Architectural Mission
            </h2>
            <p className="text-sm text-stone-600 leading-relaxed">
              In conventional real estate workflows, client inquiries get lost in unorganized chat threads, agents double-book physical viewing visits, and property listings suffer from out-of-date records.
            </p>
            <p className="text-sm text-stone-600 leading-relaxed">
              EstateCore establishes a unified RESTful standard with NestJS, MySQL 8.4 running in Docker, and TypeORM relational data models, ensuring every inquiry and appointment is strictly validated and linked to verified accounts.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-stone-200/90 shadow-subtle space-y-6">
            <div className="flex items-start space-x-3">
              <div className="p-2.5 bg-forest-50 text-forest-700 rounded-xl">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-stone-900 text-sm">3-Tier Enterprise Architecture</h3>
                <p className="text-xs text-stone-500 mt-0.5">Strict Controller-Service-Repository separation with persistent Docker persistence.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="p-2.5 bg-forest-50 text-forest-700 rounded-xl">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-stone-900 text-sm">Cryptographic Security</h3>
                <p className="text-xs text-stone-500 mt-0.5">Salted bcrypt password hashing and stateless Passport JWT token authentication.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="p-2.5 bg-forest-50 text-forest-700 rounded-xl">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-stone-900 text-sm">Role-Based Access Control</h3>
                <p className="text-xs text-stone-500 mt-0.5">Dedicated workspaces and permissions for Administrators, Agents, and Clients.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Course Info Card */}
        <div className="p-8 bg-forest-800 text-white rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-xs uppercase font-mono tracking-wider text-forest-300">Course Reference</span>
            <h3 className="text-xl font-bold font-serif">ITEC 116 — Systems Integration Prototype</h3>
            <p className="text-xs text-forest-200">Supervised by Instructor John Vincent A. Dallego, MIT</p>
          </div>
          <Link to="/properties">
            <Button size="md" className="bg-white text-forest-900 hover:bg-stone-100">
              Explore Active Listings
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};
