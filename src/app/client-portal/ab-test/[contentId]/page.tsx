'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Client, GeneratedContent } from '@/types';
import ClientPortalNav from '@/components/ClientPortalNav';

export default function ABTestPage() {
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [originalContent, setOriginalContent] = useState<GeneratedContent | null>(null);
  const [variantContent, setVariantContent] = useState<GeneratedContent | null>(null);
  const [generatingVariant, setGeneratingVariant] = useState(false);
  const [originalPdfUrl, setOriginalPdfUrl] = useState<string | null>(null);
  const [variantPdfUrl, setVariantPdfUrl] = useState<string | null>(null);
  const [loadingOriginalPdf, setLoadingOriginalPdf] = useState(false);
  const [loadingVariantPdf, setLoadingVariantPdf] = useState(false);
  const [editingPdfId, setEditingPdfId] = useState<string | null>(null);
  const [editedPdfData, setEditedPdfData] = useState<any>(null);
  const [savingPdf, setSavingPdf] = useState(false);
  const [publicVoteId, setPublicVoteId] = useState<string | null>(null);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [showLinkCopied, setShowLinkCopied] = useState(false);
  const router = useRouter();
  const params = useParams();
  const contentId = params.contentId as string;

  const generatePdfPreview = async (pdfData: any, clientData: Client, type: 'original' | 'variant') => {
    if (type === 'original') {
      setLoadingOriginalPdf(true);
    } else {
      setLoadingVariantPdf(true);
    }

    try {
      const response = await fetch('/api/render-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfData,
          brandProfile: clientData.brandProfile,
          logoUrl: clientData.logoUrl,
          clientName: clientData.company,
        }),
      });

      if (!response.ok) throw new Error('Failed to render PDF');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      if (type === 'original') {
        setOriginalPdfUrl(url);
      } else {
        setVariantPdfUrl(url);
      }
    } catch (error) {
      console.error('Error generating PDF preview:', error);
      alert('Failed to generate PDF preview. Please try again.');
    } finally {
      if (type === 'original') {
        setLoadingOriginalPdf(false);
      } else {
        setLoadingVariantPdf(false);
      }
    }
  };

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

        // Find the original content
        const content = clientData.marketingContent?.find(c => c.id === contentId);
        if (content) {
          setOriginalContent(content);

          // Set public vote ID if it exists
          if (content.publicVoteId) {
            setPublicVoteId(content.publicVoteId);
          }

          // If it's a PDF, generate the preview
          if (content.type === 'pdf-onepager' && content.pdfData) {
            generatePdfPreview(content.pdfData, clientData, 'original');
          }

          // Check if there's already a variant for this content
          const existingVariant = clientData.marketingContent?.find(
            c => c.variantOfId === contentId && c.published
          );
          if (existingVariant) {
            setVariantContent(existingVariant);
            // Generate PDF preview for existing variant if needed
            if (existingVariant.type === 'pdf-onepager' && existingVariant.pdfData) {
              generatePdfPreview(existingVariant.pdfData, clientData, 'variant');
            }
          }
        } else {
          alert('Content not found');
          router.push('/client-portal/marketing');
        }
      } catch (error) {
        console.error('Error fetching client profile:', error);
        alert('Failed to load your profile');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router, contentId]);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      if (originalPdfUrl) {
        window.URL.revokeObjectURL(originalPdfUrl);
      }
      if (variantPdfUrl) {
        window.URL.revokeObjectURL(variantPdfUrl);
      }
    };
  }, [originalPdfUrl, variantPdfUrl]);

  const generateVariant = async (regenerate: boolean = false) => {
    if (!client || !originalContent) return;

    // Check if voting exists and warn user about reset
    if (regenerate && publicVoteId && ((originalContent.votes || 0) + (variantContent?.votes || 0) > 0)) {
      const totalVotes = (originalContent.votes || 0) + (variantContent?.votes || 0);
      const confirmReset = window.confirm(
        `⚠️ Warning: Regenerating the variant will reset all voting data.\n\n` +
        `You currently have ${totalVotes} vote${totalVotes === 1 ? '' : 's'}.\n\n` +
        `Are you sure you want to regenerate and lose this voting data?`
      );

      if (!confirmReset) {
        return; // User cancelled
      }
    }

    setGeneratingVariant(true);

    try {
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

      if (!response.ok) throw new Error('Failed to generate variant');

      const result = await response.json();

      // Create new variant content
      // Clean the original name by removing any existing variant suffix
      const cleanOriginalName = originalContent.name.replace(/\s*-\s*Variant\s+[A-Z]$/i, '');

      const newVariant: GeneratedContent = {
        id: variantContent?.id || `variant_${Date.now()}`, // Keep existing ID if regenerating
        name: `${cleanOriginalName} - Variant B`,
        type: originalContent.type,
        content: result.content,
        wordCount: result.wordCount,
        characterCount: result.characterCount,
        generatedAt: new Date(),
        pdfData: result.pdfData,
        published: true,
        variantOfId: originalContent.id,
        variantLabel: 'Variant B',
        // Reset voting data when regenerating
        publicVoteId: undefined,
        votes: 0,
      };

      // Update or add variant in database
      let updatedContent = client.marketingContent || [];

      if (regenerate && variantContent) {
        // Replace existing variant and reset voting on original too
        updatedContent = updatedContent.map(c => {
          if (c.id === variantContent.id) {
            return newVariant;
          }
          // Reset voting data on original when regenerating variant
          if (c.id === originalContent.id && publicVoteId) {
            return {
              ...c,
              publicVoteId: undefined,
              votes: 0,
            };
          }
          return c;
        });
        // Reset local state
        setPublicVoteId(null);
      } else {
        // Add "Original" label to the original content if it doesn't have one
        updatedContent = updatedContent.map(c => {
          if (c.id === originalContent.id && !c.variantLabel) {
            return { ...c, variantLabel: 'Original' };
          }
          return c;
        });
        // Add new variant
        updatedContent.push(newVariant);
      }

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

      // Update local state
      setVariantContent(newVariant);

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

      // If it's a PDF, generate the preview
      if (result.pdfData && client) {
        generatePdfPreview(result.pdfData, client, 'variant');
      }

      alert(regenerate ? 'Variant B regenerated successfully!' : 'Variant B generated and saved!');
    } catch (error) {
      console.error('Error generating variant:', error);
      alert('Failed to generate variant. Please try again.');
    } finally {
      setGeneratingVariant(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    alert(`${label} copied to clipboard!`);
  };

  const downloadPDF = async (pdfData: any, contentName: string) => {
    if (!client) return;

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
      const a = document.createElement('a');
      const filename = `${contentName.replace(/[^a-z0-9]/gi, '_')}.pdf`;
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF. Please try again.');
    }
  };

  const startEditingPdf = (pdfContentId: string, pdfData: any) => {
    setEditingPdfId(pdfContentId);
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

  const savePdfEdit = async (pdfContentId: string) => {
    if (!client || !editedPdfData) return;

    setSavingPdf(true);
    try {
      // Find the content item and update it
      const updatedContent = (client.marketingContent || []).map(c =>
        c.id === pdfContentId ? { ...c, pdfData: editedPdfData } : c
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

        // Update local state
        if (pdfContentId === originalContent?.id) {
          setOriginalContent({ ...originalContent, pdfData: editedPdfData });
          // Regenerate original PDF preview
          generatePdfPreview(editedPdfData, clientData, 'original');
        } else if (pdfContentId === variantContent?.id) {
          setVariantContent({ ...variantContent, pdfData: editedPdfData });
          // Regenerate variant PDF preview
          generatePdfPreview(editedPdfData, clientData, 'variant');
        }
      }

      setEditingPdfId(null);
      setEditedPdfData(null);
      alert('PDF changes saved successfully!');
    } catch (error) {
      console.error('Error saving PDF edit:', error);
      alert('Failed to save PDF changes. Please try again.');
    } finally {
      setSavingPdf(false);
    }
  };

  const generatePublicVoteLink = async () => {
    if (!client || !originalContent || !variantContent) {
      alert('You need both an original and a variant to generate a voting link.');
      return;
    }

    setGeneratingLink(true);

    try {
      const response = await fetch('/api/generate-vote-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: client.id,
          originalContentId: originalContent.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate vote link');
      }

      const result = await response.json();
      setPublicVoteId(result.publicVoteId);

      // Copy to clipboard
      const voteUrl = `${window.location.origin}/vote/${result.publicVoteId}`;
      await navigator.clipboard.writeText(voteUrl);
      setShowLinkCopied(true);
      setTimeout(() => setShowLinkCopied(false), 3000);

      // Reload client data to get updated content
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

        // Update original and variant content with new vote counts
        const updatedOriginal = clientData.marketingContent?.find(c => c.id === originalContent.id);
        const updatedVariant = clientData.marketingContent?.find(c => c.id === variantContent.id);
        if (updatedOriginal) setOriginalContent(updatedOriginal);
        if (updatedVariant) setVariantContent(updatedVariant);
      }
    } catch (error) {
      console.error('Error generating vote link:', error);
      alert(error instanceof Error ? error.message : 'Failed to generate vote link');
    } finally {
      setGeneratingLink(false);
    }
  };

  const copyVoteLink = async () => {
    if (!publicVoteId) return;
    const voteUrl = `${window.location.origin}/vote/${publicVoteId}`;
    await navigator.clipboard.writeText(voteUrl);
    setShowLinkCopied(true);
    setTimeout(() => setShowLinkCopied(false), 3000);
  };

  const promoteVariantToOriginal = async () => {
    if (!client || !originalContent || !variantContent) return;

    // Warn if voting data exists
    if (publicVoteId && ((originalContent.votes || 0) + (variantContent.votes || 0) > 0)) {
      const totalVotes = (originalContent.votes || 0) + (variantContent.votes || 0);
      const confirmPromote = window.confirm(
        `⚠️ Warning: Making the variant the new original will reset all voting data.\n\n` +
        `You currently have ${totalVotes} vote${totalVotes === 1 ? '' : 's'}.\n\n` +
        `The current variant will become the new original, and the old original will become a variant.\n\n` +
        `Are you sure you want to continue?`
      );

      if (!confirmPromote) {
        return; // User cancelled
      }
    } else {
      const confirmPromote = window.confirm(
        `Are you sure you want to make this variant the new original?\n\n` +
        `The current variant will become the new original, and the old original will become a variant.`
      );

      if (!confirmPromote) {
        return;
      }
    }

    setGeneratingVariant(true);

    try {
      let updatedContent = client.marketingContent || [];

      // Swap the original and variant
      updatedContent = updatedContent.map(c => {
        if (c.id === originalContent.id) {
          // Old original becomes a variant
          // Clean any existing variant suffix first, then add " - Variant A"
          const cleanName = c.name.replace(/\s*-\s*Variant\s+[A-Z]$/i, '');
          const newName = `${cleanName} - Variant A`;

          return {
            ...c,
            name: newName,
            variantOfId: variantContent.id,
            variantLabel: 'Variant A',
            publicVoteId: undefined,
            votes: 0,
          };
        }
        if (c.id === variantContent.id) {
          // Old variant becomes the new original
          // Remove variant suffix from name (e.g., " - Variant B")
          const cleanName = c.name.replace(/\s*-\s*Variant\s+[A-Z]$/i, '');

          return {
            ...c,
            name: cleanName,
            variantOfId: undefined,
            variantLabel: 'Original',
            publicVoteId: undefined,
            votes: 0,
          };
        }
        return c;
      });

      // Save to database
      const response = await fetch('/api/clients', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: client.id,
          marketingContent: updatedContent,
        }),
      });

      if (!response.ok) throw new Error('Failed to promote variant');

      // Reload client data and redirect to the new original's A/B test page
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

      // Reset voting state
      setPublicVoteId(null);

      // Redirect to the new original's A/B test page
      alert('✅ Variant successfully promoted to original!');
      router.push(`/client-portal/ab-test/${variantContent.id}`);
    } catch (error) {
      console.error('Error promoting variant:', error);
      alert('Failed to promote variant. Please try again.');
    } finally {
      setGeneratingVariant(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <ClientPortalNav />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white border border-slate-200 rounded-lg p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mr-3"></div>
              <p className="text-slate-700">Loading A/B test...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!client || !originalContent) return null;

  const renderContent = (item: GeneratedContent, label: string, pdfUrl: string | null, loadingPdf: boolean) => {
    const isPDF = item.type === 'pdf-onepager' && item.pdfData;

    return (
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold text-slate-900">{item.name}</h3>
              <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                label === 'Original'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-purple-100 text-purple-700'
              }`}>
                {label}
              </span>
            </div>
            <p className="text-sm text-slate-500">
              {item.wordCount && `${item.wordCount} words`}
              {item.characterCount && ` • ${item.characterCount} characters`}
            </p>
          </div>
          <div className="flex gap-2">
            {isPDF && item.pdfData ? (
              <>
                <button
                  onClick={() => downloadPDF(item.pdfData, `${item.name}_${label}`)}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors"
                >
                  Download PDF
                </button>
                <button
                  onClick={() => startEditingPdf(item.id!, item.pdfData)}
                  className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors"
                >
                  Edit PDF Content
                </button>
              </>
            ) : (
              <button
                onClick={() => copyToClipboard(item.content, label)}
                className="px-3 py-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-md transition-colors"
              >
                Copy
              </button>
            )}
          </div>
        </div>

        {/* Content Display */}
        <div>
          {isPDF && item.pdfData ? (
            /* PDF Preview as iframe */
            <div className="w-full">
              {loadingPdf ? (
                <div className="flex items-center justify-center h-96 bg-slate-50 rounded-lg">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-slate-600">Generating PDF preview...</p>
                  </div>
                </div>
              ) : pdfUrl ? (
                <iframe
                  src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                  className="w-full h-[600px] border border-slate-300 rounded-lg"
                  title={`${label} PDF Preview`}
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
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <ClientPortalNav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/client-portal/marketing')}
            className="text-indigo-600 hover:text-indigo-700 mb-4 flex items-center gap-1"
          >
            ← Back to Marketing Content
          </button>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">A/B Test Comparison</h1>
          <p className="text-slate-600">
            Compare different versions of your content to find what resonates best
          </p>
        </div>

        {/* Generate/Regenerate Variant Button */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {variantContent ? '🔄 Regenerate Test Variant' : '🔬 Generate a Test Variant'}
              </h3>
              <p className="text-slate-600 text-sm mb-4">
                {variantContent
                  ? "Don't like the current variant? Generate a new one with different angles and messaging."
                  : "Create an alternative version of this content with different headlines, CTAs, and messaging to test what performs better."
                }
              </p>
            </div>
            <button
              onClick={() => generateVariant(!!variantContent)}
              disabled={generatingVariant}
              className="px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {generatingVariant ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {variantContent ? 'Regenerating...' : 'Generating...'}
                </>
              ) : (
                variantContent ? 'Regenerate Variant' : 'Generate Variant'
              )}
            </button>
          </div>
        </div>

        {/* Public Voting Link Section */}
        {variantContent && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  🔗 Share for Public Voting
                </h3>
                <p className="text-slate-600 text-sm mb-3">
                  {publicVoteId
                    ? 'Share this link with others to get their feedback on which version performs better.'
                    : 'Generate a public link to share with others and collect votes on which version they prefer.'
                  }
                </p>
                {publicVoteId && (
                  <div className="bg-white border border-slate-300 rounded-lg p-3 mb-3">
                    <div className="flex items-center justify-between">
                      <code className="text-sm text-slate-700 break-all flex-1 mr-3">
                        {`${window.location.origin}/vote/${publicVoteId}`}
                      </code>
                      <button
                        onClick={copyVoteLink}
                        className="px-3 py-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-md transition-colors whitespace-nowrap"
                      >
                        {showLinkCopied ? '✓ Copied!' : 'Copy Link'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {!publicVoteId && (
                <button
                  onClick={generatePublicVoteLink}
                  disabled={generatingLink}
                  className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 ml-4"
                >
                  {generatingLink ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <span>🔗</span>
                      Generate Share Link
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Vote Results */}
        {variantContent && publicVoteId && (originalContent.votes || 0) + (variantContent.votes || 0) > 0 && (
          <div className="bg-white border border-slate-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">📊 Voting Results</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-700">
                      {originalContent.variantLabel || 'Original'}
                    </span>
                    <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                      {originalContent.votes || 0} {(originalContent.votes || 0) === 1 ? 'vote' : 'votes'}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">
                    {((originalContent.votes || 0) + (variantContent.votes || 0)) > 0
                      ? Math.round(((originalContent.votes || 0) / ((originalContent.votes || 0) + (variantContent.votes || 0))) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                    style={{
                      width: `${((originalContent.votes || 0) + (variantContent.votes || 0)) > 0
                        ? Math.round(((originalContent.votes || 0) / ((originalContent.votes || 0) + (variantContent.votes || 0))) * 100)
                        : 0}%`
                    }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-700">
                      {variantContent.variantLabel || 'Variant'}
                    </span>
                    <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded">
                      {variantContent.votes || 0} {(variantContent.votes || 0) === 1 ? 'vote' : 'votes'}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">
                    {((originalContent.votes || 0) + (variantContent.votes || 0)) > 0
                      ? Math.round(((variantContent.votes || 0) / ((originalContent.votes || 0) + (variantContent.votes || 0))) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div
                    className="bg-purple-600 h-3 rounded-full transition-all duration-500"
                    style={{
                      width: `${((originalContent.votes || 0) + (variantContent.votes || 0)) > 0
                        ? Math.round(((variantContent.votes || 0) / ((originalContent.votes || 0) + (variantContent.votes || 0))) * 100)
                        : 0}%`
                    }}
                  ></div>
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-4 text-center">
              Total votes: {(originalContent.votes || 0) + (variantContent.votes || 0)}
            </p>
          </div>
        )}

        {/* Side-by-Side Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Original Version */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Version A (Original)</h2>
            {renderContent(originalContent, 'Original', originalPdfUrl, loadingOriginalPdf)}
          </div>

          {/* Variant Version */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900">Version B (Variant)</h2>
              {variantContent && (
                <button
                  onClick={promoteVariantToOriginal}
                  disabled={generatingVariant}
                  className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  title="Make this variant the new original"
                >
                  <span>⭐</span>
                  Make This Original
                </button>
              )}
            </div>
            {variantContent ? (
              renderContent(variantContent, 'Variant B', variantPdfUrl, loadingVariantPdf)
            ) : (
              <div className="bg-white border-2 border-dashed border-slate-300 rounded-lg p-12 text-center min-h-[400px] flex flex-col items-center justify-center">
                <div className="text-6xl mb-4">🔬</div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  No Variant Yet
                </h3>
                <p className="text-slate-600 max-w-sm">
                  Click the "Generate Variant" button above to create an alternative version for testing
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Tips Section */}
        {variantContent && (
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-3">
              💡 A/B Testing Tips
            </h3>
            <ul className="space-y-2 text-sm text-slate-700">
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span><strong>Track results:</strong> Use these variants in different campaigns and measure which performs better</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span><strong>Test one element:</strong> The variant changes headlines, CTAs, and structure - focus on overall performance</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span><strong>Give it time:</strong> Run tests for at least a week to get meaningful results</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span><strong>Don't like this variant?</strong> Generate a new one by clicking the button again</span>
              </li>
            </ul>
          </div>
        )}
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
    </div>
  );
}
