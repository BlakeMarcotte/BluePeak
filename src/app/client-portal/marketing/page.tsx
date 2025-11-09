'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Client, ContentType, GeneratedContent } from '@/types';
import ClientPortalNav from '@/components/ClientPortalNav';

const CONTENT_TYPES: { value: ContentType; label: string; icon: string }[] = [
  { value: 'pdf-onepager', label: 'PDF Materials', icon: '📄' },
  { value: 'blog', label: 'Blog Posts', icon: '📝' },
  { value: 'linkedin', label: 'LinkedIn', icon: '💼' },
  { value: 'twitter', label: 'Twitter', icon: '🐦' },
  { value: 'email', label: 'Emails', icon: '📧' },
  { value: 'ad-copy', label: 'Ad Copy', icon: '📢' },
];

export default function ClientMarketingPage() {
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ContentType>('pdf-onepager');
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [editingPdfId, setEditingPdfId] = useState<string | null>(null);
  const [editedPdfData, setEditedPdfData] = useState<any>(null);
  const [savingPdf, setSavingPdf] = useState(false);
  const [editingContentId, setEditingContentId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState<string>('');
  const [savingContent, setSavingContent] = useState(false);
  const [generatingVariant, setGeneratingVariant] = useState(false);
  const [generatingVariantId, setGeneratingVariantId] = useState<string | null>(null);
  const [pdfPreviews, setPdfPreviews] = useState<Record<string, string>>({});
  const [loadingPdfPreviews, setLoadingPdfPreviews] = useState<Record<string, boolean>>({});
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        router.push('/client-portal/login');
        return;
      }

      try {
        const response = await fetch(`/api/client-auth/profile?uid=${firebaseUser.uid}`);
        if (!response.ok) throw new Error('Failed to fetch profile');

        const data = await response.json();
        const clientData: Client = {
          ...data.client,
          createdAt: new Date(data.client.createdAt),
          updatedAt: new Date(data.client.updatedAt),
          accountCreatedAt: data.client.accountCreatedAt ? new Date(data.client.accountCreatedAt) : undefined,
        };

        setClient(clientData);
      } catch (error) {
        console.error('Error fetching client profile:', error);
        alert('Failed to load your profile');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Generate PDF previews when client data loads or active tab changes
  useEffect(() => {
    if (client && activeTab === 'pdf-onepager') {
      const pdfContent = (client.marketingContent || []).filter(
        item => item.published && item.type === 'pdf-onepager' && item.pdfData
      );

      pdfContent.forEach(item => {
        if (item.id && !pdfPreviews[item.id] && !loadingPdfPreviews[item.id]) {
          generatePdfPreview(item.id, item.pdfData);
        }
      });
    }
  }, [client, activeTab]);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(pdfPreviews).forEach(url => {
        window.URL.revokeObjectURL(url);
      });
    };
  }, [pdfPreviews]);

  const generatePdfPreview = async (contentId: string, pdfData: any) => {
    if (!client) return;

    setLoadingPdfPreviews(prev => ({ ...prev, [contentId]: true }));

    try {
      const response = await fetch('/api/render-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfData,
          brandProfile: client.brandProfile,
          logoUrl: client.logoUrl,
          clientName: client.company,
        }),
      });

      if (!response.ok) throw new Error('Failed to render PDF');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      setPdfPreviews(prev => ({ ...prev, [contentId]: url }));
    } catch (error) {
      console.error('Error generating PDF preview:', error);
    } finally {
      setLoadingPdfPreviews(prev => ({ ...prev, [contentId]: false }));
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const downloadPDF = async (pdfData: any, contentName?: string) => {
    if (!client) return;

    setDownloadingPdf(true);
    try {
      const response = await fetch('/api/render-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfData,
          brandProfile: client.brandProfile,
          logoUrl: client.logoUrl,
          clientName: client.company,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to render PDF');
      }

      // Create blob from response and trigger download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');

      // Use content name if provided, otherwise use client name
      const filename = contentName
        ? `${contentName.replace(/[^a-z0-9]/gi, '_')}.pdf`
        : `${client.company.replace(/[^a-z0-9]/gi, '_')}_OnePager.pdf`;

      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF. Please try again.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const startEditingPdf = (contentId: string, pdfData: any) => {
    setEditingPdfId(contentId);
    setEditedPdfData({ ...pdfData });
  };

  const cancelEditingPdf = () => {
    setEditingPdfId(null);
    setEditedPdfData(null);
  };

  const updatePdfField = (field: string, value: any) => {
    setEditedPdfData((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const updatePdfStat = (index: number, field: string, value: string) => {
    setEditedPdfData((prev: any) => {
      const newStats = [...(prev.stats || [])];
      newStats[index] = { ...newStats[index], [field]: value };
      return { ...prev, stats: newStats };
    });
  };

  const updatePdfBenefit = (index: number, value: string) => {
    setEditedPdfData((prev: any) => {
      const newBenefits = [...(prev.keyBenefits || [])];
      newBenefits[index] = value;
      return { ...prev, keyBenefits: newBenefits };
    });
  };

  const updatePdfContact = (field: string, value: string) => {
    setEditedPdfData((prev: any) => ({
      ...prev,
      contactInfo: {
        ...prev.contactInfo,
        [field]: value
      }
    }));
  };

  const savePdfEdit = async (contentId: string) => {
    if (!client || !editedPdfData) return;

    setSavingPdf(true);
    try {
      // Find the content item and update it
      const updatedContent = (client.marketingContent || []).map(c =>
        c.id === contentId ? { ...c, pdfData: editedPdfData } : c
      );

      const response = await fetch('/api/clients', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: client.id,
          marketingContent: updatedContent,
        }),
      });

      if (!response.ok) throw new Error('Failed to save PDF edits');

      // Reload client data
      const profileResponse = await fetch(`/api/client-auth/profile?uid=${auth.currentUser?.uid}`);
      if (profileResponse.ok) {
        const data = await profileResponse.json();
        const clientData: Client = {
          ...data.client,
          createdAt: new Date(data.client.createdAt),
          updatedAt: new Date(data.client.updatedAt),
          accountCreatedAt: data.client.accountCreatedAt ? new Date(data.client.accountCreatedAt) : undefined,
        };
        setClient(clientData);

        // Regenerate PDF preview with edited data
        if (editedPdfData) {
          generatePdfPreview(contentId, editedPdfData);
        }
      }

      setEditingPdfId(null);
      setEditedPdfData(null);
    } catch (error) {
      console.error('Error saving PDF edit:', error);
      alert('Failed to save PDF changes. Please try again.');
    } finally {
      setSavingPdf(false);
    }
  };

  // Text Content Editing Functions
  const startEditingContent = (contentId: string, content: string) => {
    setEditingContentId(contentId);
    setEditedContent(content);
  };

  const cancelEditingContent = () => {
    setEditingContentId(null);
    setEditedContent('');
  };

  const saveContentEdit = async (contentId: string) => {
    if (!client || !editedContent.trim()) return;

    setSavingContent(true);
    try {
      // Find the content item and update it
      const updatedContent = (client.marketingContent || []).map(c => {
        if (c.id === contentId) {
          return {
            ...c,
            content: editedContent,
            wordCount: editedContent.trim().split(/\s+/).length,
            characterCount: editedContent.length,
          };
        }
        return c;
      });

      const response = await fetch('/api/clients', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: client.id,
          marketingContent: updatedContent,
        }),
      });

      if (!response.ok) throw new Error('Failed to save content edits');

      // Reload client data
      const profileResponse = await fetch(`/api/client-auth/profile?uid=${auth.currentUser?.uid}`);
      if (profileResponse.ok) {
        const data = await profileResponse.json();
        const clientData: Client = {
          ...data.client,
          createdAt: new Date(data.client.createdAt),
          updatedAt: new Date(data.client.updatedAt),
          accountCreatedAt: data.client.accountCreatedAt ? new Date(data.client.accountCreatedAt) : undefined,
        };
        setClient(clientData);
      }

      setEditingContentId(null);
      setEditedContent('');
    } catch (error) {
      console.error('Error saving content edit:', error);
      alert('Failed to save content changes. Please try again.');
    } finally {
      setSavingContent(false);
    }
  };

  const generateVariant = async (originalContent: GeneratedContent) => {
    if (!client) return;

    setGeneratingVariant(true);
    setGeneratingVariantId(originalContent.id!);

    try {
      // Count existing variants to determine label
      const existingVariants = (client.marketingContent || []).filter(
        c => c.variantOfId === originalContent.id
      );
      const variantLetter = String.fromCharCode(65 + existingVariants.length); // A, B, C, etc.

      // Generate variant via API
      const response = await fetch('/api/generate-variant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalContent: originalContent.content,
          originalName: originalContent.name,
          contentType: originalContent.type,
          clientName: client.company,
          industry: client.industry || '',
          topic: originalContent.name,
          targetAudience: client.discoveryData?.targetAudience || 'General audience',
          brandVoice: client.discoveryData?.businessGoals || '',
          brandProfile: client.brandProfile,
          pdfData: originalContent.pdfData,
          clientEmail: client.email,
          clientPhone: client.phone,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMsg = errorData.details || errorData.error || 'Failed to generate variant';
        throw new Error(errorMsg);
      }

      const result = await response.json();

      // Create new variant content
      const newVariant: GeneratedContent = {
        id: `variant_${Date.now()}`,
        name: `${originalContent.name} - Variant ${variantLetter}`,
        type: originalContent.type,
        content: result.content,
        wordCount: result.wordCount,
        characterCount: result.characterCount,
        generatedAt: new Date(),
        pdfData: result.pdfData,
        published: true,
        variantOfId: originalContent.id,
        variantLabel: `Variant ${variantLetter}`,
      };

      // If the original doesn't have a label yet, add "Original"
      const updatedContent = (client.marketingContent || []).map(c => {
        if (c.id === originalContent.id && !c.variantLabel) {
          return { ...c, variantLabel: 'Original' };
        }
        return c;
      });

      // Add the new variant
      updatedContent.push(newVariant);

      // Save to database
      const saveResponse = await fetch('/api/clients', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: client.id,
          marketingContent: updatedContent,
        }),
      });

      if (!saveResponse.ok) throw new Error('Failed to save variant');

      // Reload client data
      const profileResponse = await fetch(`/api/client-auth/profile?uid=${auth.currentUser?.uid}`);
      if (profileResponse.ok) {
        const data = await profileResponse.json();
        const clientData: Client = {
          ...data.client,
          createdAt: new Date(data.client.createdAt),
          updatedAt: new Date(data.client.updatedAt),
          accountCreatedAt: data.client.accountCreatedAt ? new Date(data.client.accountCreatedAt) : undefined,
        };
        setClient(clientData);
      }

      alert(`Variant ${variantLetter} generated successfully!`);
    } catch (error) {
      console.error('Error generating variant:', error);
      alert('Failed to generate variant. Please try again.');
    } finally {
      setGeneratingVariant(false);
      setGeneratingVariantId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-blue-100">
        <ClientPortalNav />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white/95 backdrop-blur-sm border border-cyan-200 rounded-xl shadow-lg p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600 mr-3"></div>
              <p className="text-gray-700">Loading your marketing content...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!client) return null;

  // Only show published content to clients
  const marketingContent = (client.marketingContent || []).filter(item => item.published === true);

  // Group variants with their originals
  const contentByType = marketingContent.filter((item) => item.type === activeTab);

  // Sort into groups: originals first, then their variants
  const groupedContent: GeneratedContent[] = [];
  const processedIds = new Set<string>();

  contentByType.forEach((item) => {
    // Skip if already processed (as a variant)
    if (processedIds.has(item.id!)) return;

    // If this is an original or standalone content
    if (!item.variantOfId) {
      groupedContent.push(item);
      processedIds.add(item.id!);

      // Find all its variants
      const variants = contentByType
        .filter(v => v.variantOfId === item.id)
        .sort((a, b) => new Date(a.generatedAt).getTime() - new Date(b.generatedAt).getTime());

      variants.forEach(variant => {
        groupedContent.push(variant);
        processedIds.add(variant.id!);
      });
    }
  });

  // Add any orphaned variants (shouldn't happen, but just in case)
  contentByType.forEach((item) => {
    if (!processedIds.has(item.id!)) {
      groupedContent.push(item);
    }
  });

  const filteredContent = groupedContent;

  const activeContentType = CONTENT_TYPES.find((ct) => ct.value === activeTab);

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-blue-100">
      <ClientPortalNav />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-900 to-cyan-600 bg-clip-text text-transparent mb-2">Marketing Content</h1>
          <p className="text-gray-700">Access all the marketing materials generated for {client.company}</p>
        </div>

        {/* Content Type Tabs */}
        <div className="bg-white/95 backdrop-blur-sm border border-cyan-200 rounded-xl shadow-lg mb-6">
          <div className="border-b border-cyan-100 overflow-x-auto">
            <nav className="flex -mb-px">
              {CONTENT_TYPES.map(({ value, label }) => {
                const count = marketingContent.filter((c) => c.type === value).length;
                return (
                  <button
                    key={value}
                    onClick={() => setActiveTab(value)}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                      activeTab === value
                        ? 'border-cyan-600 text-cyan-700 bg-cyan-50/50'
                        : 'border-transparent text-gray-600 hover:text-cyan-700 hover:bg-cyan-50/30 hover:border-cyan-300'
                    }`}
                  >
                    {label}
                    {count > 0 && (
                      <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                        activeTab === value
                          ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content Display */}
        {filteredContent.length === 0 ? (
          <div className="bg-white/95 backdrop-blur-sm border border-cyan-200 rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No {activeContentType?.label} Yet
            </h3>
            <p className="text-gray-700 max-w-md mx-auto">
              Your BluePeak team is working on creating marketing materials for your business. Published content will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredContent.map((item, index) => {
              const isVariant = !!item.variantOfId;
              const nextIsVariant = index < filteredContent.length - 1 && filteredContent[index + 1].variantOfId === item.variantOfId;

              return (
              <div key={item.id} className={`bg-white/95 backdrop-blur-sm border rounded-xl shadow-md p-6 ${
                isVariant ? 'border-cyan-300 ml-8 bg-cyan-50/30' : 'border-cyan-200'
              }`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                      {item.variantLabel && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-full">
                          {item.variantLabel}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {item.wordCount && `${item.wordCount} words`}
                      {item.characterCount && ` • ${item.characterCount} characters`}
                      {' • '}
                      Generated {new Date(item.generatedAt).toLocaleDateString()} at{' '}
                      {new Date(item.generatedAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {/* A/B Test Button */}
                    <button
                      onClick={() => router.push(`/client-portal/ab-test/${item.id}`)}
                      className="px-3 py-1.5 text-sm font-medium text-cyan-700 hover:text-cyan-800 hover:bg-cyan-50 rounded-lg transition-colors flex items-center gap-1 border border-cyan-200"
                      title="Compare A/B test variants"
                    >
                      <span>🔬</span>
                      A/B Test
                    </button>
                    {/* PDF Download Button */}
                    {activeTab === 'pdf-onepager' && item.pdfData && (
                      <>
                        <button
                          onClick={() => downloadPDF(item.pdfData, item.name)}
                          disabled={downloadingPdf}
                          className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 rounded-lg transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {downloadingPdf ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Generating...
                            </>
                          ) : (
                            'Download PDF'
                          )}
                        </button>
                        <button
                          onClick={() => startEditingPdf(item.id!, item.pdfData)}
                          disabled={downloadingPdf}
                          className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300"
                        >
                          Edit PDF Content
                        </button>
                      </>
                    )}
                    {/* Regular Content Buttons */}
                    {activeTab !== 'pdf-onepager' && (
                      <>
                        <button
                          onClick={() => startEditingContent(item.id!, item.content)}
                          className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-gray-300"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => copyToClipboard(item.content)}
                          className="px-3 py-1.5 text-sm font-medium text-cyan-700 hover:text-cyan-800 hover:bg-cyan-50 rounded-lg transition-colors border border-cyan-200"
                        >
                          Copy
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Content Display */}
                <div>
                  {activeTab === 'pdf-onepager' && item.pdfData ? (
                    /* PDF Preview */
                    <div className="w-full">
                      {loadingPdfPreviews[item.id!] ? (
                        <div className="flex items-center justify-center h-96 bg-cyan-50/50 rounded-lg border border-cyan-100">
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
                            <p className="text-gray-700">Generating PDF preview...</p>
                          </div>
                        </div>
                      ) : pdfPreviews[item.id!] ? (
                        <iframe
                          src={`${pdfPreviews[item.id!]}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                          className="w-full h-[600px] border border-cyan-200 rounded-lg shadow-inner"
                          title={`${item.name} PDF Preview`}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-96 bg-cyan-50/50 rounded-lg border border-cyan-100">
                          <p className="text-gray-700">PDF preview not available</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Regular Content Display */
                    <div className="prose prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-200">
                        {item.content}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
              );
            })}
          </div>
        )}
      </main>

      {/* PDF Edit Modal */}
      {editingPdfId && editedPdfData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-cyan-200">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-cyan-500 to-blue-600 border-b border-cyan-300 px-6 py-4 rounded-t-2xl">
              <h2 className="text-xl font-bold text-white">Edit PDF Content</h2>
              <p className="text-sm text-cyan-50 mt-1">
                Edit your PDF content below. Character limits help maintain proper layout.
              </p>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-4 space-y-6">
              {/* Headline */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Headline <span className="text-xs text-gray-500">({editedPdfData.headline?.length || 0}/60 characters)</span>
                </label>
                <input
                  type="text"
                  value={editedPdfData.headline || ''}
                  onChange={(e) => {
                    if (e.target.value.length <= 60) {
                      updatePdfField('headline', e.target.value);
                    }
                  }}
                  maxLength={60}
                  className={`w-full px-3 py-2 border rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                    (editedPdfData.headline?.length || 0) > 55 ? 'border-yellow-500' : 'border-cyan-200'
                  }`}
                  placeholder="Enter headline..."
                />
                {(editedPdfData.headline?.length || 0) > 55 && (
                  <p className="text-xs text-yellow-600 mt-1">Approaching character limit</p>
                )}
              </div>

              {/* Subheadline */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subheadline <span className="text-xs text-gray-500">({editedPdfData.subheadline?.length || 0}/120 characters)</span>
                </label>
                <textarea
                  value={editedPdfData.subheadline || ''}
                  onChange={(e) => {
                    if (e.target.value.length <= 120) {
                      updatePdfField('subheadline', e.target.value);
                    }
                  }}
                  maxLength={120}
                  rows={2}
                  className={`w-full px-3 py-2 border rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                    (editedPdfData.subheadline?.length || 0) > 110 ? 'border-yellow-500' : 'border-cyan-200'
                  }`}
                  placeholder="Enter subheadline..."
                />
                {(editedPdfData.subheadline?.length || 0) > 110 && (
                  <p className="text-xs text-yellow-600 mt-1">Approaching character limit</p>
                )}
              </div>

              {/* Stats */}
              {editedPdfData.stats && editedPdfData.stats.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Stats</h3>
                  <div className="space-y-3">
                    {editedPdfData.stats.map((stat: any, idx: number) => (
                      <div key={idx} className="grid grid-cols-2 gap-3 p-3 bg-cyan-50/50 rounded-lg border border-cyan-100">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Value <span className="text-gray-500">({stat.value?.length || 0}/10)</span>
                          </label>
                          <input
                            type="text"
                            value={stat.value || ''}
                            onChange={(e) => {
                              if (e.target.value.length <= 10) {
                                updatePdfStat(idx, 'value', e.target.value);
                              }
                            }}
                            maxLength={10}
                            className="w-full px-2 py-1.5 border border-cyan-200 rounded text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                            placeholder="e.g., 250+"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Label <span className="text-gray-500">({stat.label?.length || 0}/30)</span>
                          </label>
                          <input
                            type="text"
                            value={stat.label || ''}
                            onChange={(e) => {
                              if (e.target.value.length <= 30) {
                                updatePdfStat(idx, 'label', e.target.value);
                              }
                            }}
                            maxLength={30}
                            className="w-full px-2 py-1.5 border border-cyan-200 rounded text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                            placeholder="e.g., Active Users"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Benefits */}
              {editedPdfData.keyBenefits && editedPdfData.keyBenefits.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Key Benefits</h3>
                  <div className="space-y-3">
                    {editedPdfData.keyBenefits.map((benefit: string, idx: number) => (
                      <div key={idx}>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Benefit {idx + 1} <span className="text-gray-500">({benefit?.length || 0}/150 characters)</span>
                        </label>
                        <textarea
                          value={benefit || ''}
                          onChange={(e) => {
                            if (e.target.value.length <= 150) {
                              updatePdfBenefit(idx, e.target.value);
                            }
                          }}
                          maxLength={150}
                          rows={2}
                          className={`w-full px-3 py-2 border rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm ${
                            (benefit?.length || 0) > 140 ? 'border-yellow-500' : 'border-cyan-200'
                          }`}
                          placeholder="Enter benefit..."
                        />
                        {(benefit?.length || 0) > 140 && (
                          <p className="text-xs text-yellow-600 mt-1">Approaching character limit</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Call to Action */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Call to Action <span className="text-xs text-gray-500">({editedPdfData.callToAction?.length || 0}/80 characters)</span>
                </label>
                <textarea
                  value={editedPdfData.callToAction || ''}
                  onChange={(e) => {
                    if (e.target.value.length <= 80) {
                      updatePdfField('callToAction', e.target.value);
                    }
                  }}
                  maxLength={80}
                  rows={2}
                  className={`w-full px-3 py-2 border rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                    (editedPdfData.callToAction?.length || 0) > 75 ? 'border-yellow-500' : 'border-cyan-200'
                  }`}
                  placeholder="Enter call to action..."
                />
                {(editedPdfData.callToAction?.length || 0) > 75 && (
                  <p className="text-xs text-yellow-600 mt-1">Approaching character limit</p>
                )}
              </div>

              {/* Contact Info */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Contact Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                    <input
                      type="email"
                      value={editedPdfData.contactInfo?.email || ''}
                      onChange={(e) => updatePdfContact('email', e.target.value)}
                      className="w-full px-3 py-2 border border-cyan-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                      placeholder="contact@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={editedPdfData.contactInfo?.phone || ''}
                      onChange={(e) => updatePdfContact('phone', e.target.value)}
                      className="w-full px-3 py-2 border border-cyan-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t border-cyan-200 px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
              <button
                onClick={cancelEditingPdf}
                disabled={savingPdf}
                className="px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => savePdfEdit(editingPdfId)}
                disabled={savingPdf}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-md"
              >
                {savingPdf && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                {savingPdf ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Text Content Edit Modal */}
      {editingContentId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-cyan-200">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-cyan-500 to-blue-600 border-b border-cyan-300 px-6 py-4 rounded-t-2xl">
              <h2 className="text-xl font-bold text-white">Edit Content</h2>
              <p className="text-sm text-cyan-50 mt-1">
                Edit your {CONTENT_TYPES.find(ct => ct.value === activeTab)?.label.toLowerCase()} content below.
                {activeTab === 'linkedin' && ' LinkedIn has a 1,300 character limit.'}
                {activeTab === 'twitter' && ' Keep tweets under 280 characters each.'}
              </p>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Content
                  </label>
                  <span className="text-xs text-gray-500">
                    {editedContent.length} characters • {editedContent.trim().split(/\s+/).length} words
                    {activeTab === 'linkedin' && editedContent.length > 1300 && (
                      <span className="text-red-600 ml-2">• Exceeds LinkedIn limit!</span>
                    )}
                  </span>
                </div>
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  rows={20}
                  className={`w-full px-4 py-3 border rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono text-sm ${
                    activeTab === 'linkedin' && editedContent.length > 1300
                      ? 'border-red-500'
                      : editedContent.length > (activeTab === 'linkedin' ? 1200 : 10000)
                      ? 'border-yellow-500'
                      : 'border-cyan-200'
                  }`}
                  placeholder="Enter your content..."
                />
                {activeTab === 'linkedin' && editedContent.length > 1200 && editedContent.length <= 1300 && (
                  <p className="text-xs text-yellow-600 mt-2">Approaching LinkedIn character limit</p>
                )}
                {activeTab === 'blog' && (
                  <p className="text-xs text-gray-500 mt-2">
                    Recommended: 800-1,200 words for SEO-optimized blog posts
                  </p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t border-cyan-200 px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
              <button
                onClick={cancelEditingContent}
                disabled={savingContent}
                className="px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => saveContentEdit(editingContentId)}
                disabled={savingContent || (activeTab === 'linkedin' && editedContent.length > 1300)}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-md"
              >
                {savingContent && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                {savingContent ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
