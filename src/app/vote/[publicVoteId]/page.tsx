'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ContentType } from '@/types';

interface VoteContent {
  id: string;
  name: string;
  type: ContentType;
  content: string;
  pdfData?: any;
  votes: number;
  variantLabel: string;
}

interface VoteData {
  hasVoted: boolean;
  originalContent: VoteContent;
  variantContent: VoteContent;
  clientName: string;
}

export default function PublicVotePage() {
  const [loading, setLoading] = useState(true);
  const [voteData, setVoteData] = useState<VoteData | null>(null);
  const [voting, setVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfPreviews, setPdfPreviews] = useState<{ original: string | null; variant: string | null }>({
    original: null,
    variant: null,
  });
  const [loadingPdfs, setLoadingPdfs] = useState({ original: false, variant: false });
  const params = useParams();
  const publicVoteId = params.publicVoteId as string;

  useEffect(() => {
    fetchVoteData();
  }, [publicVoteId]);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      if (pdfPreviews.original) window.URL.revokeObjectURL(pdfPreviews.original);
      if (pdfPreviews.variant) window.URL.revokeObjectURL(pdfPreviews.variant);
    };
  }, [pdfPreviews]);

  const fetchVoteData = async () => {
    try {
      const response = await fetch(`/api/record-vote?publicVoteId=${publicVoteId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch voting data');
      }

      const data: VoteData = await response.json();
      setVoteData(data);
      setHasVoted(data.hasVoted);

      // Generate PDF previews if needed
      if (data.originalContent.type === 'pdf-onepager' && data.originalContent.pdfData) {
        generatePdfPreview(data.originalContent.pdfData, data.clientName, 'original');
      }
      if (data.variantContent.type === 'pdf-onepager' && data.variantContent.pdfData) {
        generatePdfPreview(data.variantContent.pdfData, data.clientName, 'variant');
      }
    } catch (err) {
      console.error('Error fetching vote data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load voting data');
    } finally {
      setLoading(false);
    }
  };

  const generatePdfPreview = async (pdfData: any, clientName: string, type: 'original' | 'variant') => {
    setLoadingPdfs(prev => ({ ...prev, [type]: true }));

    try {
      const response = await fetch('/api/render-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfData,
          clientName,
        }),
      });

      if (!response.ok) throw new Error('Failed to render PDF');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      setPdfPreviews(prev => ({ ...prev, [type]: url }));
    } catch (error) {
      console.error('Error generating PDF preview:', error);
    } finally {
      setLoadingPdfs(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleVote = async (selectedContentId: string) => {
    if (!voteData || hasVoted) return;

    setVoting(true);

    try {
      const response = await fetch('/api/record-vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publicVoteId,
          selectedContentId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to record vote');
      }

      const result = await response.json();

      // Update local state with new vote counts
      setVoteData({
        ...voteData,
        originalContent: {
          ...voteData.originalContent,
          votes: result.originalVotes,
        },
        variantContent: {
          ...voteData.variantContent,
          votes: result.variantVotes,
        },
      });
      setHasVoted(true);
    } catch (err) {
      console.error('Error recording vote:', err);
      alert(err instanceof Error ? err.message : 'Failed to record vote');
    } finally {
      setVoting(false);
    }
  };

  const renderContent = (content: VoteContent, type: 'original' | 'variant') => {
    const isPDF = content.type === 'pdf-onepager' && content.pdfData;
    const pdfUrl = type === 'original' ? pdfPreviews.original : pdfPreviews.variant;
    const loadingPdf = type === 'original' ? loadingPdfs.original : loadingPdfs.variant;

    return (
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        {/* Header with vote button/results */}
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-semibold text-slate-900">{content.variantLabel}</h3>
              <p className="text-xs text-slate-500">{content.name}</p>
            </div>
            {!hasVoted ? (
              <button
                onClick={() => handleVote(content.id)}
                disabled={voting}
                className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                {voting ? 'Voting...' : 'Vote for This'}
              </button>
            ) : (
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">{content.votes}</div>
                <div className="text-xs text-slate-500">
                  {content.votes === 1 ? 'vote' : 'votes'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content Display */}
        <div className="p-4">
          {isPDF ? (
            <div className="w-full">
              {loadingPdf ? (
                <div className="flex items-center justify-center h-96 bg-slate-50 rounded-lg">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading preview...</p>
                  </div>
                </div>
              ) : pdfUrl ? (
                <iframe
                  src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                  className="w-full h-[600px] border border-slate-300 rounded-lg"
                  title={`${content.variantLabel} PDF Preview`}
                />
              ) : (
                <div className="flex items-center justify-center h-96 bg-slate-50 rounded-lg">
                  <p className="text-slate-600">PDF preview not available</p>
                </div>
              )}
            </div>
          ) : (
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-lg">
                {content.content}
              </pre>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-700">Loading voting session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white border border-red-200 rounded-lg p-8 max-w-md text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Voting Session Not Found</h2>
          <p className="text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!voteData) return null;

  const totalVotes = voteData.originalContent.votes + voteData.variantContent.votes;
  const originalPercentage = totalVotes > 0
    ? Math.round((voteData.originalContent.votes / totalVotes) * 100)
    : 0;
  const variantPercentage = totalVotes > 0
    ? Math.round((voteData.variantContent.votes / totalVotes) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">
            A/B Test: Help Us Choose!
          </h1>
          <p className="text-slate-600">
            {voteData.clientName} is testing different versions. Which do you prefer?
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Instructions */}
        {!hasVoted && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-900 font-medium">
              📊 Please review both versions below and vote for the one you think is better!
            </p>
          </div>
        )}

        {/* Thank you message after voting */}
        {hasVoted && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="text-2xl">✅</div>
              <div className="flex-1">
                <h3 className="font-semibold text-green-900 mb-1">Thank you for voting!</h3>
                <p className="text-green-800 text-sm">
                  Your feedback has been recorded. Here are the current results:
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Vote Results Bar (shown after voting) */}
        {hasVoted && totalVotes > 0 && (
          <div className="bg-white border border-slate-200 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-slate-900 mb-4">Current Results</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-700">{voteData.originalContent.variantLabel}</span>
                  <span className="font-semibold text-slate-900">{originalPercentage}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${originalPercentage}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-700">{voteData.variantContent.variantLabel}</span>
                  <span className="font-semibold text-slate-900">{variantPercentage}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div
                    className="bg-purple-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${variantPercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-3 text-center">
              Total votes: {totalVotes}
            </p>
          </div>
        )}

        {/* Side-by-Side Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {renderContent(voteData.originalContent, 'original')}
          {renderContent(voteData.variantContent, 'variant')}
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-slate-500">
          <p>Powered by BluePeak Marketing</p>
        </div>
      </main>
    </div>
  );
}
