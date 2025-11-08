'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { Client } from '@/types';

export default function MarketingPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/clients');
      if (!response.ok) throw new Error('Failed to fetch clients');

      const data = await response.json();

      // Convert dates and ensure proper structure for each client
      const processedClients = (data.clients || []).map((client: any) => ({
        ...client,
        createdAt: new Date(client.createdAt),
        updatedAt: new Date(client.updatedAt),
        marketingContent: (client.marketingContent || []).map((content: any) => ({
          ...content,
          generatedAt: new Date(content.generatedAt),
        })),
      }));

      // Filter clients who have completed discovery
      const eligibleClients = processedClients.filter(
        (client: Client) =>
          client.onboardingStage === 'discovery_complete' ||
          client.onboardingStage === 'meeting_scheduled' ||
          client.onboardingStage === 'proposal_accepted'
      );

      setClients(eligibleClients);
    } catch (error) {
      console.error('Error loading clients:', error);
      alert('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(client =>
    client.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (client.industry || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-slate-50">
          <Navbar />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white border border-slate-200 rounded-lg p-8">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mr-3"></div>
                <p className="text-slate-700">Loading clients...</p>
              </div>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50">
        <Navbar />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Marketing Content Generator</h1>
            <p className="text-slate-600">
              Generate AI-powered marketing content for your clients
            </p>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clients by name, company, or industry..."
              className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <div className="text-3xl font-bold text-indigo-600 mb-1">
                {clients.length}
              </div>
              <div className="text-sm text-slate-600">Eligible Clients</div>
              <p className="text-xs text-slate-500 mt-1">Completed discovery</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <div className="text-3xl font-bold text-green-600 mb-1">
                {clients.filter(c => c.brandProfile).length}
              </div>
              <div className="text-sm text-slate-600">Brand Analyzed</div>
              <p className="text-xs text-slate-500 mt-1">Logo analysis complete</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <div className="text-3xl font-bold text-purple-600 mb-1">
                {clients.reduce((sum, c) => sum + (c.marketingContent?.length || 0), 0)}
              </div>
              <div className="text-sm text-slate-600">Total Content</div>
              <p className="text-xs text-slate-500 mt-1">Marketing materials generated</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <div className="text-3xl font-bold text-emerald-600 mb-1">
                {clients.reduce((sum, c) => sum + (c.marketingContent?.filter(m => m.published).length || 0), 0)}
              </div>
              <div className="text-sm text-slate-600">Published</div>
              <p className="text-xs text-slate-500 mt-1">Visible to clients</p>
            </div>
          </div>

          {/* Client Cards */}
          {clients.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                No Clients with Completed Discovery
              </h3>
              <p className="text-slate-600 max-w-md mx-auto mb-6">
                Clients need to complete the discovery questionnaire before you can generate marketing content for them.
              </p>
              <button
                onClick={() => router.push('/client-onboarding')}
                className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Go to Client Onboarding
              </button>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
              <p className="text-slate-600">No clients match your search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClients.map((client) => (
                <div
                  key={client.id}
                  onClick={() => router.push(`/marketing/${client.id}`)}
                  className="bg-white border border-slate-200 rounded-lg p-6 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group"
                >
                  {/* Client Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {client.company}
                      </h3>
                      <p className="text-sm text-slate-600">{client.name}</p>
                    </div>
                    {client.logoUrl && (
                      <img
                        src={client.logoUrl}
                        alt={`${client.company} logo`}
                        className="w-12 h-12 object-contain rounded border border-slate-200"
                      />
                    )}
                  </div>

                  {/* Client Info */}
                  <div className="space-y-2 mb-4">
                    {client.industry && (
                      <div className="flex items-center text-sm">
                        <span className="text-slate-500 mr-2">Industry:</span>
                        <span className="text-slate-900 font-medium">{client.industry}</span>
                      </div>
                    )}
                    {client.discoveryData?.targetAudience && (
                      <div className="flex items-center text-sm">
                        <span className="text-slate-500 mr-2">Audience:</span>
                        <span className="text-slate-900 font-medium truncate">
                          {client.discoveryData.targetAudience}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-indigo-600">
                        {client.marketingContent?.length || 0}
                      </span>
                      <span className="text-xs text-slate-600">
                        Content<br/>Pieces
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-emerald-600">
                        {client.marketingContent?.filter(m => m.published).length || 0}
                      </span>
                      <span className="text-xs text-slate-600">
                        Published
                      </span>
                    </div>
                    {client.brandProfile && (
                      <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                        </svg>
                        Brand Analyzed
                      </div>
                    )}
                  </div>

                  {/* Hover Arrow */}
                  <div className="mt-4 flex items-center text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-sm font-medium">Generate content</span>
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
