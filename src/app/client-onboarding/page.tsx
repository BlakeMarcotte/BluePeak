'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import AddClientModal from '@/components/AddClientModal';
import OnboardingPipeline from '@/components/OnboardingPipeline';
import ProgressReportGenerator from '@/components/ProgressReportGenerator';
import { Client } from '@/types';

type TabType = 'pipeline' | 'reports';

export default function ClientOnboardingPage() {
  const [activeTab, setActiveTab] = useState<TabType>('pipeline');
  const [clients, setClients] = useState<Client[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingProposal, setIsGeneratingProposal] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState('');

  // Fetch clients on mount - filter for active onboarding only
  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients');
      if (!response.ok) throw new Error('Failed to fetch clients');

      const data = await response.json();
      // Convert date strings to Date objects
      const clientsWithDates = data.clients.map((client: any) => ({
        ...client,
        createdAt: new Date(client.createdAt),
        updatedAt: new Date(client.updatedAt),
        meetingDate: client.meetingDate ? new Date(client.meetingDate) : undefined,
      }));
      // Filter for clients not yet completed
      const activeClients = clientsWithDates.filter(
        (c: Client) => c.onboardingStage !== 'completed' && c.onboardingStage !== 'proposal_accepted'
      );
      setClients(activeClients);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClientAdded = (newClient: Client) => {
    // Convert date strings to Date objects
    const clientWithDates = {
      ...newClient,
      createdAt: new Date(newClient.createdAt),
      updatedAt: new Date(newClient.updatedAt),
      meetingDate: newClient.meetingDate ? new Date(newClient.meetingDate) : undefined,
    };
    setClients([clientWithDates, ...clients]);
  };

  const updateClient = async (clientId: string, updates: Partial<Client>) => {
    try {
      const response = await fetch('/api/clients', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: clientId, ...updates }),
      });

      if (!response.ok) throw new Error('Failed to update client');

      // Update local state
      setClients(
        clients.map((c) => (c.id === clientId ? { ...c, ...updates } : c))
      );
    } catch (error) {
      console.error('Error updating client:', error);
      alert('Failed to update client. Please try again.');
    }
  };

  const handleSendDiscovery = async (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    if (!client) return;

    // Update client stage in Firebase
    await updateClient(clientId, { onboardingStage: 'discovery_sent' });

    // Copy link to clipboard
    const link = `${window.location.origin}/portal/${client.discoveryLinkId}`;
    navigator.clipboard.writeText(link);
    alert(`Discovery link sent to ${client.email}!\n\nLink copied to clipboard:\n${link}`);
  };

  const handleGenerateProposal = async (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    if (!client || !client.conversationHistory) {
      alert('No discovery conversation found for this client.');
      return;
    }

    try {
      // Show loading modal
      setIsGeneratingProposal(true);
      setGenerationProgress(0);
      setGenerationStatus('Initializing proposal generation...');

      // Step 1: Generate proposal text with Claude
      setGenerationProgress(10);
      setGenerationStatus('Analyzing discovery conversation with AI...');

      const textResponse = await fetch('/api/generate-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationHistory: client.conversationHistory,
        }),
      });

      if (!textResponse.ok) throw new Error('Failed to generate proposal text');

      setGenerationProgress(50);
      setGenerationStatus('Proposal content generated! Creating PDF document...');

      const proposalData = await textResponse.json();

      // Step 2: Generate PDF from the proposal data
      setGenerationProgress(60);
      setGenerationStatus('Formatting proposal into professional PDF...');

      const pdfResponse = await fetch('/api/generate-proposal-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: client.company || client.name,
          executiveSummary: proposalData.executiveSummary,
          scopeOfWork: proposalData.scopeOfWork,
          timeline: proposalData.timeline,
          pricing: proposalData.pricing,
          deliverables: proposalData.deliverables,
        }),
      });

      if (!pdfResponse.ok) throw new Error('Failed to generate PDF');

      setGenerationProgress(85);
      setGenerationStatus('Saving proposal to client record...');

      const { pdfData } = await pdfResponse.json();

      // Create the proposal object
      const proposal = {
        clientName: client.company || client.name,
        discoveryData: client.discoveryData || {},
        executiveSummary: proposalData.executiveSummary,
        scopeOfWork: proposalData.scopeOfWork,
        timeline: proposalData.timeline,
        pricing: proposalData.pricing,
        deliverables: proposalData.deliverables,
        pdfUrl: pdfData, // Store the data URI directly
        generatedAt: new Date(),
      };

      // Update the client with the proposal (keep stage at discovery_complete)
      await updateClient(clientId, {
        proposal,
        // Don't change onboardingStage - client will schedule meeting first
      });

      setGenerationProgress(100);
      setGenerationStatus('Proposal generated successfully!');

      // Wait a moment to show 100% before closing
      setTimeout(() => {
        setIsGeneratingProposal(false);
        alert('Proposal generated successfully! Client can now view and download the PDF from their dashboard.');
      }, 1000);
    } catch (error) {
      console.error('Error generating proposal:', error);
      setIsGeneratingProposal(false);
      alert('Failed to generate proposal. Please try again.');
    }
  };

  const handleSendProposal = async (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    if (!client) return;

    await updateClient(clientId, { onboardingStage: 'proposal_sent' });

    alert(`Proposal sent to ${client.email}!`);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Client Onboarding
                </h1>
                <p className="text-gray-600">
                  Manage active client onboarding pipelines and progress reporting
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Client
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('pipeline')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'pipeline'
                      ? 'border-purple-600 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Onboarding Pipeline
                </button>
                <button
                  onClick={() => setActiveTab('reports')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'reports'
                      ? 'border-purple-600 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Progress Reports
                </button>
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'pipeline' && (
            <div>
              {/* Info Banner */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-blue-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      Onboarding Workflow
                    </h3>
                    <p className="mt-1 text-sm text-blue-700">
                      Track each client through the onboarding process: Discovery → Meeting → Proposal → Acceptance
                    </p>
                  </div>
                </div>
              </div>

              {/* Active Onboardings */}
              {clients.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Active Onboardings
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Add a new client to start the onboarding process
                  </p>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors"
                  >
                    Add Your First Client
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {clients.map((client) => (
                    <OnboardingPipeline
                      key={client.id}
                      client={client}
                      onSendDiscovery={handleSendDiscovery}
                      onGenerateProposal={handleGenerateProposal}
                      onSendProposal={handleSendProposal}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'reports' && (
            <div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-green-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">
                      Progress Report Generator
                    </h3>
                    <p className="mt-1 text-sm text-green-700">
                      Input your completed tasks and metrics, and Claude will generate a
                      professional progress report for your client.
                    </p>
                  </div>
                </div>
              </div>

              <ProgressReportGenerator />
            </div>
          )}
        </main>
      </div>

      <AddClientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onClientAdded={handleClientAdded}
        isQuickAdd
      />

      {/* Proposal Generation Loading Modal */}
      {isGeneratingProposal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/50 transition-opacity" />

            {/* Modal */}
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-8 z-10">
              <div className="text-center">
                {/* Icon */}
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-purple-100 mb-4">
                  <svg
                    className="h-8 w-8 text-purple-600 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                </div>

                {/* Title */}
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Generating Proposal
                </h3>

                {/* Status */}
                <p className="text-sm text-gray-600 mb-6">
                  {generationStatus}
                </p>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                  <div
                    className="bg-gradient-to-r from-purple-600 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${generationProgress}%` }}
                  ></div>
                </div>

                {/* Percentage */}
                <p className="text-sm font-medium text-gray-700">
                  {generationProgress}%
                </p>

                {/* Info */}
                <p className="text-xs text-gray-500 mt-4">
                  This may take 30-60 seconds. Please don't close this window.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
