'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { Client, ContentType, GeneratedContent, PDFTemplate } from '@/types';

const CONTENT_TYPES: { value: ContentType; label: string; description: string }[] = [
  { value: 'pdf-onepager', label: 'PDF One-Pager', description: 'Professional one-page PDF with design' },
  { value: 'blog', label: 'Blog Post', description: '800-1200 words, SEO-optimized' },
  { value: 'linkedin', label: 'LinkedIn Post', description: 'Professional, 1300 char max' },
  { value: 'twitter', label: 'Twitter Thread', description: '5-7 tweets, engaging' },
  { value: 'email', label: 'Email Copy', description: 'Subject + body, conversion-focused' },
  { value: 'ad-copy', label: 'Ad Copy', description: 'Headline + description + CTA' },
];

export default function ClientMarketingPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<ContentType>('pdf-onepager');
  const [contentName, setContentName] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<PDFTemplate>('modern-minimal');
  const [analyzingBrand, setAnalyzingBrand] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [editingPdfId, setEditingPdfId] = useState<string | null>(null);
  const [editedPdfData, setEditedPdfData] = useState<any>(null);
  const [savingPdf, setSavingPdf] = useState(false);
  const [editingContentId, setEditingContentId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState<string>('');
  const [savingContent, setSavingContent] = useState(false);
  const [deletingContentId, setDeletingContentId] = useState<string | null>(null);
  const [pdfPreviews, setPdfPreviews] = useState<Record<string, string>>({});
  const [loadingPdfPreviews, setLoadingPdfPreviews] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (params.id) {
      loadClient();
    }
  }, [params.id]);

  const loadClient = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/clients/${params.id}`);
      if (!response.ok) throw new Error('Failed to fetch client');

      const data = await response.json();

      const clientData: Client = {
        ...data.client,
        createdAt: new Date(data.client.createdAt),
        updatedAt: new Date(data.client.updatedAt),
        marketingContent: (data.client.marketingContent || []).map((content: any) => ({
          ...content,
          generatedAt: new Date(content.generatedAt),
        })),
      };

      setClient(clientData);
    } catch (error) {
      console.error('Error loading client:', error);
      alert('Failed to load client');
      router.push('/marketing');
    } finally {
      setLoading(false);
    }
  };

  // Generate PDF previews when client data loads or active tab changes
  useEffect(() => {
    if (client && activeTab === 'pdf-onepager') {
      const pdfContent = (client.marketingContent || []).filter(
        item => item.type === 'pdf-onepager' && item.pdfData
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

  const handleAnalyzeBrand = async () => {
    if (!client || !client.logoUrl) {
      alert('No logo found for this client. Please upload a logo first.');
      return;
    }

    setAnalyzingBrand(true);
    try {
      const response = await fetch('/api/analyze-brand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logoUrl: client.logoUrl,
          clientId: client.id,
        }),
      });

      if (!response.ok) throw new Error('Failed to analyze brand');

      const { brandProfile } = await response.json();

      // Save brand profile to Firebase
      const updateResponse = await fetch('/api/clients', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: client.id,
          brandProfile,
        }),
      });

      if (!updateResponse.ok) throw new Error('Failed to save brand profile');

      // Update client with brand profile
      setClient({ ...client, brandProfile });
      alert('Brand analysis complete!');
    } catch (error) {
      console.error('Error analyzing brand:', error);
      alert('Failed to analyze brand. Please try again.');
    } finally {
      setAnalyzingBrand(false);
    }
  };

  const handleGenerateContent = async () => {
    if (!client || !user) return;

    setGenerating(true);

    try {
      const response = await fetch('/api/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: client.company,
          industry: client.industry || client.discoveryData?.industry,
          topic: client.discoveryData?.businessGoals,
          targetAudience: client.discoveryData?.targetAudience,
          brandVoice: 'professional',
          brandProfile: client.brandProfile,
          contentType: activeTab,
          notes: additionalContext.trim() || undefined,
          clientEmail: client.email,
          clientPhone: client.phone,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate content');
      }

      const { content, wordCount, characterCount, pdfData } = await response.json();

      // If PDF, add the selected template to the data
      const finalPdfData = pdfData ? { ...pdfData, template: selectedTemplate } : undefined;

      const newContent: GeneratedContent = {
        id: Date.now().toString(),
        type: activeTab,
        name: contentName.trim(), // Now required
        content,
        wordCount,
        characterCount,
        generatedAt: new Date(),
        pdfData: finalPdfData,
        published: false, // Default to unpublished
      };

      // Save to client's marketingContent
      const updatedContent = [...(client.marketingContent || []), newContent];

      const updateResponse = await fetch('/api/clients', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: client.id,
          marketingContent: updatedContent,
        }),
      });

      if (!updateResponse.ok) throw new Error('Failed to save content');

      // Reload client to get updated content
      await loadClient();

      // Clear form fields after successful generation
      setContentName('');
      setAdditionalContext('');
    } catch (error) {
      console.error('Error generating content:', error);
      alert('Failed to generate content. Please try again.');
    } finally {
      setGenerating(false);
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

  const handleDeleteContent = async (contentId: string) => {
    if (!client) return;

    // Confirm deletion
    const confirmed = window.confirm('Are you sure you want to delete this content? This action cannot be undone.');
    if (!confirmed) return;

    setDeletingContentId(contentId);
    try {
      // Remove content from client's marketingContent array
      const updatedContent = (client.marketingContent || []).filter(c => c.id !== contentId);

      const response = await fetch('/api/clients', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: client.id,
          marketingContent: updatedContent,
        }),
      });

      if (!response.ok) throw new Error('Failed to delete content');

      await loadClient();
    } catch (error) {
      console.error('Error deleting content:', error);
      alert('Failed to delete content. Please try again.');
    } finally {
      setDeletingContentId(null);
    }
  };

  const handleTogglePublish = async (contentId: string, currentPublishedState: boolean) => {
    if (!client) return;

    try {
      // Toggle the published state
      const updatedContent = (client.marketingContent || []).map(c =>
        c.id === contentId ? { ...c, published: !currentPublishedState } : c
      );

      const response = await fetch('/api/clients', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: client.id,
          marketingContent: updatedContent,
        }),
      });

      if (!response.ok) throw new Error('Failed to update publish status');

      await loadClient();
    } catch (error) {
      console.error('Error toggling publish status:', error);
      alert('Failed to update publish status. Please try again.');
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

      await loadClient();

      // Regenerate PDF preview with edited data
      if (editedPdfData) {
        generatePdfPreview(contentId, editedPdfData);
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

      await loadClient();
      setEditingContentId(null);
      setEditedContent('');
    } catch (error) {
      console.error('Error saving content edit:', error);
      alert('Failed to save content changes. Please try again.');
    } finally {
      setSavingContent(false);
    }
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
                <p className="text-slate-700">Loading client...</p>
              </div>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  if (!client) {
    return null;
  }

  // Filter content by active tab and sort by newest first
  const filteredContent = (client.marketingContent || [])
    .filter((item) => item.type === activeTab)
    .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());

  const activeContentType = CONTENT_TYPES.find((ct) => ct.value === activeTab);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.push('/marketing')}
              className="flex items-center text-slate-600 hover:text-slate-900 mb-4 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
              </svg>
              Back to Clients
            </button>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Marketing Content for {client.company}
            </h1>
            <p className="text-slate-600">
              {client.industry && `${client.industry} • `}
              {client.discoveryData?.targetAudience || 'No target audience specified'}
            </p>
          </div>

          {/* Client Info Card */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-slate-900 mb-3">Client Information</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">Contact</p>
                    <p className="text-sm text-slate-900">{client.name}</p>
                    <p className="text-sm text-slate-600">{client.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Business Goals</p>
                    <p className="text-sm text-slate-900">
                      {client.discoveryData?.businessGoals || 'Not specified'}
                    </p>
                  </div>
                </div>

                {/* Brand Profile Display */}
                {client.brandProfile && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium text-slate-700">Brand Profile</p>
                      <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                        ✓ Analyzed
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {/* Colors */}
                      <div>
                        <p className="text-xs text-slate-500 mb-1.5">Color Palette</p>
                        <div className="flex gap-1.5 flex-wrap">
                          {client.brandProfile.colors.map((color, idx) => (
                            <div
                              key={idx}
                              className="w-6 h-6 rounded border border-slate-300 shadow-sm"
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Style */}
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Style</p>
                        <p className="text-xs text-slate-900">{client.brandProfile.style}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {client.logoUrl && (
                <div className="ml-6 flex-shrink-0">
                  <img
                    src={client.logoUrl}
                    alt={`${client.company} logo`}
                    className="w-20 h-20 object-contain rounded border border-slate-200"
                  />
                  {!client.brandProfile && (
                    <button
                      onClick={handleAnalyzeBrand}
                      disabled={analyzingBrand}
                      className="mt-2 w-full px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {analyzingBrand ? 'Analyzing...' : 'Analyze Brand'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white border border-slate-200 rounded-lg mb-6">
            <div className="border-b border-slate-200 overflow-x-auto">
              <nav className="flex -mb-px">
                {CONTENT_TYPES.map(({ value, label }) => {
                  const count = (client.marketingContent || []).filter((c) => c.type === value).length;
                  return (
                    <button
                      key={value}
                      onClick={() => setActiveTab(value)}
                      className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                        activeTab === value
                          ? 'border-indigo-600 text-indigo-600'
                          : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                      }`}
                    >
                      {label}
                      {count > 0 && (
                        <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-700">
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Tab Content - Generation Form */}
            <div className="p-6">
              {/* Description */}
              <div className="mb-6">
                <p className="text-sm text-slate-600">{activeContentType?.description}</p>
              </div>

              {/* Content Name Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Content Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={contentName}
                  onChange={(e) => setContentName(e.target.value)}
                  placeholder={`e.g., "Summer Campaign ${activeContentType?.label}" or "Q4 Launch Material"`}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  disabled={generating}
                  required
                />
                <p className="text-xs text-slate-500 mt-1">
                  Give this content a custom name to easily identify it later
                </p>
              </div>

              {/* Template Selector - Only for PDF One-Pager */}
              {activeTab === 'pdf-onepager' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Template Style
                  </label>
                  <select
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value as PDFTemplate)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    disabled={generating}
                  >
                    <option value="modern-minimal">Modern Minimal - Clean & elegant</option>
                    <option value="bold-impact">Bold Impact - High contrast & eye-catching</option>
                    <option value="corporate-professional">Corporate Professional - Traditional & structured</option>
                    <option value="creative-geometric">Creative Geometric - Modern shapes & gradients</option>
                  </select>
                  <p className="text-xs text-slate-500 mt-1">
                    Choose a design style that matches your brand personality
                  </p>
                </div>
              )}

              {/* Additional Context Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Additional Context (Optional)
                </label>
                <textarea
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  placeholder="Add specific themes, angles, or requirements for this content..."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  disabled={generating}
                />
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerateContent}
                disabled={generating || !contentName.trim()}
                className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {generating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Generating {activeContentType?.label}...
                  </>
                ) : (
                  `Generate ${activeContentType?.label}`
                )}
              </button>
              {!contentName.trim() && !generating && (
                <p className="text-xs text-amber-600 mt-2">
                  Please enter a content name to generate
                </p>
              )}
            </div>
          </div>

          {/* Content History */}
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              {activeContentType?.label} History ({filteredContent.length})
            </h2>

            {filteredContent.length > 0 ? (
              <div className="space-y-4">
                {filteredContent.map((item, index) => (
                  <div key={item.id || index} className="bg-white border border-slate-200 rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-slate-900 mb-1">
                          {item.name}
                        </h3>
                        <p className="text-sm text-slate-500">
                          {item.wordCount && `${item.wordCount} words`}
                          {item.characterCount && ` • ${item.characterCount} characters`}
                          {' • '}
                          Generated {new Date(item.generatedAt).toLocaleDateString()} at{' '}
                          {new Date(item.generatedAt).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {/* Publish/Unpublish Button - For all content types */}
                        <button
                          onClick={() => handleTogglePublish(item.id!, item.published || false)}
                          disabled={deletingContentId === item.id}
                          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                            item.published
                              ? 'text-green-700 bg-green-50 hover:bg-green-100'
                              : 'text-slate-600 bg-slate-100 hover:bg-slate-200'
                          }`}
                        >
                          {item.published ? '✓ Published' : 'Publish'}
                        </button>

                        {/* PDF Download Button */}
                        {activeTab === 'pdf-onepager' && item.pdfData && (
                          <>
                            <button
                              onClick={() => downloadPDF(item.pdfData, item.name)}
                              disabled={downloadingPdf || deletingContentId === item.id}
                              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
                              disabled={downloadingPdf || deletingContentId === item.id}
                              className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Edit PDF Content
                            </button>
                            <button
                              onClick={() => handleDeleteContent(item.id!)}
                              disabled={deletingContentId === item.id || downloadingPdf}
                              className="px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {deletingContentId === item.id ? 'Deleting...' : 'Delete'}
                            </button>
                          </>
                        )}
                        {/* Regular Content Buttons */}
                        {activeTab !== 'pdf-onepager' && (
                          <>
                            <button
                              onClick={() => startEditingContent(item.id!, item.content)}
                              disabled={deletingContentId === item.id}
                              className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-700 hover:bg-slate-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => copyToClipboard(item.content)}
                              disabled={deletingContentId === item.id}
                              className="px-3 py-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Copy
                            </button>
                            <button
                              onClick={() => handleDeleteContent(item.id!)}
                              disabled={deletingContentId === item.id}
                              className="px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {deletingContentId === item.id ? 'Deleting...' : 'Delete'}
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
                            <div className="flex items-center justify-center h-96 bg-slate-50 rounded-lg">
                              <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                                <p className="text-slate-600">Generating PDF preview...</p>
                              </div>
                            </div>
                          ) : pdfPreviews[item.id!] ? (
                            <iframe
                              src={`${pdfPreviews[item.id!]}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                              className="w-full h-[600px] border border-slate-300 rounded-lg"
                              title={`${item.name} PDF Preview`}
                            />
                          ) : (
                            <div className="flex items-center justify-center h-96 bg-slate-50 rounded-lg">
                              <p className="text-slate-600">PDF preview not available</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Regular Content Display */
                        <div className="prose prose-sm max-w-none">
                          <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-lg">
                            {item.content}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
                <p className="text-slate-600">
                  No {activeContentType?.label.toLowerCase()} generated yet. Fill in the form above and click generate to get started.
                </p>
              </div>
            )}
          </div>
        </main>

        {/* PDF Edit Modal */}
        {editingPdfId && editedPdfData && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4">
                <h2 className="text-xl font-bold text-slate-900">Edit PDF Content</h2>
                <p className="text-sm text-slate-600 mt-1">
                  Edit your PDF content below. Character limits help maintain proper layout.
                </p>
              </div>

              {/* Modal Body */}
              <div className="px-6 py-4 space-y-6">
                {/* Headline */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Headline <span className="text-xs text-slate-500">({editedPdfData.headline?.length || 0}/60 characters)</span>
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
                    className={`w-full px-3 py-2 border rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      (editedPdfData.headline?.length || 0) > 55 ? 'border-yellow-500' : 'border-slate-300'
                    }`}
                    placeholder="Enter headline..."
                  />
                  {(editedPdfData.headline?.length || 0) > 55 && (
                    <p className="text-xs text-yellow-600 mt-1">Approaching character limit</p>
                  )}
                </div>

                {/* Subheadline */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Subheadline <span className="text-xs text-slate-500">({editedPdfData.subheadline?.length || 0}/120 characters)</span>
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
                    className={`w-full px-3 py-2 border rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      (editedPdfData.subheadline?.length || 0) > 110 ? 'border-yellow-500' : 'border-slate-300'
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
                    <h3 className="text-sm font-medium text-slate-700 mb-3">Stats</h3>
                    <div className="space-y-3">
                      {editedPdfData.stats.map((stat: any, idx: number) => (
                        <div key={idx} className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg">
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                              Value <span className="text-slate-500">({stat.value?.length || 0}/10)</span>
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
                              className="w-full px-2 py-1.5 border border-slate-300 rounded text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                              placeholder="e.g., 250+"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                              Label <span className="text-slate-500">({stat.label?.length || 0}/30)</span>
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
                              className="w-full px-2 py-1.5 border border-slate-300 rounded text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
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
                    <h3 className="text-sm font-medium text-slate-700 mb-3">Key Benefits</h3>
                    <div className="space-y-3">
                      {editedPdfData.keyBenefits.map((benefit: string, idx: number) => (
                        <div key={idx}>
                          <label className="block text-xs font-medium text-slate-600 mb-1">
                            Benefit {idx + 1} <span className="text-slate-500">({benefit?.length || 0}/150 characters)</span>
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
                            className={`w-full px-3 py-2 border rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm ${
                              (benefit?.length || 0) > 140 ? 'border-yellow-500' : 'border-slate-300'
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
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Call to Action <span className="text-xs text-slate-500">({editedPdfData.callToAction?.length || 0}/80 characters)</span>
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
                    className={`w-full px-3 py-2 border rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      (editedPdfData.callToAction?.length || 0) > 75 ? 'border-yellow-500' : 'border-slate-300'
                    }`}
                    placeholder="Enter call to action..."
                  />
                  {(editedPdfData.callToAction?.length || 0) > 75 && (
                    <p className="text-xs text-yellow-600 mt-1">Approaching character limit</p>
                  )}
                </div>

                {/* Contact Info */}
                <div>
                  <h3 className="text-sm font-medium text-slate-700 mb-3">Contact Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
                      <input
                        type="email"
                        value={editedPdfData.contactInfo?.email || ''}
                        onChange={(e) => updatePdfContact('email', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        placeholder="contact@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Phone</label>
                      <input
                        type="tel"
                        value={editedPdfData.contactInfo?.phone || ''}
                        onChange={(e) => updatePdfContact('phone', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4 flex justify-end gap-3">
                <button
                  onClick={cancelEditingPdf}
                  disabled={savingPdf}
                  className="px-4 py-2 bg-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-300 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => savePdfEdit(editingPdfId)}
                  disabled={savingPdf}
                  className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
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
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4">
                <h2 className="text-xl font-bold text-slate-900">Edit Content</h2>
                <p className="text-sm text-slate-600 mt-1">
                  Edit your {CONTENT_TYPES.find(ct => ct.value === activeTab)?.label.toLowerCase()} content below.
                  {activeTab === 'linkedin' && ' LinkedIn has a 1,300 character limit.'}
                  {activeTab === 'twitter' && ' Keep tweets under 280 characters each.'}
                </p>
              </div>

              {/* Modal Body */}
              <div className="px-6 py-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-slate-700">
                      Content
                    </label>
                    <span className="text-xs text-slate-500">
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
                    className={`w-full px-4 py-3 border rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm ${
                      activeTab === 'linkedin' && editedContent.length > 1300
                        ? 'border-red-500'
                        : editedContent.length > (activeTab === 'linkedin' ? 1200 : 10000)
                        ? 'border-yellow-500'
                        : 'border-slate-300'
                    }`}
                    placeholder="Enter your content..."
                  />
                  {activeTab === 'linkedin' && editedContent.length > 1200 && editedContent.length <= 1300 && (
                    <p className="text-xs text-yellow-600 mt-2">Approaching LinkedIn character limit</p>
                  )}
                  {activeTab === 'blog' && (
                    <p className="text-xs text-slate-500 mt-2">
                      Recommended: 800-1,200 words for SEO-optimized blog posts
                    </p>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4 flex justify-end gap-3">
                <button
                  onClick={cancelEditingContent}
                  disabled={savingContent}
                  className="px-4 py-2 bg-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-300 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => saveContentEdit(editingContentId)}
                  disabled={savingContent || (activeTab === 'linkedin' && editedContent.length > 1300)}
                  className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
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
    </ProtectedRoute>
  );
}
