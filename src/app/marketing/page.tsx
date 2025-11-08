'use client';

import { useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import CampaignForm from '@/components/CampaignForm';
import { CampaignFormData } from '@/types';

export default function MarketingPage() {
  const [loading, setLoading] = useState(false);

  const handleFormSubmit = async (
    formData: CampaignFormData,
    logo: File | null,
    screenshot: File | null
  ) => {
    setLoading(true);

    try {
      console.log('Form submitted:', formData);
      console.log('Logo:', logo?.name);
      console.log('Screenshot:', screenshot?.name);

      // TODO: Handle file uploads and API calls in next phase
      alert('Form submitted! Next phase: upload assets and generate content.');
    } catch (error) {
      console.error('Error:', error);
      alert('Error submitting form');
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
