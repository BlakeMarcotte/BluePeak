'use client';

import { useState } from 'react';
import { CampaignFormData, ContentType } from '@/types';

interface CampaignFormProps {
  onSubmit: (data: CampaignFormData, logo: File | null, screenshot: File | null) => void;
  loading?: boolean;
}

const INDUSTRIES = [
  'Fintech',
  'HR Tech',
  'Dev Tools',
  'Marketing Tech',
  'Healthcare Tech',
  'E-commerce',
  'Cybersecurity',
  'SaaS Infrastructure',
];

const CONTENT_TYPES: { value: ContentType; label: string; description: string }[] = [
  { value: 'blog', label: 'Blog Post', description: '800-1200 words, SEO-optimized' },
  { value: 'linkedin', label: 'LinkedIn Post', description: 'Professional, 1300 char max' },
  { value: 'twitter', label: 'Twitter Thread', description: '5-7 tweets, engaging' },
  { value: 'email', label: 'Email Copy', description: 'Subject + body, conversion-focused' },
  { value: 'ad-copy', label: 'Ad Copy', description: 'Headline + description + CTA' },
];

export default function CampaignForm({ onSubmit, loading = false }: CampaignFormProps) {
  const [formData, setFormData] = useState<CampaignFormData>({
    clientName: '',
    industry: '',
    topic: '',
    targetAudience: '',
    brandVoice: '',
    contentTypes: [],
  });

  const [logo, setLogo] = useState<File | null>(null);
  const [screenshot, setScreenshot] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.contentTypes.length === 0) {
      alert('Please select at least one content type');
      return;
    }

    onSubmit(formData, logo, screenshot);
  };

  const toggleContentType = (type: ContentType) => {
    setFormData((prev) => ({
      ...prev,
      contentTypes: prev.contentTypes.includes(type)
        ? prev.contentTypes.filter((t) => t !== type)
        : [...prev.contentTypes, type],
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Client Information */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Client Information</h3>

        <div className="space-y-4">
          <div>
            <label htmlFor="clientName" className="block text-sm font-medium text-slate-700 mb-2">
              Client Name *
            </label>
            <input
              id="clientName"
              type="text"
              required
              value={formData.clientName}
              onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
              className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors text-sm"
              placeholder="e.g., Acme Fintech"
            />
          </div>

          <div>
            <label htmlFor="industry" className="block text-sm font-medium text-slate-700 mb-2">
              Industry *
            </label>
            <select
              id="industry"
              required
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors text-sm"
            >
              <option value="">Select industry...</option>
              {INDUSTRIES.map((industry) => (
                <option key={industry} value={industry}>
                  {industry}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Campaign Details */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Campaign Details</h3>

        <div className="space-y-4">
          <div>
            <label htmlFor="topic" className="block text-sm font-medium text-slate-700 mb-2">
              Campaign Topic *
            </label>
            <input
              id="topic"
              type="text"
              required
              value={formData.topic}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors text-sm"
              placeholder="e.g., Launch of instant payments feature"
            />
          </div>

          <div>
            <label htmlFor="targetAudience" className="block text-sm font-medium text-slate-700 mb-2">
              Target Audience *
            </label>
            <input
              id="targetAudience"
              type="text"
              required
              value={formData.targetAudience}
              onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
              className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors text-sm"
              placeholder="e.g., CFOs at mid-market companies"
            />
          </div>

          <div>
            <label htmlFor="brandVoice" className="block text-sm font-medium text-slate-700 mb-2">
              Brand Voice / Style Notes (Optional)
            </label>
            <textarea
              id="brandVoice"
              rows={3}
              value={formData.brandVoice}
              onChange={(e) => setFormData({ ...formData, brandVoice: e.target.value })}
              className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors text-sm"
              placeholder="e.g., Professional but approachable, data-driven, emphasizes security"
            />
          </div>
        </div>
      </div>

      {/* Brand Assets */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Brand Assets (Optional)</h3>
        <p className="text-sm text-slate-600 mb-4">
          Upload client assets to generate brand-aware content with color schemes and style guidance
        </p>

        <div className="space-y-4">
          <div>
            <label htmlFor="logo" className="block text-sm font-medium text-slate-700 mb-2">
              Client Logo
            </label>
            <input
              id="logo"
              type="file"
              accept="image/*"
              onChange={(e) => setLogo(e.target.files?.[0] || null)}
              className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
            {logo && <p className="mt-1 text-xs text-slate-500">Selected: {logo.name}</p>}
          </div>

          <div>
            <label htmlFor="screenshot" className="block text-sm font-medium text-slate-700 mb-2">
              Website Screenshot
            </label>
            <input
              id="screenshot"
              type="file"
              accept="image/*"
              onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
              className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
            {screenshot && <p className="mt-1 text-xs text-slate-500">Selected: {screenshot.name}</p>}
          </div>
        </div>
      </div>

      {/* Content Types */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Content Types *</h3>
        <p className="text-sm text-slate-600 mb-4">Select which types of content to generate</p>

        <div className="space-y-3">
          {CONTENT_TYPES.map(({ value, label, description }) => (
            <label
              key={value}
              className={`flex items-start p-3 border rounded-md cursor-pointer transition-colors ${
                formData.contentTypes.includes(value)
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <input
                type="checkbox"
                checked={formData.contentTypes.includes(value)}
                onChange={() => toggleContentType(value)}
                className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
              />
              <div className="ml-3">
                <div className="text-sm font-medium text-slate-900">{label}</div>
                <div className="text-xs text-slate-500">{description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-sm"
        >
          {loading ? 'Generating Content...' : 'Generate Campaign'}
        </button>
      </div>
    </form>
  );
}
