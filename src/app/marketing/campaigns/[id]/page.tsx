'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { fetchCampaign, saveGeneratedContent, updateGeneratedContent, deleteGeneratedContent } from '@/utils/campaignUtils';
import { Campaign, ContentType, GeneratedContent, PDFTemplate } from '@/types';

const CONTENT_TYPES: { value: ContentType; label: string; description: string }[] = [
  { value: 'blog', label: 'Blog Post', description: '800-1200 words, SEO-optimized' },
  { value: 'linkedin', label: 'LinkedIn Post', description: 'Professional, 1300 char max' },
  { value: 'twitter', label: 'Twitter Thread', description: '5-7 tweets, engaging' },
  { value: 'email', label: 'Email Copy', description: 'Subject + body, conversion-focused' },
  { value: 'ad-copy', label: 'Ad Copy', description: 'Headline + description + CTA' },
  { value: 'pdf-onepager', label: 'PDF One-Pager', description: 'Professional one-page PDF with design' },
];

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<ContentType>('blog');
  const [contentName, setContentName] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<PDFTemplate>('modern-minimal');

  // Editing state
  const [editingContentId, setEditingContentId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [editedName, setEditedName] = useState('');
  const [refinementNotes, setRefinementNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [refining, setRefining] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [deletingContentId, setDeletingContentId] = useState<string | null>(null);
  const [editingPdfId, setEditingPdfId] = useState<string | null>(null);
  const [editedPdfData, setEditedPdfData] = useState<any>(null);
  const [savingPdf, setSavingPdf] = useState(false);

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

  const handleGenerateContent = async () => {
    if (!campaign || !user) return;

    setGenerating(true);

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
          contentType: activeTab,
          notes: notes.trim() || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate content');
      }

      const { content, wordCount, characterCount, pdfData } = await response.json();

      // If PDF, add the selected template to the data
      const finalPdfData = pdfData ? { ...pdfData, template: selectedTemplate } : undefined;

      const newContent: GeneratedContent = {
        type: activeTab,
        name: contentName.trim() || undefined,
        content,
        wordCount,
        characterCount,
        generatedAt: new Date(),
        pdfData: finalPdfData, // Include PDF data with template if present
      };

      // Save to Firestore
      await saveGeneratedContent(campaign.id!, newContent);

      // Reload campaign to get updated content
      await loadCampaign();

      // Clear form fields after successful generation
      setContentName('');
      setNotes('');
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

  const startEditing = (contentId: string, content: string, name?: string) => {
    setEditingContentId(contentId);
    setEditedContent(content);
    setEditedName(name || '');
    setRefinementNotes('');
  };

  const cancelEditing = () => {
    setEditingContentId(null);
    setEditedContent('');
    setEditedName('');
    setRefinementNotes('');
  };

  const saveEdit = async (contentId: string) => {
    if (!campaign) return;

    setSaving(true);
    try {
      await updateGeneratedContent(campaign.id!, contentId, editedContent, editedName);
      await loadCampaign();
      setEditingContentId(null);
      setEditedContent('');
      setEditedName('');
      setRefinementNotes('');
    } catch (error) {
      console.error('Error saving edit:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const refineWithAI = async () => {
    if (!campaign || !editingContentId || !refinementNotes.trim()) return;

    setRefining(true);
    try {
      const response = await fetch('/api/refine-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalContent: editedContent,
          refinementNotes: refinementNotes.trim(),
          contentType: activeContentType?.label,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to refine content');
      }

      const { content: refinedContent } = await response.json();

      // Update the textarea with refined content (don't save yet)
      setEditedContent(refinedContent);
      setRefinementNotes('');
    } catch (error) {
      console.error('Error refining content:', error);
      alert('Failed to refine content. Please try again.');
    } finally {
      setRefining(false);
    }
  };

  const downloadPDF = async (pdfData: any, contentName?: string) => {
    if (!campaign) return;

    setDownloadingPdf(true);
    try {
      const response = await fetch('/api/render-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfData,
          brandProfile: campaign.brandProfile,
          logoUrl: campaign.logoUrl,
          clientName: campaign.clientName,
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
        : `${campaign.clientName.replace(/[^a-z0-9]/gi, '_')}_OnePager.pdf`;

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
    if (!campaign) return;

    // Confirm deletion
    const confirmed = window.confirm('Are you sure you want to delete this content? This action cannot be undone.');
    if (!confirmed) return;

    setDeletingContentId(contentId);
    try {
      await deleteGeneratedContent(campaign.id!, contentId);
      await loadCampaign();
    } catch (error) {
      console.error('Error deleting content:', error);
      alert('Failed to delete content. Please try again.');
    } finally {
      setDeletingContentId(null);
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
    if (!campaign || !editedPdfData) return;

    setSavingPdf(true);
    try {
      // Debug: Log auth state
      console.log('Current user:', user?.uid);
      console.log('Campaign userId:', campaign.userId);
      console.log('Match:', user?.uid === campaign.userId);

      // Update the content with the new PDF data
      const content = campaign.contents.find(c => c.id === contentId);
      if (!content) throw new Error('Content not found');

      await updateGeneratedContent(
        campaign.id!,
        contentId,
        content.content,
        content.name,
        editedPdfData
      );

      await loadCampaign();
      setEditingPdfId(null);
      setEditedPdfData(null);
    } catch (error) {
      console.error('Error saving PDF edit:', error);
      console.error('Full error:', error);
      alert('Failed to save PDF changes. Please try again.');
    } finally {
      setSavingPdf(false);
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

  // Filter content by active tab and sort by newest first
  const filteredContent = campaign.contents
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
              onClick={() => router.push('/marketing/campaigns')}
              className="text-sm text-slate-600 hover:text-slate-900 mb-4 flex items-center gap-1"
            >
              ← Back to Campaigns
            </button>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">{campaign.clientName}</h1>
            <p className="text-slate-600">{campaign.industry} • {campaign.topic}</p>
          </div>

          {/* Tabs */}
          <div className="bg-white border border-slate-200 rounded-lg mb-6">
            <div className="border-b border-slate-200 overflow-x-auto">
              <nav className="flex -mb-px">
                {CONTENT_TYPES.map(({ value, label }) => {
                  const count = campaign.contents.filter((c) => c.type === value).length;
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

            {/* Tab Content */}
            <div className="p-6">
              {/* Description */}
              <div className="mb-6">
                <p className="text-sm text-slate-600">{activeContentType?.description}</p>
              </div>

              {/* Content Name Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Content Name <span className="text-slate-500 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={contentName}
                  onChange={(e) => setContentName(e.target.value)}
                  placeholder={`e.g., "Summer Campaign ${activeContentType?.label}" or "Q4 Launch Material"`}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  disabled={generating}
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

              {/* Notes Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Content Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add specific themes, angles, or requirements for this content..."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  disabled={generating}
                />
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerateContent}
                disabled={generating}
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
            </div>
          </div>

          {/* Content History */}
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              {activeContentType?.label} History ({filteredContent.length})
            </h2>

            {filteredContent.length > 0 ? (
              <div className="space-y-4">
                {filteredContent.map((item, index) => {
                  const isEditing = editingContentId === item.id;

                  return (
                    <div key={item.id || index} className="bg-white border border-slate-200 rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          {item.name && (
                            <h3 className="text-lg font-semibold text-slate-900 mb-1">
                              {item.name}
                            </h3>
                          )}
                          <p className="text-sm text-slate-500">
                            {item.wordCount && `${item.wordCount} words`}
                            {item.characterCount && ` • ${item.characterCount} characters`}
                            {' • '}
                            Generated {new Date(item.generatedAt).toLocaleDateString()} at{' '}
                            {new Date(item.generatedAt).toLocaleTimeString()}
                          </p>
                        </div>
                        {!isEditing && (
                          <div className="flex gap-2">
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
                                  onClick={() => startEditing(item.id!, item.content, item.name)}
                                  disabled={deletingContentId === item.id}
                                  className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                        )}
                      </div>

                      {isEditing ? (
                        /* Editing Mode */
                        <div>
                          {/* Name Input */}
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Content Name <span className="text-slate-500 font-normal">(Optional)</span>
                            </label>
                            <input
                              type="text"
                              value={editedName}
                              onChange={(e) => setEditedName(e.target.value)}
                              placeholder="Give this content a name..."
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              disabled={saving || refining}
                            />
                          </div>

                          {/* AI Refinement Section */}
                          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4">
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              AI Refinement (Optional)
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={refinementNotes}
                                onChange={(e) => setRefinementNotes(e.target.value)}
                                placeholder="E.g., 'Make it more casual', 'Add statistics', 'Shorten by 30%'..."
                                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                disabled={refining || saving}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && refinementNotes.trim()) {
                                    refineWithAI();
                                  }
                                }}
                              />
                              <button
                                onClick={refineWithAI}
                                disabled={refining || saving || !refinementNotes.trim()}
                                className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 whitespace-nowrap"
                              >
                                {refining && (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                )}
                                {refining ? 'Refining...' : 'Refine'}
                              </button>
                            </div>
                            <p className="text-xs text-slate-500 mt-2">
                              Use AI to revise the content below, or edit manually
                            </p>
                          </div>

                          {/* Manual Edit Textarea */}
                          <textarea
                            value={editedContent}
                            onChange={(e) => setEditedContent(e.target.value)}
                            rows={15}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent mb-3"
                            disabled={saving || refining}
                          />

                          {/* Action Buttons */}
                          <div className="flex gap-2">
                            <button
                              onClick={() => saveEdit(item.id!)}
                              disabled={saving || refining}
                              className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button
                              onClick={cancelEditing}
                              disabled={saving || refining}
                              className="px-4 py-2 bg-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-300 disabled:opacity-50 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Display Mode */
                        <div>
                          {activeTab === 'pdf-onepager' && item.pdfData ? (
                            /* PDF Preview */
                            <div className="space-y-4">
                              {/* Template Badge */}
                              {item.pdfData.template && (
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-xs font-medium text-slate-500">Template:</span>
                                  <span className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-700 rounded">
                                    {item.pdfData.template === 'modern-minimal' && 'Modern Minimal'}
                                    {item.pdfData.template === 'bold-impact' && 'Bold Impact'}
                                    {item.pdfData.template === 'corporate-professional' && 'Corporate Professional'}
                                    {item.pdfData.template === 'creative-geometric' && 'Creative Geometric'}
                                  </span>
                                </div>
                              )}
                              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-lg">
                                <h3 className="text-xl font-bold text-slate-900 mb-2">
                                  {item.pdfData.headline}
                                </h3>
                                <p className="text-slate-600">{item.pdfData.subheadline}</p>
                              </div>

                              {item.pdfData.stats && item.pdfData.stats.length > 0 && (
                                <div className="grid grid-cols-3 gap-4">
                                  {item.pdfData.stats.map((stat, idx) => (
                                    <div key={idx} className="bg-slate-50 p-4 rounded-lg text-center">
                                      <div className="text-2xl font-bold text-indigo-600">
                                        {stat.value}
                                      </div>
                                      <div className="text-xs text-slate-600 uppercase mt-1">
                                        {stat.label}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              <div>
                                <h4 className="font-semibold text-slate-900 mb-3">Key Benefits</h4>
                                <ul className="space-y-2">
                                  {item.pdfData.keyBenefits.map((benefit, idx) => (
                                    <li key={idx} className="flex items-start">
                                      <span className="inline-block w-2 h-2 bg-indigo-600 rounded-full mt-2 mr-3"></span>
                                      <span className="text-slate-700">{benefit}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              <div className="bg-indigo-600 p-4 rounded-lg text-white">
                                <p className="font-semibold mb-2">{item.pdfData.callToAction}</p>
                                <div className="text-sm opacity-90 space-y-1">
                                  {item.pdfData.contactInfo.email && (
                                    <p>{item.pdfData.contactInfo.email}</p>
                                  )}
                                  {item.pdfData.contactInfo.phone && (
                                    <p>{item.pdfData.contactInfo.phone}</p>
                                  )}
                                  {item.pdfData.contactInfo.website && (
                                    <p>{item.pdfData.contactInfo.website}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ) : (
                            /* Regular Content Display */
                            <div className="prose prose-sm max-w-none">
                              <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700 leading-relaxed">
                                {item.content}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
                <p className="text-slate-600">
                  No {activeContentType?.label.toLowerCase()} generated yet. Add notes above and click generate to get started.
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
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Website</label>
                      <input
                        type="url"
                        value={editedPdfData.contactInfo?.website || ''}
                        onChange={(e) => updatePdfContact('website', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        placeholder="www.example.com"
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
      </div>
    </ProtectedRoute>
  );
}
