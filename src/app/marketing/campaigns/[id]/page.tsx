'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { fetchCampaign, saveGeneratedContent } from '@/utils/campaignUtils';
import { Campaign, ContentType, GeneratedContent } from '@/types';

const CONTENT_TYPES: { value: ContentType; label: string; description: string }[] = [
  { value: 'blog', label: 'Blog Post', description: '800-1200 words, SEO-optimized' },
  { value: 'linkedin', label: 'LinkedIn Post', description: 'Professional, 1300 char max' },
  { value: 'twitter', label: 'Twitter Thread', description: '5-7 tweets, engaging' },
  { value: 'email', label: 'Email Copy', description: 'Subject + body, conversion-focused' },
  { value: 'ad-copy', label: 'Ad Copy', description: 'Headline + description + CTA' },
];

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatingType, setGeneratingType] = useState<ContentType | null>(null);

  useEffect(() => {
    if (params.id) {
      loadCampaign();
    }
  }, [params.id]);

  const loadCampaign = async () => {
    try {
      setLoading(true);
      const data = await fetchCampaign(params.id as string);

      if (!data) {
        alert('Campaign not found');
        router.push('/marketing/campaigns');
        return;
      }

      // Verify user owns this campaign
      if (data.userId !== user?.uid) {
        alert('Access denied');
        router.push('/marketing/campaigns');
        return;
      }

      setCampaign(data);
    } catch (error) {
      console.error('Error loading campaign:', error);
      alert('Failed to load campaign');
      router.push('/marketing/campaigns');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateContent = async (contentType: ContentType) => {
    if (!campaign || !user) return;

    setGenerating(true);
    setGeneratingType(contentType);

    try {
      const response = await fetch('/api/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: campaign.clientName,
          industry: campaign.industry,
          topic: campaign.topic,
          targetAudience: campaign.targetAudience,
          brandVoice: campaign.brandVoice,
          brandProfile: campaign.brandProfile,
          contentType,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate content');
      }

      const { content, wordCount, characterCount } = await response.json();

      const newContent: GeneratedContent = {
        type: contentType,
        content,
        wordCount,
        characterCount,
        generatedAt: new Date(),
      };

      // Save to Firestore
      await saveGeneratedContent(campaign.id!, newContent);

      // Reload campaign to get updated content
      await loadCampaign();

      alert('Content generated successfully!');
    } catch (error) {
      console.error('Error generating content:', error);
      alert('Failed to generate content. Please try again.');
    } finally {
      setGenerating(false);
      setGeneratingType(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-slate-50">
          <Navbar />
          <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white border border-slate-200 rounded-lg p-8">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mr-3"></div>
                <p className="text-slate-700">Loading campaign...</p>
              </div>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  if (!campaign) {
    return null;
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50">
        <Navbar />

        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.push('/marketing/campaigns')}
              className="text-sm text-slate-600 hover:text-slate-900 mb-4 flex items-center gap-1"
            >
              ← Back to Campaigns
            </button>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">{campaign.clientName}</h1>
            <p className="text-slate-600">{campaign.industry}</p>
          </div>

          {/* Campaign Details */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Campaign Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-slate-700">Topic</p>
                <p className="text-slate-900 mt-1">{campaign.topic}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">Target Audience</p>
                <p className="text-slate-900 mt-1">{campaign.targetAudience}</p>
              </div>
              {campaign.brandVoice && (
                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-slate-700">Brand Voice</p>
                  <p className="text-slate-900 mt-1">{campaign.brandVoice}</p>
                </div>
              )}
            </div>
          </div>

          {/* Brand Profile */}
          {campaign.brandProfile && (
            <div className="bg-white border border-slate-200 rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Brand Profile</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="font-medium text-slate-700 mb-2">Colors</p>
                  <div className="flex flex-wrap gap-2">
                    {campaign.brandProfile.colors.map((color, i) => (
                      <div key={i} className="flex flex-col items-center gap-1">
                        <div
                          className="w-10 h-10 rounded border border-slate-300"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-xs text-slate-500">{color}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="font-medium text-slate-700">Style</p>
                  <p className="text-slate-600 mt-1">{campaign.brandProfile.style}</p>
                </div>
                <div>
                  <p className="font-medium text-slate-700">Personality</p>
                  <p className="text-slate-600 mt-1">{campaign.brandProfile.personality.join(', ')}</p>
                </div>
                <div>
                  <p className="font-medium text-slate-700">Tone</p>
                  <p className="text-slate-600 mt-1">{campaign.brandProfile.tone}</p>
                </div>
              </div>
            </div>
          )}

          {/* Generate Content Section */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Generate Content</h2>
            <p className="text-sm text-slate-600 mb-4">
              Select a content type to generate brand-aware marketing content
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {CONTENT_TYPES.map(({ value, label, description }) => (
                <button
                  key={value}
                  onClick={() => handleGenerateContent(value)}
                  disabled={generating}
                  className="flex flex-col items-start p-4 border border-slate-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left"
                >
                  <div className="font-medium text-slate-900 mb-1">{label}</div>
                  <div className="text-xs text-slate-500">{description}</div>
                  {generating && generatingType === value && (
                    <div className="mt-2 text-xs text-indigo-600 flex items-center gap-2">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-indigo-600"></div>
                      Generating...
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Generated Content History */}
          {campaign.contents.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">Generated Content ({campaign.contents.length})</h2>

              {campaign.contents.map((item, index) => (
                <div key={index} className="bg-white border border-slate-200 rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 capitalize">
                        {item.type.replace('-', ' ')}
                      </h3>
                      <p className="text-sm text-slate-500 mt-1">
                        {item.wordCount && `${item.wordCount} words`}
                        {item.characterCount && ` • ${item.characterCount} characters`}
                        {' • '}
                        {new Date(item.generatedAt).toLocaleDateString()}
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
            </div>
          )}

          {campaign.contents.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
              <p className="text-slate-600">
                No content generated yet. Select a content type above to get started.
              </p>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
