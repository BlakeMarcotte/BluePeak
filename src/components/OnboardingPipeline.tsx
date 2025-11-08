'use client';

import { Client, OnboardingStage } from '@/types';

interface OnboardingPipelineProps {
  client: Client;
  onSendDiscovery: (clientId: string) => void;
  onScheduleMeeting: (clientId: string) => void;
  onGenerateProposal: (clientId: string) => void;
  onSendProposal: (clientId: string) => void;
}

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
  onScheduleMeeting,
  onGenerateProposal,
  onSendProposal,
}: OnboardingPipelineProps) {
  const currentStageIndex = STAGES.findIndex((s) => s.stage === client.onboardingStage);

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
        return (
          <button
            onClick={() => onScheduleMeeting(client.id)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Schedule Meeting
          </button>
        );
      case 'meeting_scheduled':
        return (
          <div className="space-y-2">
            <div className="flex items-center text-sm text-gray-600">
              <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                  clipRule="evenodd"
                />
              </svg>
              Meeting: {client.meetingDate?.toLocaleString() || 'TBD'}
            </div>
            <button
              onClick={() => onGenerateProposal(client.id)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
            >
              Generate Proposal
            </button>
          </div>
        );
      case 'proposal_generated':
        return (
          <button
            onClick={() => onSendProposal(client.id)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
          >
            Send Proposal
          </button>
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
            const isComplete = index < currentStageIndex;
            const isCurrent = index === currentStageIndex;
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
