'use client';

import { useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import CampaignForm from '@/components/CampaignForm';
import { CampaignFormData, BrandProfile, GeneratedContent } from '@/types';
import { uploadToStorage } from '@/utils/uploadToStorage';
import { useAuth } from '@/contexts/AuthContext';

export default function MarketingPage() {
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent[]>([]);
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
    setGeneratedContent([]);
    setBrandProfile(null);

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
        setBrandProfile(analyzedProfile);
      }

      // Step 3: Generate content for each selected type
      const contents: GeneratedContent[] = [];

      for (const contentType of formData.contentTypes) {
        setLoadingMessage(`Generating ${contentType} content...`);

        const contentResponse = await fetch('/api/generate-content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientName: formData.clientName,
            industry: formData.industry,
            topic: formData.topic,
            targetAudience: formData.targetAudience,
            brandVoice: formData.brandVoice,
            brandProfile: profile,
            contentType,
          }),
        });

        if (!contentResponse.ok) {
          throw new Error(`Failed to generate ${contentType} content`);
        }

        const { content, wordCount, characterCount } = await contentResponse.json();

        contents.push({
          type: contentType,
          content,
          wordCount,
          characterCount,
          generatedAt: new Date(),
        });
      }

      setGeneratedContent(contents);
      setLoadingMessage('');
    } catch (error) {
      console.error('Error:', error);
      alert('Error generating content. Check console for details.');
      setLoadingMessage('');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
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

          {/* Loading State */}
          {loading && (
            <div className="bg-white border border-slate-200 rounded-lg p-8 mb-6">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mr-3"></div>
                <p className="text-slate-700">{loadingMessage || 'Processing...'}</p>
              </div>
            </div>
          )}

          {/* Generated Content */}
          {!loading && generatedContent.length > 0 && (
            <div className="space-y-6 mb-8">
              {/* Brand Profile */}
              {brandProfile && (
                <div className="bg-white border border-slate-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Brand Profile</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-slate-700">Colors</p>
                      <div className="flex gap-2 mt-1">
                        {brandProfile.colors.map((color, i) => (
                          <div key={i} className="flex items-center gap-1">
                            <div
                              className="w-6 h-6 rounded border border-slate-300"
                              style={{ backgroundColor: color }}
                            />
                            <span className="text-xs text-slate-500">{color}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-slate-700">Style</p>
                      <p className="text-slate-600 mt-1">{brandProfile.style}</p>
                    </div>
                    <div>
                      <p className="font-medium text-slate-700">Personality</p>
                      <p className="text-slate-600 mt-1">{brandProfile.personality.join(', ')}</p>
                    </div>
                    <div>
                      <p className="font-medium text-slate-700">Tone</p>
                      <p className="text-slate-600 mt-1">{brandProfile.tone}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Content Cards */}
              {generatedContent.map((item, index) => (
                <div key={index} className="bg-white border border-slate-200 rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 capitalize">
                        {item.type.replace('-', ' ')}
                      </h3>
                      <p className="text-sm text-slate-500 mt-1">
                        {item.wordCount && `${item.wordCount} words`}
                        {item.characterCount && ` • ${item.characterCount} characters`}
                      </p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(item.content)}
                      className="px-3 py-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-md transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700 leading-relaxed">
                      {item.content}
                    </pre>
                  </div>
                </div>
              ))}

              {/* Create New Button */}
              <button
                onClick={() => {
                  setGeneratedContent([]);
                  setBrandProfile(null);
                }}
                className="w-full px-4 py-2.5 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 transition-colors font-medium text-sm"
              >
                Create New Campaign
              </button>
            </div>
          )}

          {/* Campaign Form */}
          {!loading && generatedContent.length === 0 && (
            <CampaignForm onSubmit={handleFormSubmit} loading={loading} />
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
