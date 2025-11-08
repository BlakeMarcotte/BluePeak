'use client';

import { useState } from 'react';
import { ClientProposal } from '@/types';

interface ProposalDisplayProps {
  proposal: Partial<ClientProposal>;
  isGenerating: boolean;
  onEdit?: () => void;
  onSave?: () => void;
}

export default function ProposalDisplay({
  proposal,
  isGenerating,
  onEdit,
  onSave,
}: ProposalDisplayProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'edit'>('preview');

  if (isGenerating) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Generating Your Proposal
          </h3>
          <p className="text-sm text-gray-600">
            Claude is analyzing the discovery call and creating a customized proposal...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Marketing Proposal
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              For {proposal.clientName || 'Client'}
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onEdit}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Edit
            </button>
            <button
              onClick={onSave}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
            >
              Save & Send
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-8">
        {/* Executive Summary */}
        <section>
          <div className="flex items-center mb-3">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-purple-600 font-bold text-sm">1</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900">
              Executive Summary
            </h3>
          </div>
          <div className="ml-11 text-gray-700 leading-relaxed">
            {proposal.executiveSummary || 'No summary generated yet.'}
          </div>
        </section>

        {/* Scope of Work */}
        <section>
          <div className="flex items-center mb-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-blue-600 font-bold text-sm">2</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900">
              Scope of Work
            </h3>
          </div>
          <div className="ml-11">
            <div className="prose prose-sm max-w-none text-gray-700">
              <div dangerouslySetInnerHTML={{ __html: formatMarkdown(proposal.scopeOfWork || '') }} />
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section>
          <div className="flex items-center mb-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-green-600 font-bold text-sm">3</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Timeline</h3>
          </div>
          <div className="ml-11">
            <div className="prose prose-sm max-w-none text-gray-700">
              <div dangerouslySetInnerHTML={{ __html: formatMarkdown(proposal.timeline || '') }} />
            </div>
          </div>
        </section>

        {/* Investment */}
        <section>
          <div className="flex items-center mb-3">
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-yellow-600 font-bold text-sm">4</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Investment</h3>
          </div>
          <div className="ml-11">
            <div className="prose prose-sm max-w-none text-gray-700">
              <div dangerouslySetInnerHTML={{ __html: formatMarkdown(proposal.pricing || '') }} />
            </div>
          </div>
        </section>

        {/* Deliverables */}
        <section>
          <div className="flex items-center mb-3">
            <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-pink-600 font-bold text-sm">5</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900">
              Deliverables
            </h3>
          </div>
          <div className="ml-11">
            <ul className="space-y-2">
              {proposal.deliverables?.map((deliverable, index) => (
                <li key={index} className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-gray-700">{deliverable}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 rounded-b-lg">
        <p className="text-sm text-gray-600 text-center">
          Generated on {new Date().toLocaleDateString()} by BluePeak Marketing
        </p>
      </div>
    </div>
  );
}

// Simple markdown-like formatting helper
function formatMarkdown(text: string): string {
  if (!text) return '';

  return text
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Bullets
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>[\s\S]*?<\/li>)/g, '<ul class="list-disc list-inside space-y-1">$1</ul>')
    // Line breaks
    .replace(/\n\n/g, '</p><p class="mb-2">')
    .replace(/^(.+)$/gm, '<p class="mb-2">$1</p>')
    // Headers
    .replace(/<p class="mb-2">### (.+)<\/p>/g, '<h4 class="font-semibold text-lg mt-4 mb-2">$1</h4>')
    .replace(/<p class="mb-2">## (.+)<\/p>/g, '<h3 class="font-semibold text-xl mt-4 mb-2">$1</h3>');
}
