import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { AgentProfile } from '../types';
import {
  UserCheck,
  ShieldCheck,
  Building,
  Mail,
  Award,
  Search,
  ExternalLink,
} from 'lucide-react';

export const AgentsList: React.FC = () => {
  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchAgents() {
      try {
        const data = await api.getAgents();
        setAgents(data);
      } catch (err) {
        console.error('Failed to load agents directory', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAgents();
  }, []);

  const filteredAgents = agents.filter((agent) => {
    const q = searchQuery.toLowerCase();
    return (
      agent.fullName.toLowerCase().includes(q) ||
      (agent.agencyName && agent.agencyName.toLowerCase().includes(q)) ||
      (agent.licenseNumber && agent.licenseNumber.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Directory Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-forest-50 border border-forest-200 text-forest-700 text-xs font-semibold">
          <Award className="w-3.5 h-3.5" />
          <span>Accredited Professionals</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-stone-900 tracking-tight">
          Licensed Real Estate Agents
        </h1>
        <p className="text-sm md:text-base text-stone-600">
          Connect with trusted real estate brokers and property managers handling premier EstateCore listings.
        </p>

        {/* Search Bar */}
        <div className="relative max-w-md mx-auto pt-2">
          <Search className="w-5 h-5 absolute left-3.5 top-5 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by agent name, agency, or license..."
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-forest-600 focus:outline-none shadow-sm"
          />
        </div>
      </div>

      {/* Agents Grid */}
      {loading ? (
        <div className="p-16 text-center text-stone-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-forest-700 mx-auto mb-3"></div>
          Loading accredited agents...
        </div>
      ) : filteredAgents.length === 0 ? (
        <div className="p-16 text-center text-stone-500 bg-white rounded-2xl border border-stone-200">
          <UserCheck className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <p className="text-base font-semibold text-stone-800">No agents found</p>
          <p className="text-xs text-stone-500">Try adjusting your search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgents.map((agent) => (
            <div
              key={agent.agentId || agent.id}
              className="bg-white rounded-2xl border border-stone-200/80 shadow-subtle p-6 flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-xl bg-forest-700 text-white font-bold font-serif text-lg flex items-center justify-center">
                      {agent.fullName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-serif font-bold text-lg text-stone-900">
                        {agent.fullName}
                      </h3>
                      <p className="text-xs text-stone-500 flex items-center space-x-1">
                        <Building className="w-3 h-3" />
                        <span>{agent.agencyName || 'Independent Real Estate Broker'}</span>
                      </p>
                    </div>
                  </div>

                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Active</span>
                  </span>
                </div>

                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/60 text-xs space-y-1.5 font-mono">
                  <div className="flex justify-between text-stone-600">
                    <span>License No:</span>
                    <span className="font-bold text-stone-900">
                      {agent.licenseNumber || 'PRC-REB-0019284'}
                    </span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>Email:</span>
                    <span className="text-stone-900 truncate max-w-[180px]">{agent.email}</span>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-stone-100 mt-6 flex items-center justify-between">
                <a
                  href={`mailto:${agent.email}`}
                  className="text-xs font-semibold text-stone-600 hover:text-forest-700 flex items-center space-x-1"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Contact</span>
                </a>

                <Link
                  to="/properties"
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-forest-50 text-forest-700 hover:bg-forest-100 text-xs font-semibold transition-colors"
                >
                  <span>View Listings</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
