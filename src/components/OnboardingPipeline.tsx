'use client';

import { Client, OnboardingStage } from '@/types';

interface OnboardingPipelineProps {
  client: Client;
  onSendDiscovery: (clientId: string) => void;
  onGenerateProposal: (clientId: string) => void;
  onSendProposal: (clientId: string) => void;
}

// Helper function to download PDF from Firebase Storage URL
const downloadPDF = (url: string, filename: string) => {
  // Add response-content-disposition parameter to force download
  const downloadUrl = new URL(url);
  downloadUrl.searchParams.set('response-content-disposition', `attachment; filename="${filename}"`);

  // Create a temporary anchor element to trigger download
  const link = document.createElement('a');
  link.href = downloadUrl.toString();
  link.target = '_blank';
  link.rel = 'noopener noreferrer';

  // Trigger download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const STAGES: { stage: OnboardingStage; label: string; step: number }[] = [
  { stage: 'created', label: 'Client Added', step: 1 },
  { stage: 'discovery_sent', label: 'Discovery Sent', step: 2 },
  { stage: 'discovery_complete', label: 'Discovery Complete', step: 3 },
  { stage: 'meeting_scheduled', label: 'Meeting Scheduled', step: 4 },
  { stage: 'proposal_generated', label: 'Proposal Ready', step: 5 },
  { stage: 'proposal_sent', label: 'Proposal Sent', step: 6 },
  { stage: 'proposal_accepted', label: 'Accepted', step: 7 },
];

export default function OnboardingPipeline({
  client,
  onSendDiscovery,
  onGenerateProposal,
  onSendProposal,
}: OnboardingPipelineProps) {
  const currentStageIndex = STAGES.findIndex((s) => s.stage === client.onboardingStage);

  // If proposal has been generated but still at discovery_complete, treat discovery as complete
  const hasGeneratedProposal = client.proposal && client.onboardingStage === 'discovery_complete';

  const getActionButton = () => {
    switch (client.onboardingStage) {
      case 'created':
        return (
          <button
            onClick={() => onSendDiscovery(client.id)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
          >
            Send Discovery Link
          </button>
        );
      case 'discovery_sent':
        return (
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-5 h-5 text-yellow-500 mr-2 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                clipRule="evenodd"
              />
            </svg>
            Waiting for client response...
          </div>
        );
      case 'discovery_complete':
        if (client.proposal) {
          // Proposal has been generated, waiting for client to schedule meeting
          return (
            <div className="flex items-center gap-3">
              <div className="flex items-center text-sm text-gray-600">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Proposal generated - waiting for client to schedule meeting
              </div>
              {client.proposal.pdfUrl && (
                <button
                  onClick={() => downloadPDF(client.proposal!.pdfUrl, `${client.company}_Proposal.pdf`)}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition-colors inline-flex items-center"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download PDF
                </button>
              )}
            </div>
          );
        }
        return (
          <button
            onClick={() => onGenerateProposal(client.id)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
          >
            Generate Proposal
          </button>
        );
      case 'meeting_scheduled':
        return (
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                clipRule="evenodd"
              />
            </svg>
            Meeting: {client.proposal?.proposalMeetingDate?.toLocaleString() || 'TBD'}
          </div>
        );
      case 'proposal_generated':
        return (
          <div className="flex items-center gap-3">
            {client.proposal?.pdfUrl && (
              <button
                onClick={() => downloadPDF(client.proposal!.pdfUrl, `${client.company}_Proposal.pdf`)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors inline-flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download PDF
              </button>
            )}
            <button
              onClick={() => onSendProposal(client.id)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
            >
              Send Proposal
            </button>
          </div>
        );
      case 'proposal_sent':
        return (
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-5 h-5 text-yellow-500 mr-2 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                clipRule="evenodd"
              />
            </svg>
            Waiting for client decision...
          </div>
        );
      case 'proposal_accepted':
        return (
          <div className="flex items-center text-sm text-green-600 font-medium">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Proposal Accepted!
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      {/* Client Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{client.company}</h3>
          <p className="text-sm text-gray-600">
            {client.name} • {client.email}
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">
            Step {currentStageIndex + 1} of {STAGES.length - 1}
          </div>
        </div>
      </div>

      {/* Progress Stepper */}
      <div className="mb-6">
        <div className="flex items-center">
          {STAGES.slice(0, -1).map((stage, index) => {
            // Mark discovery as complete if proposal is generated
            const isComplete = index < currentStageIndex || (hasGeneratedProposal && stage.stage === 'discovery_complete');
            // If proposal generated, current step is meeting_scheduled; otherwise use actual current stage
            const isCurrent = hasGeneratedProposal
              ? stage.stage === 'meeting_scheduled'
              : index === currentStageIndex;
            const isLast = index === STAGES.length - 2;

            return (
              <div key={stage.stage} className="flex items-center flex-1">
                {/* Circle */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                      isComplete
                        ? 'bg-green-500 text-white'
                        : isCurrent
                        ? 'bg-purple-600 text-white ring-4 ring-purple-100'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {isComplete ? (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      stage.step
                    )}
                  </div>
                  <p
                    className={`mt-2 text-xs text-center font-medium ${
                      isCurrent ? 'text-purple-600' : isComplete ? 'text-green-600' : 'text-gray-500'
                    }`}
                  >
                    {stage.label}
                  </p>
                </div>

                {/* Line */}
                {!isLast && (
                  <div className="flex-1 px-2">
                    <div
                      className={`h-1 rounded transition-all ${
                        isComplete ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Area */}
      <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
        <div className="flex items-center space-x-4">
          {getActionButton()}
        </div>
        <div className="flex items-center space-x-2">
          <button className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
            View Details
          </button>
          {client.discoveryLinkId && (
            <button
              onClick={() => {
                const link = `${window.location.origin}/portal/${client.discoveryLinkId}`;
                navigator.clipboard.writeText(link);
                alert('Discovery link copied to clipboard!');
              }}
              className="px-3 py-2 text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
            >
              Copy Portal Link
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
