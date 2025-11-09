'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Image from 'next/image';
import DiscoveryChat from '@/components/DiscoveryChat';
import { DiscoveryData, DiscoveryMessage } from '@/types';

export default function ClientPortalPage() {
  const params = useParams();
  const router = useRouter();
  const linkId = params.linkId as string;
  const [isComplete, setIsComplete] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [showSignup, setShowSignup] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [signupError, setSignupError] = useState('');
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  const [hasExistingAccount, setHasExistingAccount] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    // Check if discovery has already been completed
    const checkDiscoveryStatus = async () => {
      try {
        const response = await fetch(`/api/clients/${linkId}?byLinkId=true`);
        if (response.ok) {
          const { client } = await response.json();

          // Check if discovery is already complete
          if (client.onboardingStage !== 'created' && client.onboardingStage !== 'discovery_sent') {
            setAlreadyCompleted(true);
            setClientEmail(client.email);
            setClientName(client.company || client.name);

            // Check if they already have an account
            if (client.hasAccount) {
              setHasExistingAccount(true);
            }
          }
        }
      } catch (error) {
        console.error('Error checking discovery status:', error);
      } finally {
        setCheckingStatus(false);
      }
    };

    checkDiscoveryStatus();
  }, [linkId]);

  const handleDiscoveryComplete = async (
    data: DiscoveryData,
    messages: DiscoveryMessage[],
    logoUrl?: string
  ) => {
    setClientName(data.companyName || 'there');

    try {
      // First, fetch the client by linkId to get their ID
      const clientResponse = await fetch(`/api/clients/${linkId}?byLinkId=true`);
      if (!clientResponse.ok) {
        throw new Error('Failed to fetch client');
      }
      const { client } = await clientResponse.json();

      // Save client email for signup
      setClientEmail(client.email);

      // Update the client with discovery data, conversation history, and logo
      const updateResponse = await fetch('/api/clients', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: client.id,
          discoveryData: data,
          conversationHistory: messages,
          logoUrl: logoUrl,
          onboardingStage: 'discovery_complete',
        }),
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to save discovery data');
      }

      console.log('Discovery saved successfully to Firebase');
    } catch (error) {
      console.error('Error saving discovery:', error);
      // Still show completion screen even if save fails
    }

    // Mark as complete and show signup option
    setIsComplete(true);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');

    // Validate passwords match
    if (password !== confirmPassword) {
      setSignupError('Passwords do not match');
      return;
    }

    // Validate password length
    if (password.length < 6) {
      setSignupError('Password must be at least 6 characters');
      return;
    }

    setIsCreatingAccount(true);

    try {
      const response = await fetch('/api/client-auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: clientEmail,
          password,
          linkId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create account');
      }

      // Account created successfully - now sign them in automatically
      await signInWithEmailAndPassword(auth, clientEmail, password);

      // Redirect directly to dashboard
      router.push('/client-portal/dashboard');
    } catch (error: any) {
      console.error('Signup error:', error);
      setSignupError(error.message || 'Failed to create account. Please try again.');
    } finally {
      setIsCreatingAccount(false);
    }
  };

  if (isComplete && !showSignup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-blue-100 flex items-center justify-center p-4">
        {/* Decorative Circles */}
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-cyan-200 rounded-full opacity-20 -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-200 rounded-full opacity-20 translate-x-1/2 translate-y-1/2"></div>

        <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl max-w-2xl w-full p-8">
          <div className="mb-6 text-center">
            <div className="flex justify-center mb-4">
              <Image
                src="/Gemini_Generated_Image_gxqzr3gxqzr3gxqz (1).png"
                alt="BluePeak Logo"
                width={100}
                height={100}
                className="object-contain"
                priority
              />
            </div>
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
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-900 to-blue-600 bg-clip-text text-transparent mb-2">
              Thank You!
            </h1>
            <p className="text-lg text-gray-600">
              We've received your information and our team is already working on your
              customized proposal.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h2 className="font-semibold text-blue-900 mb-2">What's Next?</h2>
            <ul className="text-sm text-blue-800 space-y-2 text-left">
              <li className="flex items-start">
                <svg
                  className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0"
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
                  className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0"
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
                  className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0"
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

          {/* Call to Action - Create Account */}
          <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h2 className="font-semibold text-gray-900 mb-2">Create Your Client Portal Account</h2>
            <p className="text-sm text-gray-700 mb-4">
              Get instant access to your proposal, campaign materials, and analytics dashboard.
              Track your marketing progress in real-time!
            </p>
            <button
              onClick={() => setShowSignup(true)}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl"
            >
              Create Free Account
            </button>
            <p className="text-xs text-gray-500 mt-2">
              You'll receive your proposal via email regardless of account creation
            </p>
          </div>

          <p className="text-sm text-gray-500 text-center">
            Questions? Email us at{' '}
            <a href="mailto:hello@bluepeak.com" className="text-blue-600 hover:text-blue-700 font-medium">
              hello@bluepeak.com
            </a>
          </p>
        </div>
      </div>
    );
  }

  // Signup Screen
  if (isComplete && showSignup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-blue-100 flex items-center justify-center p-4">
        {/* Decorative Circles */}
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-cyan-200 rounded-full opacity-20 -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-200 rounded-full opacity-20 translate-x-1/2 translate-y-1/2"></div>

        <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl max-w-md w-full p-8">
          <div className="mb-6 text-center">
            <div className="flex justify-center mb-4">
              <Image
                src="/Gemini_Generated_Image_gxqzr3gxqzr3gxqz (1).png"
                alt="BluePeak Logo"
                width={100}
                height={100}
                className="object-contain"
                priority
              />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-900 to-blue-600 bg-clip-text text-transparent mb-2">
              Create Your Portal Account
            </h1>
            <p className="text-gray-600">
              Access your proposal and marketing materials anytime
            </p>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            {/* Email (pre-filled, disabled) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={clientEmail}
                disabled
                className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-100 text-gray-900"
              />
              <p className="text-xs text-gray-500 mt-1">
                This is the email we have on file for you
              </p>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="At least 6 characters"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400"
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Re-enter your password"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400"
              />
            </div>

            {/* Error Message */}
            {signupError && (
              <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg px-4 py-3 text-sm">
                {signupError}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isCreatingAccount}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
            >
              {isCreatingAccount ? 'Creating Account...' : 'Create Account'}
            </button>

            {/* Back Button */}
            <button
              type="button"
              onClick={() => setShowSignup(false)}
              className="w-full text-gray-600 hover:text-gray-900 text-sm"
            >
              ← Back
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Loading State
  if (checkingStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-blue-100 flex items-center justify-center p-4">
        {/* Decorative Circles */}
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-cyan-200 rounded-full opacity-20 -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-200 rounded-full opacity-20 translate-x-1/2 translate-y-1/2"></div>

        <div className="relative text-center">
          <div className="flex justify-center mb-6">
            <Image
              src="/Gemini_Generated_Image_gxqzr3gxqzr3gxqz (1).png"
              alt="BluePeak Logo"
              width={100}
              height={100}
              className="object-contain"
              priority
            />
          </div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }

  // Discovery Already Completed + Showing Signup Form
  if (alreadyCompleted && showSignup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-blue-100 flex items-center justify-center p-4">
        {/* Decorative Circles */}
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-cyan-200 rounded-full opacity-20 -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-200 rounded-full opacity-20 translate-x-1/2 translate-y-1/2"></div>

        <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl max-w-md w-full p-8">
          <div className="mb-6 text-center">
            <div className="flex justify-center mb-4">
              <Image
                src="/Gemini_Generated_Image_gxqzr3gxqzr3gxqz (1).png"
                alt="BluePeak Logo"
                width={100}
                height={100}
                className="object-contain"
                priority
              />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-900 to-blue-600 bg-clip-text text-transparent mb-2">
              Create Your Portal Account
            </h1>
            <p className="text-gray-600">
              Access your proposal and marketing materials anytime
            </p>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            {/* Email (pre-filled, disabled) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={clientEmail}
                disabled
                className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-100 text-gray-900"
              />
              <p className="text-xs text-gray-500 mt-1">
                This is the email we have on file for you
              </p>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="At least 6 characters"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400"
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Re-enter your password"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400"
              />
            </div>

            {/* Error Message */}
            {signupError && (
              <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg px-4 py-3 text-sm">
                {signupError}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isCreatingAccount}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
            >
              {isCreatingAccount ? 'Creating Account...' : 'Create Account'}
            </button>

            {/* Back Button */}
            <button
              type="button"
              onClick={() => setShowSignup(false)}
              className="w-full text-gray-600 hover:text-gray-900 text-sm"
            >
              ← Back
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Discovery Already Completed - Show Account Options
  if (alreadyCompleted && !showSignup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-blue-100 flex items-center justify-center p-4">
        {/* Decorative Circles */}
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-cyan-200 rounded-full opacity-20 -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-200 rounded-full opacity-20 translate-x-1/2 translate-y-1/2"></div>

        <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl max-w-md w-full p-8">
          <div className="mb-6 text-center">
            <div className="flex justify-center mb-4">
              <Image
                src="/Gemini_Generated_Image_gxqzr3gxqzr3gxqz (1).png"
                alt="BluePeak Logo"
                width={100}
                height={100}
                className="object-contain"
                priority
              />
            </div>
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Discovery Complete!</h1>
            <p className="text-gray-600">
              You've already completed the discovery questionnaire for {clientName}.
            </p>
          </div>

          {hasExistingAccount ? (
            // Already has account - redirect to login
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <p className="text-sm text-blue-800">
                  You have an existing portal account. Please log in to access your dashboard.
                </p>
              </div>
              <button
                onClick={() => router.push('/client-portal/login')}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl"
              >
                Go to Login
              </button>
            </div>
          ) : (
            // No account yet - offer signup
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Create Your Portal Account</h3>
                <p className="text-sm text-gray-700">
                  Get instant access to your proposal, campaign materials, and analytics dashboard.
                </p>
              </div>
              <button
                onClick={() => setShowSignup(true)}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl"
              >
                Create Free Account
              </button>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Already have an account?</p>
                <button
                  onClick={() => router.push('/client-portal/login')}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  Log In Instead
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>
              Questions? Email us at{' '}
              <a href="mailto:hello@bluepeak.com" className="text-blue-600 hover:text-blue-700 font-medium">
                hello@bluepeak.com
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-blue-100 py-12 px-4">
      {/* Decorative Circles */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-cyan-200 rounded-full opacity-20 -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-200 rounded-full opacity-20 translate-x-1/2 translate-y-1/2"></div>

      <div className="relative max-w-4xl mx-auto">
        {/* Header with Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <Image
              src="/Gemini_Generated_Image_gxqzr3gxqzr3gxqz (1).png"
              alt="BluePeak Logo"
              width={120}
              height={120}
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-900 to-blue-600 bg-clip-text text-transparent mb-2">
            BluePeak Marketing
          </h1>
          <p className="text-lg text-gray-700">
            Discovery Questionnaire
          </p>
        </div>

        {/* Welcome Message */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-6">
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
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>
            Powered by{' '}
            <a
              href="https://anthropic.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Claude AI
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
