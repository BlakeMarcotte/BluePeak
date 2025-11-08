'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import CampaignForm from '@/components/CampaignForm';
import { CampaignFormData, BrandProfile } from '@/types';
import { uploadToStorage } from '@/utils/uploadToStorage';
import { saveCampaign } from '@/utils/campaignUtils';
import { useAuth } from '@/contexts/AuthContext';

export default function MarketingPage() {
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const { user } = useAuth();
  const router = useRouter();

  const handleFormSubmit = async (
    formData: CampaignFormData,
    logo: File | null,
    screenshot: File | null
  ) => {
    if (!user) {
      alert('You must be logged in');
      return;
    }

    setLoading(true);

    try {
      let logoUrl: string | undefined;
      let screenshotUrl: string | undefined;

      // Step 1: Upload files
      if (logo || screenshot) {
        setLoadingMessage('Uploading brand assets...');
      }

      if (logo) {
        logoUrl = await uploadToStorage(logo, `campaigns/${user.uid}/logos`);
      }

      if (screenshot) {
        screenshotUrl = await uploadToStorage(screenshot, `campaigns/${user.uid}/screenshots`);
      }

      // Step 2: Analyze brand (if assets provided)
      let profile: BrandProfile | undefined;

      if (logoUrl || screenshotUrl) {
        setLoadingMessage('Analyzing brand...');

        const brandAnalysisResponse = await fetch('/api/analyze-brand', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ logoUrl, screenshotUrl }),
        });

        if (!brandAnalysisResponse.ok) {
          throw new Error('Failed to analyze brand');
        }

        const { brandProfile: analyzedProfile } = await brandAnalysisResponse.json();
        profile = analyzedProfile;
      }

      // Step 3: Save campaign to Firestore
      setLoadingMessage('Creating campaign...');

      const campaignId = await saveCampaign({
        clientName: formData.clientName,
        industry: formData.industry,
        topic: formData.topic,
        targetAudience: formData.targetAudience,
        brandVoice: formData.brandVoice,
        logoUrl,
        screenshotUrl,
        brandProfile: profile,
        contents: [],
        userId: user.uid,
        createdAt: new Date(),
      });

      // Step 4: Redirect to campaign detail page
      setLoadingMessage('');
      router.push(`/marketing/campaigns/${campaignId}`);
    } catch (error) {
      console.error('Error:', error);
      alert('Error creating campaign. Check console for details.');
      setLoadingMessage('');
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50">
        <Navbar />

        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Create Campaign</h1>
            <p className="text-slate-600">
              Set up a new marketing campaign for your client
            </p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="bg-white border border-slate-200 rounded-lg p-8 mb-6">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mr-3"></div>
                <p className="text-slate-700">{loadingMessage || 'Processing...'}</p>
              </div>
            </div>
          )}

          {/* Campaign Form */}
          {!loading && (
            <CampaignForm onSubmit={handleFormSubmit} loading={loading} />
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
