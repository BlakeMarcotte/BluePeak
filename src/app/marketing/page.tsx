'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';

export default function MarketingPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Marketing Content Generation</h1>
            <p className="text-gray-600">
              AI-powered content creation for multi-channel marketing campaigns
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
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Content Generation Coming Soon
                </h3>
                <p className="text-gray-600 mb-4">
                  This section will include tools for creating blog posts, social media content,
                  email campaigns, and ad copy using AI.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                  <h4 className="font-medium text-blue-900 mb-2">Planned Features:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Multi-channel campaign generator</li>
                    <li>• Industry-specific content personalization</li>
                    <li>• Brand voice consistency tools</li>
                    <li>• A/B variant generation</li>
                    <li>• Content library and management</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Campaigns Created</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">0</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Content Pieces</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">0</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Time Saved</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">0h</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Active Campaigns</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">0</p>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
