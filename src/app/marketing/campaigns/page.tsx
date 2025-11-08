'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { fetchCampaigns } from '@/utils/campaignUtils';
import { Campaign } from '@/types';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      loadCampaigns();
    }
  }, [user]);

  const loadCampaigns = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await fetchCampaigns(user.uid);
      setCampaigns(data);
    } catch (error) {
      console.error('Error loading campaigns:', error);
      alert('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50">
        <Navbar />

        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Campaigns</h1>
              <p className="text-slate-600">Manage your client marketing campaigns</p>
            </div>
            <button
              onClick={() => router.push('/marketing')}
              className="px-4 py-2.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors font-medium text-sm"
            >
              Create Campaign
            </button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="bg-white border border-slate-200 rounded-lg p-8">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mr-3"></div>
                <p className="text-slate-700">Loading campaigns...</p>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && campaigns.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
              <div className="max-w-md mx-auto">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No campaigns yet</h3>
                <p className="text-slate-600 mb-6">
                  Create your first campaign to start generating AI-powered marketing content for your clients.
                </p>
                <button
                  onClick={() => router.push('/marketing')}
                  className="px-4 py-2.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors font-medium text-sm"
                >
                  Create Campaign
                </button>
              </div>
            </div>
          )}

          {/* Campaigns Grid */}
          {!loading && campaigns.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  onClick={() => router.push(`/marketing/campaigns/${campaign.id}`)}
                  className="bg-white border border-slate-200 rounded-lg p-6 cursor-pointer hover:border-indigo-300 hover:shadow-sm transition-all"
                >
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">
                      {campaign.clientName}
                    </h3>
                    <p className="text-sm text-slate-500">{campaign.industry}</p>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-slate-700 line-clamp-2">{campaign.topic}</p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{campaign.contents.length} content pieces</span>
                    <span>{new Date(campaign.createdAt).toLocaleDateString()}</span>
                  </div>

                  {campaign.brandProfile && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <div className="flex gap-2">
                        {campaign.brandProfile.colors.slice(0, 4).map((color, i) => (
                          <div
                            key={i}
                            className="w-6 h-6 rounded border border-slate-300"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
