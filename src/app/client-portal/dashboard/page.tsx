'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Client } from '@/types';
import ClientPortalNav from '@/components/ClientPortalNav';
import MeetingScheduler from '@/components/MeetingScheduler';

export default function ClientDashboardPage() {
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [showScheduler, setShowScheduler] = useState(false);
  const [showProposal, setShowProposal] = useState(false);

  useEffect(() => {
    // Check auth state
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        // Not logged in - redirect to login
        router.push('/client-portal/login');
        return;
      }

      setUser(firebaseUser);

      // Fetch client data by Firebase Auth UID
      try {
        const response = await fetch(`/api/client-auth/profile?uid=${firebaseUser.uid}`);
        if (!response.ok) throw new Error('Failed to fetch client profile');

        const data = await response.json();
        setClient(data.client);
      } catch (error) {
        console.error('Error fetching client:', error);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/client-portal/login');
  };

  const handleMeetingScheduled = (date: Date) => {
    // Update local client state
    if (client && client.proposal) {
      setClient({
        ...client,
        proposal: {
          ...client.proposal,
          proposalMeetingDate: date,
        },
        onboardingStage: 'meeting_scheduled',
      });
    }
    setShowScheduler(false);
    alert('Meeting confirmed! You will receive a calendar invite shortly.');
  };
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ClientPortalNav />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg shadow-lg p-8 text-white mb-8">
          <h2 className="text-3xl font-bold mb-2">
            Welcome back, {client?.name || user?.displayName}!
          </h2>
          <p className="text-purple-100">
            Here's an overview of your marketing journey with BluePeak
          </p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Onboarding Status Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Onboarding Status</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Discovery</span>
                <span className="text-sm font-medium text-green-600">✓ Complete</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Proposal</span>
                <span className="text-sm font-medium text-yellow-600">
                  {client?.onboardingStage === 'proposal_sent' || client?.onboardingStage === 'proposal_accepted' ? '✓ Sent' : 'In Progress'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Kickoff Meeting</span>
                <span className="text-sm font-medium text-gray-400">Pending</span>
              </div>
            </div>
          </div>

          {/* Company Info Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Company</h3>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-gray-600">Company Name</p>
                <p className="text-sm font-medium text-gray-900">{client?.company || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Industry</p>
                <p className="text-sm font-medium text-gray-900">{client?.industry || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Contact Email</p>
                <p className="text-sm font-medium text-gray-900">{client?.email}</p>
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full text-left px-4 py-2 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-900 font-medium text-sm transition-colors">
                View Proposal
              </button>
              <button
                onClick={() => router.push('/client-portal/marketing')}
                className="w-full text-left px-4 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-900 font-medium text-sm transition-colors"
              >
                Content Library
              </button>
              <button className="w-full text-left px-4 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-900 font-medium text-sm transition-colors">
                Analytics
              </button>
            </div>
          </div>
        </div>

        {/* Proposal Section */}
        {client?.proposal && !showScheduler ? (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold text-gray-900">Your Marketing Proposal</h3>
              {!showProposal && (
                <button
                  onClick={() => setShowProposal(true)}
                  className="bg-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors"
                >
                  View Full Proposal
                </button>
              )}
              {showProposal && (
                <button
                  onClick={() => setShowProposal(false)}
                  className="text-gray-600 hover:text-gray-900 text-sm font-medium"
                >
                  Hide Proposal
                </button>
              )}
            </div>

            {showProposal && (
              <div className="prose max-w-none space-y-6">
                {/* Executive Summary */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Executive Summary</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">{client.proposal.executiveSummary}</p>
                </div>

                {/* Scope of Work */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Scope of Work</h4>
                  <div className="text-gray-700" dangerouslySetInnerHTML={{ __html: client.proposal.scopeOfWork }} />
                </div>

                {/* Timeline */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Timeline</h4>
                  <div className="text-gray-700" dangerouslySetInnerHTML={{ __html: client.proposal.timeline }} />
                </div>

                {/* Pricing */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Investment</h4>
                  <div className="text-gray-700" dangerouslySetInnerHTML={{ __html: client.proposal.pricing }} />
                </div>

                {/* Deliverables */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Deliverables</h4>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    {client.proposal.deliverables.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Download Button */}
            {client.proposal.pdfUrl && (
              <div className="mt-6 flex gap-3">
                <a
                  href={client.proposal.pdfUrl}
                  download={`${client.company}_Proposal.pdf`}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors inline-flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download PDF
                </a>
              </div>
            )}

            {/* Meeting CTA */}
            {!client.proposal.proposalMeetingDate ? (
              <div className="mt-6 bg-purple-50 border border-purple-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-purple-900 mb-2">Next Step: Schedule Your Discussion</h4>
                <p className="text-purple-800 mb-4">
                  Let's discuss this proposal in detail. Select a time that works best for you.
                </p>
                <button
                  onClick={() => setShowScheduler(true)}
                  className="bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                >
                  Schedule Meeting
                </button>
              </div>
            ) : (
              <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-center">
                  <svg className="w-6 h-6 text-green-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <p className="font-semibold text-green-900">Meeting Scheduled</p>
                    <p className="text-green-800">
                      {new Date(client.proposal.proposalMeetingDate).toLocaleString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        timeZoneName: 'short',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : client?.proposal && showScheduler ? (
          <div className="mb-8">
            <MeetingScheduler clientId={client.id} onScheduled={handleMeetingScheduled} />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Your Marketing Proposal</h3>
            <div className="text-center py-8">
              <svg
                className="w-16 h-16 text-gray-300 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Proposal In Progress</h4>
              <p className="text-gray-600">
                Our team is crafting your customized marketing proposal. You'll be notified when it's ready!
              </p>
            </div>
          </div>
        )}

        {/* Content Library Quick Access */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900">Marketing Content</h3>
            <button
              onClick={() => router.push('/client-portal/marketing')}
              className="text-purple-600 hover:text-purple-700 text-sm font-medium"
            >
              View All →
            </button>
          </div>
          <div className="text-center py-8">
            <svg
              className="w-16 h-16 text-gray-300 mx-auto mb-4"
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
            <h4 className="text-lg font-medium text-gray-900 mb-2">Marketing Materials Library</h4>
            <p className="text-gray-600 mb-4">
              Access all your generated content including blog posts, social media, emails, and PDFs
            </p>
            <button
              onClick={() => router.push('/client-portal/marketing')}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors"
            >
              Browse Content Library
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
