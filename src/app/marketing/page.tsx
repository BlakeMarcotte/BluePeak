'use client';

import { useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import CampaignForm from '@/components/CampaignForm';
import { CampaignFormData } from '@/types';
import { uploadToStorage } from '@/utils/uploadToStorage';
import { useAuth } from '@/contexts/AuthContext';

export default function MarketingPage() {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

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

      // Upload logo if provided
      if (logo) {
        console.log('Uploading logo...');
        logoUrl = await uploadToStorage(logo, `campaigns/${user.uid}/logos`);
        console.log('Logo uploaded:', logoUrl);
      }

      // Upload screenshot if provided
      if (screenshot) {
        console.log('Uploading screenshot...');
        screenshotUrl = await uploadToStorage(screenshot, `campaigns/${user.uid}/screenshots`);
        console.log('Screenshot uploaded:', screenshotUrl);
      }

      console.log('Form data:', formData);
      console.log('Logo URL:', logoUrl);
      console.log('Screenshot URL:', screenshotUrl);

      // TODO: Next phase - analyze brand and generate content
      alert('Files uploaded successfully! Next: brand analysis and content generation.');
    } catch (error) {
      console.error('Error:', error);
      alert('Error uploading files. Check console for details.');
    } finally {
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
              Generate AI-powered marketing content for your clients
            </p>
          </div>

          {/* Campaign Form */}
          <CampaignForm onSubmit={handleFormSubmit} loading={loading} />
        </main>
      </div>
    </ProtectedRoute>
  );
}
