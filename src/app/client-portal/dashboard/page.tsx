'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Client } from '@/types';

export default function ClientDashboardPage() {
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

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
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">BluePeak Marketing</h1>
            <p className="text-sm text-gray-600">Client Portal</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-gray-600 hover:text-gray-900 text-sm font-medium"
          >
            Log Out
          </button>
        </div>
      </header>

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
              <button className="w-full text-left px-4 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-900 font-medium text-sm transition-colors">
                Content Library
              </button>
              <button className="w-full text-left px-4 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-900 font-medium text-sm transition-colors">
                Analytics
              </button>
            </div>
          </div>
        </div>

        {/* Proposal Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Your Marketing Proposal</h3>
          {client?.proposal ? (
            <div>
              <p className="text-gray-600 mb-4">Your customized proposal is ready!</p>
              <button className="bg-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors">
                View Full Proposal
              </button>
            </div>
          ) : (
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
          )}
        </div>

        {/* Content Library Placeholder */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Marketing Content</h3>
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
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Content Yet</h4>
            <p className="text-gray-600">
              Your marketing materials will appear here once your campaign begins
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
