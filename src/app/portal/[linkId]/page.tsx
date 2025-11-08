'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import DiscoveryChat from '@/components/DiscoveryChat';
import { DiscoveryData, DiscoveryMessage } from '@/types';

export default function ClientPortalPage() {
  const params = useParams();
  const linkId = params.linkId as string;
  const [isComplete, setIsComplete] = useState(false);
  const [clientName, setClientName] = useState('');

  useEffect(() => {
    // In production, would fetch client data from Firebase using linkId
    // For now, just show a placeholder
    console.log('Portal accessed with linkId:', linkId);
  }, [linkId]);

  const handleDiscoveryComplete = async (
    data: DiscoveryData,
    messages: DiscoveryMessage[]
  ) => {
    setClientName(data.companyName || 'there');

    // In production, would save to Firebase and notify BluePeak team
    console.log('Discovery complete:', { data, messages });

    // Mark as complete
    setIsComplete(true);
  };

  if (isComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Thank You!</h1>
            <p className="text-lg text-gray-600">
              We've received your information and our team is already working on your
              customized proposal.
            </p>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-6">
            <h2 className="font-semibold text-purple-900 mb-2">What's Next?</h2>
            <ul className="text-sm text-purple-800 space-y-2 text-left">
              <li className="flex items-start">
                <svg
                  className="w-5 h-5 text-purple-600 mr-2 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>
                  Our team will review your responses and create a tailored marketing proposal
                </span>
              </li>
              <li className="flex items-start">
                <svg
                  className="w-5 h-5 text-purple-600 mr-2 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>
                  You'll receive an email within 24-48 hours to schedule a proposal discussion
                </span>
              </li>
              <li className="flex items-start">
                <svg
                  className="w-5 h-5 text-purple-600 mr-2 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>
                  During the meeting, we'll walk through our recommendations and answer any questions
                </span>
              </li>
            </ul>
          </div>

          <p className="text-sm text-gray-500">
            Questions? Email us at{' '}
            <a href="mailto:hello@bluepeak.com" className="text-purple-600 hover:underline">
              hello@bluepeak.com
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">BluePeak Marketing</h1>
          <p className="text-lg text-gray-600">
            Discovery Questionnaire
          </p>
        </div>

        {/* Welcome Message */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">
            Welcome! Let's Get Started
          </h2>
          <p className="text-gray-600 mb-4">
            Thank you for your interest in BluePeak Marketing. We're excited to learn about your
            business and explore how we can help you achieve your marketing goals.
          </p>
          <p className="text-gray-600">
            Our AI assistant will ask you a few questions to understand your needs better. This
            typically takes 5-10 minutes. Your responses will help us create a customized proposal
            tailored specifically to your business.
          </p>
        </div>

        {/* Discovery Chat */}
        <DiscoveryChat onComplete={handleDiscoveryComplete} />

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Powered by{' '}
            <a
              href="https://anthropic.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 hover:underline"
            >
              Claude AI
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
