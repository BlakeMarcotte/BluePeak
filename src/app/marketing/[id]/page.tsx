'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { Client, ContentType, GeneratedContent, PDFTemplate } from '@/types';

const CONTENT_TYPES: { value: ContentType; label: string; description: string }[] = [
  { value: 'pdf-onepager', label: 'PDF One-Pager', description: 'Professional one-page PDF with design' },
  { value: 'blog', label: 'Blog Post', description: '800-1200 words, SEO-optimized' },
  { value: 'linkedin', label: 'LinkedIn Post', description: 'Professional, 1300 char max' },
  { value: 'twitter', label: 'Twitter Thread', description: '5-7 tweets, engaging' },
  { value: 'email', label: 'Email Copy', description: 'Subject + body, conversion-focused' },
  { value: 'ad-copy', label: 'Ad Copy', description: 'Headline + description + CTA' },
];

export default function ClientMarketingPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<ContentType>('pdf-onepager');
  const [contentName, setContentName] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<PDFTemplate>('modern-minimal');
  const [analyzingBrand, setAnalyzingBrand] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [editingPdfId, setEditingPdfId] = useState<string | null>(null);
  const [editedPdfData, setEditedPdfData] = useState<any>(null);
  const [savingPdf, setSavingPdf] = useState(false);

  useEffect(() => {
    if (params.id) {
      loadClient();
    }
  }, [params.id]);

  const loadClient = async () => {
    try {
      setLoading(true);
      const response = await fetch(\`/api/clients/\${params.id}\`);
      if (!response.ok) throw new Error('Failed to fetch client');

      const data = await response.json();
      
      const clientData: Client = {
        ...data.client,
        createdAt: new Date(data.client.createdAt),
        updatedAt: new Date(data.client.updatedAt),
        marketingContent: (data.client.marketingContent || []).map((content: any) => ({
          ...content,
          generatedAt: new Date(content.generatedAt),
        })),
      };

      setClient(clientData);
    } catch (error) {
      console.error('Error loading client:', error);
      alert('Failed to load client');
      router.push('/marketing');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-slate-50">
          <Navbar />
          <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white border border-slate-200 rounded-lg p-8">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mr-3"></div>
                <p className="text-slate-700">Loading client...</p>
              </div>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  if (!client) {
    return null;
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <button
              onClick={() => router.push('/marketing')}
              className="flex items-center text-slate-600 hover:text-slate-900 mb-4 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
              </svg>
              Back to Clients
            </button>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Marketing Content for {client.company}
            </h1>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
            <p className="text-slate-900">Client marketing page is loading...</p>
            <p className="text-sm text-slate-600 mt-2">Company: {client.company}</p>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
