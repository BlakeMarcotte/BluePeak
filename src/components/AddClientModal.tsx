'use client';

import { useState } from 'react';
import { Client } from '@/types';

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientAdded: (client: Client) => void;
  isQuickAdd?: boolean; // If true, shows minimal fields
}

export default function AddClientModal({
  isOpen,
  onClose,
  onClientAdded,
  isQuickAdd = false,
}: AddClientModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    industry: '',
    phone: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const phoneNumber = value.replace(/\D/g, '');

    // Format as (xxx) xxx-xxxx
    if (phoneNumber.length === 0) return '';
    if (phoneNumber.length <= 3) return `(${phoneNumber}`;
    if (phoneNumber.length <= 6) return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData({ ...formData, phone: formatted });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          company: formData.company,
          industry: formData.industry || undefined,
          phone: formData.phone || undefined,
          onboardingStage: 'created',
          userId: 'demo-user', // In production, get from auth
        }),
      });

      if (!response.ok) throw new Error('Failed to create client');

      const { client } = await response.json();

      onClientAdded(client);

      // Reset form
      setFormData({
        name: '',
        email: '',
        company: '',
        industry: '',
        phone: '',
      });

      onClose();
    } catch (error) {
      console.error('Error adding client:', error);
      alert('Failed to add client. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6 z-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {isQuickAdd ? 'Quick Add Client' : 'Add New Client'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder:text-gray-400 text-gray-900"
                placeholder="John Smith"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder:text-gray-400 text-gray-900"
                placeholder="john@company.com"
              />
            </div>

            {/* Company */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder:text-gray-400 text-gray-900"
                placeholder="Acme Corporation"
              />
            </div>

            {/* Optional fields - only show in full mode */}
            {!isQuickAdd && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Industry
                  </label>
                  <input
                    type="text"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder:text-gray-400 text-gray-900"
                    placeholder="e.g., B2B SaaS, Healthcare, E-commerce"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    maxLength={14}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder:text-gray-400 text-gray-900"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </>
            )}

            {/* Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Adding...' : 'Add Client'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
