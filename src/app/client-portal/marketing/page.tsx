'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Client, ContentType, GeneratedContent } from '@/types';
import ClientPortalNav from '@/components/ClientPortalNav';

const CONTENT_TYPES: { value: ContentType; label: string; icon: string }[] = [
  { value: 'pdf-onepager', label: 'PDF Materials', icon: '📄' },
  { value: 'blog', label: 'Blog Posts', icon: '📝' },
  { value: 'linkedin', label: 'LinkedIn', icon: '💼' },
  { value: 'twitter', label: 'Twitter', icon: '🐦' },
  { value: 'email', label: 'Emails', icon: '📧' },
  { value: 'ad-copy', label: 'Ad Copy', icon: '📢' },
];

export default function ClientMarketingPage() {
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ContentType>('pdf-onepager');
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        router.push('/client-portal/login');
        return;
      }

      try {
        const response = await fetch(`/api/client-auth/profile?uid=${firebaseUser.uid}`);
        if (!response.ok) throw new Error('Failed to fetch profile');

        const data = await response.json();
        const clientData: Client = {
          ...data.client,
          createdAt: new Date(data.client.createdAt),
          updatedAt: new Date(data.client.updatedAt),
          accountCreatedAt: data.client.accountCreatedAt ? new Date(data.client.accountCreatedAt) : undefined,
        };

        setClient(clientData);
      } catch (error) {
        console.error('Error fetching client profile:', error);
        alert('Failed to load your profile');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <ClientPortalNav />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white border border-slate-200 rounded-lg p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mr-3"></div>
              <p className="text-slate-700">Loading your marketing content...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!client) return null;

  const marketingContent = client.marketingContent || [];
  const filteredContent = marketingContent
    .filter((item) => item.type === activeTab)
    .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());

  const activeContentType = CONTENT_TYPES.find((ct) => ct.value === activeTab);

  return (
    <div className="min-h-screen bg-slate-50">
      <ClientPortalNav />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Marketing Content</h1>
          <p className="text-slate-600">Access all the marketing materials generated for {client.company}</p>
        </div>

        {marketingContent.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No Marketing Content Yet</h3>
            <p className="text-slate-600 max-w-md mx-auto">
              Your BluePeak team is working on creating marketing materials for your business.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {marketingContent.map((item) => (
              <div key={item.id} className="bg-white border border-slate-200 rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    {item.name && <h3 className="text-lg font-semibold text-slate-900 mb-1">{item.name}</h3>}
                    <p className="text-sm text-slate-500">
                      {item.type} • Generated {new Date(item.generatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(item.content)}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors"
                  >
                    Copy
                  </button>
                </div>
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-lg">
                    {item.content}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
