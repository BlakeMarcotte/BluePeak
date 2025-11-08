'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Client, Campaign, GeneratedContent, ContentType } from '@/types';
import ClientPortalNav from '@/components/ClientPortalNav';

const contentTypeLabels: Record<ContentType, string> = {
  'blog': 'Blog Post',
  'linkedin': 'LinkedIn Post',
  'twitter': 'Twitter/X Post',
  'email': 'Email Campaign',
  'ad-copy': 'Ad Copy',
  'pdf-onepager': 'PDF One-Pager',
};

const contentTypeIcons: Record<ContentType, string> = {
  'blog': '📝',
  'linkedin': '💼',
  'twitter': '🐦',
  'email': '📧',
  'ad-copy': '📢',
  'pdf-onepager': '📄',
};

export default function MarketingMaterialsPage() {
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedContent, setSelectedContent] = useState<GeneratedContent | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        router.push('/client-portal/login');
        return;
      }

      try {
        // Fetch client profile
        const profileResponse = await fetch(`/api/client-auth/profile?uid=${firebaseUser.uid}`);
        if (!profileResponse.ok) throw new Error('Failed to fetch client profile');
        const profileData = await profileResponse.json();
        setClient(profileData.client);

        // Fetch campaigns for this client
        const campaignsResponse = await fetch(
          `/api/client-campaigns?clientName=${encodeURIComponent(profileData.client.name)}`
        );
        if (!campaignsResponse.ok) throw new Error('Failed to fetch campaigns');
        const campaignsData = await campaignsResponse.json();

        // Convert date strings to Date objects
        const processedCampaigns = campaignsData.campaigns.map((campaign: any) => ({
          ...campaign,
          createdAt: new Date(campaign.createdAt),
          contents: campaign.contents.map((content: any) => ({
            ...content,
            generatedAt: new Date(content.generatedAt),
          })),
        }));

        setCampaigns(processedCampaigns);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleDownloadPDF = async (content: GeneratedContent, campaign: Campaign) => {
    if (!content.pdfData) return;

    try {
      const response = await fetch('/api/render-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfData: content.pdfData,
          brandProfile: campaign.brandProfile,
          logoUrl: campaign.logoUrl,
          clientName: campaign.clientName,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate PDF');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${campaign.clientName.replace(/[^a-z0-9]/gi, '_')}_OnePager.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF. Please try again.');
    }
  };

  const allContents: Array<{ content: GeneratedContent; campaign: Campaign }> = campaigns.flatMap(
    (campaign) =>
      campaign.contents.map((content) => ({
        content,
        campaign,
      }))
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your marketing materials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ClientPortalNav />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm">Total Campaigns</p>
            <p className="text-3xl font-bold text-purple-600">{campaigns.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm">Marketing Materials</p>
            <p className="text-3xl font-bold text-blue-600">{allContents.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm">PDF One-Pagers</p>
            <p className="text-3xl font-bold text-green-600">
              {allContents.filter((c) => c.content.type === 'pdf-onepager').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm">Social Posts</p>
            <p className="text-3xl font-bold text-orange-600">
              {allContents.filter((c) => ['linkedin', 'twitter'].includes(c.content.type)).length}
            </p>
          </div>
        </div>

        {/* Content Grid */}
        {allContents.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <svg
              className="w-20 h-20 text-gray-300 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Marketing Materials Yet</h3>
            <p className="text-gray-600">
              Your marketing content will appear here once BluePeak creates campaigns for you
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allContents.map(({ content, campaign }, index) => (
              <div
                key={content.id || index}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden"
              >
                {/* Card Header */}
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{contentTypeIcons[content.type]}</span>
                    <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                      {campaign.topic}
                    </span>
                  </div>
                  <h3 className="font-semibold text-lg">{contentTypeLabels[content.type]}</h3>
                  <p className="text-xs text-purple-100 mt-1">
                    {new Date(content.generatedAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Card Body */}
                <div className="p-4">
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-1">Campaign</p>
                    <p className="text-sm font-medium text-gray-900">{campaign.clientName}</p>
                  </div>

                  {content.type === 'pdf-onepager' && content.pdfData ? (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-900 line-clamp-2">
                        {content.pdfData.headline}
                      </p>
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {content.pdfData.subheadline}
                      </p>
                      {content.pdfData.template && (
                        <span className="inline-block text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                          {content.pdfData.template.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-700 line-clamp-4">{content.content}</p>
                  )}

                  {content.wordCount && (
                    <p className="text-xs text-gray-500 mt-2">
                      {content.wordCount} words • {content.characterCount} characters
                    </p>
                  )}
                </div>

                {/* Card Footer */}
                <div className="px-4 pb-4">
                  {content.type === 'pdf-onepager' ? (
                    <button
                      onClick={() => handleDownloadPDF(content, campaign)}
                      className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                    >
                      Download PDF
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedContent(content);
                        setSelectedCampaign(campaign);
                      }}
                      className="w-full bg-gray-100 text-gray-900 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                    >
                      View Full Content
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Content Modal */}
      {selectedContent && selectedCampaign && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {contentTypeIcons[selectedContent.type]} {contentTypeLabels[selectedContent.type]}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedCampaign.clientName} • {selectedCampaign.topic}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedContent(null);
                    setSelectedCampaign(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-gray-900 leading-relaxed">
                  {selectedContent.content}
                </pre>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  <p>Generated on {new Date(selectedContent.generatedAt).toLocaleString()}</p>
                  {selectedContent.wordCount && (
                    <p>{selectedContent.wordCount} words • {selectedContent.characterCount} characters</p>
                  )}
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedContent.content);
                    alert('Content copied to clipboard!');
                  }}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                >
                  Copy to Clipboard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
