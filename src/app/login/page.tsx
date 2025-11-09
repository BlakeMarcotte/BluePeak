'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Link from 'next/link';

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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">BluePeak</h1>
          <p className="text-sm text-slate-600 mt-1">Content Studio</p>
        </div>

        {/* Form Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900">Welcome back</h2>
            <p className="text-sm text-slate-600 mt-1">Enter your credentials to continue</p>
          </div>

          {error && (
            <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors text-sm"
                placeholder="name@company.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors text-sm"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2.5 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-sm"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>

        {/* Footer Links */}
        <p className="mt-6 text-center text-sm text-slate-600">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-indigo-600 hover:text-indigo-700 font-medium">
            Create account
          </Link>
        </p>

        <div className="mt-4 pt-4 border-t border-slate-200 text-center text-sm text-slate-600">
          <p>
            Client portal login?{' '}
            <Link href="/client-portal/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
              Click here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
