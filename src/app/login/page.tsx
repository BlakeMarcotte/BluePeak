'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Link from 'next/link';
import Image from 'next/image';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Sign in with Firebase Auth directly (same as client portal)
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check if this user is a client (not internal team)
      const checkResponse = await fetch(`/api/client-auth/profile?uid=${user.uid}`);

      console.log('Client check response:', {
        status: checkResponse.status,
        ok: checkResponse.ok,
        uid: user.uid
      });

      if (checkResponse.ok) {
        // This is a client account, not internal team
        const data = await checkResponse.json();
        console.log('Found client account:', data.client.email);

        // Sign them out immediately
        await auth.signOut();

        setError('This is a client account. Please use the client portal to log in.');
        setLoading(false);

        // Redirect to client portal login after 2 seconds
        setTimeout(() => {
          router.push('/client-portal/login');
        }, 2000);
        return;
      }

      // API returned 404 - not a client, proceed to internal dashboard
      console.log('Not a client account, proceeding to dashboard');

      // Check if User record exists, create if missing (fallback for legacy accounts)
      const userCheckResponse = await fetch(`/api/users?uid=${user.uid}`);
      if (!userCheckResponse.ok) {
        console.log('User record not found, creating one...');
        // Create User record for legacy account
        const createResponse = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: user.uid,
            email: user.email,
            displayName: user.displayName || user.email?.split('@')[0] || 'User',
            role: 'team_member',
          }),
        });

        // If user creation returns 409, it means this is a client account
        if (createResponse.status === 409) {
          const errorData = await createResponse.json();
          console.log('User is a client:', errorData.error);

          // Sign them out immediately
          await auth.signOut();

          setError('This is a client account. Please use the client portal to log in.');
          setLoading(false);

          // Redirect to client portal login after 2 seconds
          setTimeout(() => {
            router.push('/client-portal/login');
          }, 2000);
          return;
        }
      } else {
        // Update lastLoginAt for existing user
        await fetch('/api/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: user.uid,
            lastLoginAt: new Date().toISOString(),
          }),
        });
      }

      router.push('/clients');
    } catch (err: any) {
      console.error('Login error:', err);

      if (err.code === 'auth/invalid-credential') {
        setError('Invalid email or password');
      } else if (err.code === 'auth/user-not-found') {
        setError('No account found with this email');
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password');
      } else {
        setError('Failed to log in. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-blue-100 flex items-center justify-center p-4">
      {/* Decorative Circles */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-cyan-200 rounded-full opacity-20 -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-200 rounded-full opacity-20 translate-x-1/2 translate-y-1/2"></div>

      <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl max-w-md w-full p-8">
        {/* Back to Home Link */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Home
          </Link>
        </div>

        {/* Logo & Header */}
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <Image
              src="/Gemini_Generated_Image_gxqzr3gxqzr3gxqz (1).png"
              alt="BluePeak Logo"
              width={120}
              height={120}
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-900 to-blue-600 bg-clip-text text-transparent mb-2">
            Team Login
          </h1>
          <p className="text-gray-600">Sign in to manage campaigns</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg px-4 py-3 text-sm mb-6">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="name@company.com"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400"
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-blue-600 hover:text-blue-700 font-medium">
              Create account
            </Link>
          </p>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200 text-center text-sm text-gray-600">
          <p>
            Client login?{' '}
            <Link href="/client-portal/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Use client portal
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
