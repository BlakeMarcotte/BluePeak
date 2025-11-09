'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import AddClientModal from '@/components/AddClientModal';
import Modal from '@/components/Modal';
import { Client, OnboardingStage } from '@/types';

const STAGE_LABELS: Record<OnboardingStage, string> = {
  created: 'Just Added',
  discovery_sent: 'Discovery Sent',
  discovery_complete: 'Discovery Complete',
  meeting_scheduled: 'Meeting Scheduled',
  proposal_accepted: 'Accepted',
};

const STAGE_COLORS: Record<OnboardingStage, string> = {
  created: 'bg-gray-100 text-gray-800',
  discovery_sent: 'bg-blue-100 text-blue-800',
  discovery_complete: 'bg-cyan-100 text-cyan-800',
  meeting_scheduled: 'bg-purple-100 text-purple-800',
  proposal_accepted: 'bg-green-100 text-green-800',
};

interface ModalConfig {
  title: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning' | 'confirm';
  onConfirm?: () => void;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStage, setFilterStage] = useState<OnboardingStage | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState<ModalConfig>({
    title: '',
    message: '',
    type: 'info',
  });

  // Fetch clients on mount
  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients');
      if (!response.ok) throw new Error('Failed to fetch clients');

      const data = await response.json();
      // Convert date strings to Date objects
      const clientsWithDates = data.clients.map((client: any) => ({
        ...client,
        createdAt: new Date(client.createdAt),
        updatedAt: new Date(client.updatedAt),
        meetingDate: client.meetingDate ? new Date(client.meetingDate) : undefined,
      }));
      setClients(clientsWithDates);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClientAdded = (client: Client) => {
    // Convert date strings to Date objects
    const clientWithDates = {
      ...client,
      createdAt: new Date(client.createdAt),
      updatedAt: new Date(client.updatedAt),
      meetingDate: client.meetingDate ? new Date(client.meetingDate) : undefined,
    };

    if (clientToEdit) {
      // Update existing client in list
      setClients(clients.map((c) => (c.id === clientWithDates.id ? clientWithDates : c)));
    } else {
      // Add new client to list
      setClients([clientWithDates, ...clients]);
    }
  };

  const handleEditClient = (client: Client) => {
    setClientToEdit(client);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setClientToEdit(undefined);
  };

  const handleViewClient = (client: Client) => {
    // Copy discovery link to clipboard
    if (client.discoveryLinkId) {
      const link = `${window.location.origin}/portal/${client.discoveryLinkId}`;
      navigator.clipboard.writeText(link);
      setModalConfig({
        title: 'Link Copied!',
        message: `Discovery link copied to clipboard!\n\n${link}\n\nShare this with ${client.name} to complete their discovery questionnaire.`,
        type: 'success',
      });
      setIsNotificationOpen(true);
    } else {
      setModalConfig({
        title: 'No Link Available',
        message: 'No discovery link available for this client.',
        type: 'warning',
      });
      setIsNotificationOpen(true);
    }
  };

  const handleDeleteClient = async (client: Client) => {
    // Show confirmation dialog
    setModalConfig({
      title: 'Delete Client',
      message: `Are you sure you want to delete ${client.name} from ${client.company}?\n\nThis action cannot be undone.`,
      type: 'confirm',
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/clients?id=${client.id}`, {
            method: 'DELETE',
          });

          if (!response.ok) throw new Error('Failed to delete client');

          // Remove client from local state
          setClients(clients.filter((c) => c.id !== client.id));

          setModalConfig({
            title: 'Client Deleted',
            message: `${client.name} has been successfully deleted.`,
            type: 'success',
          });
          setIsNotificationOpen(true);
        } catch (error) {
          console.error('Error deleting client:', error);
          setModalConfig({
            title: 'Delete Failed',
            message: 'Failed to delete client. Please try again.',
            type: 'error',
          });
          setIsNotificationOpen(true);
        }
      },
    });
    setIsNotificationOpen(true);
  };

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.company.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStage = filterStage === 'all' || client.onboardingStage === filterStage;

    return matchesSearch && matchesStage;
  });

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Clients</h1>
                <p className="text-gray-600">Manage all your clients and their information</p>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Client
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Total Clients</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{clients.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Active Onboarding</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {clients.filter((c) => !['completed', 'proposal_accepted'].includes(c.onboardingStage)).length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Awaiting Response</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {clients.filter((c) => c.onboardingStage === 'discovery_sent').length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Proposals Accepted</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {clients.filter((c) => c.onboardingStage === 'proposal_accepted').length}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, email, or company..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Stage
                </label>
                <select
                  value={filterStage}
                  onChange={(e) => setFilterStage(e.target.value as OnboardingStage | 'all')}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">All Stages</option>
                  {Object.entries(STAGE_LABELS).map(([stage, label]) => (
                    <option key={stage} value={stage}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Client List */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Industry
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Added
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      {searchTerm || filterStage !== 'all'
                        ? 'No clients match your filters'
                        : 'No clients yet. Click "Add Client" to get started.'}
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((client) => (
                    <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{client.name}</div>
                          <div className="text-sm text-gray-500">{client.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{client.company}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{client.industry || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            STAGE_COLORS[client.onboardingStage]
                          }`}
                        >
                          {STAGE_LABELS[client.onboardingStage]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {client.createdAt.toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleViewClient(client)}
                          className="text-purple-600 hover:text-purple-900 mr-4"
                        >
                          Copy Link
                        </button>
                        <button
                          onClick={() => handleEditClient(client)}
                          className="text-blue-600 hover:text-blue-900 mr-3 inline-flex items-center"
                          title="Edit client"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteClient(client)}
                          className="text-red-600 hover:text-red-900 inline-flex items-center"
                          title="Delete client"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      <AddClientModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onClientAdded={handleClientAdded}
        isQuickAdd={false}
        clientToEdit={clientToEdit}
      />

      {/* Notification Modal */}
      <Modal
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        onConfirm={modalConfig.onConfirm}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
      />
    </ProtectedRoute>
  );
}
