'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';

export default function ClientOnboardingPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Client Onboarding</h1>
            <p className="text-gray-600">
              Streamline client discovery, proposal creation, and onboarding workflows
            </p>
          </div>

          {/* Placeholder Content */}
          <div className="bg-white rounded-lg shadow p-8 mb-6">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
              <div className="max-w-md mx-auto">
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
                  Client Onboarding Tools Coming Soon
                </h3>
                <p className="text-gray-600 mb-4">
                  This section is being developed by your teammate and will handle client discovery,
                  proposal generation, and onboarding automation.
                </p>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-left">
                  <h4 className="font-medium text-purple-900 mb-2">Planned Features:</h4>
                  <ul className="text-sm text-purple-800 space-y-1">
                    <li>• Automated discovery call questionnaires</li>
                    <li>• AI-powered proposal generation</li>
                    <li>• Client information management</li>
                    <li>• Progress tracking and reporting</li>
                    <li>• Onboarding workflow automation</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Active Clients</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">0</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Proposals Sent</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">0</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Onboarding In Progress</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">0</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Completed This Month</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">0</p>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
