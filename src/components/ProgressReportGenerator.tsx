'use client';

import { useState, useEffect } from 'react';
import { ProgressReportData, Client } from '@/types';

interface ProgressReportGeneratorProps {
  clients?: Client[];
}

export default function ProgressReportGenerator({ clients = [] }: ProgressReportGeneratorProps) {
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [formData, setFormData] = useState<ProgressReportData>({
    clientId: '',
    clientName: '',
    reportPeriod: '',
    completedTasks: [''],
    metrics: [{ label: '', value: '' }],
    upcomingDeliverables: [''],
    blockers: '',
    highlights: '',
  });

  const [tone, setTone] = useState<'formal' | 'casual' | 'detailed'>('casual');
  const [generatedReport, setGeneratedReport] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Auto-populate form when client is selected
  useEffect(() => {
    if (!selectedClientId) return;

    const selectedClient = clients.find(c => c.id === selectedClientId);
    if (!selectedClient) return;

    const marketingContent = selectedClient.marketingContent || [];

    // Group content by type and count
    const contentByType: Record<string, number> = {};
    marketingContent.forEach(content => {
      contentByType[content.type] = (contentByType[content.type] || 0) + 1;
    });

    // Generate completed tasks from marketing content
    const tasks: string[] = [];
    Object.entries(contentByType).forEach(([type, count]) => {
      const typeLabel = {
        'blog': 'blog post',
        'linkedin': 'LinkedIn post',
        'twitter': 'Twitter thread',
        'email': 'email campaign',
        'ad-copy': 'ad copy set',
        'pdf-onepager': 'PDF one-pager'
      }[type] || type;

      const plural = count > 1 ? typeLabel + 's' : typeLabel;
      tasks.push(`Created ${count} ${plural}`);
    });

    // Generate suggested metrics based on content
    const totalContent = marketingContent.length;
    const suggestedMetrics = totalContent > 0 ? [
      { label: 'Content Pieces Delivered', value: totalContent.toString() },
      { label: 'Platforms Covered', value: Object.keys(contentByType).length.toString() },
    ] : [{ label: '', value: '' }];

    // Generate suggested upcoming deliverables
    const hasContent = marketingContent.length > 0;
    const suggestedDeliverables = hasContent ? [
      'Schedule and publish created content across channels',
      'Monitor engagement metrics and performance',
      'Create next batch of marketing materials based on performance data',
    ] : [''];

    // Set form data with auto-populated tasks
    setFormData({
      clientId: selectedClient.id,
      clientName: selectedClient.company,
      reportPeriod: '',
      completedTasks: tasks.length > 0 ? tasks : [''],
      metrics: suggestedMetrics,
      upcomingDeliverables: suggestedDeliverables,
      blockers: '',
      highlights: marketingContent.length > 0 ? `Successfully generated ${marketingContent.length} high-quality marketing materials tailored to ${selectedClient.company}'s brand and audience` : '',
    });
  }, [selectedClientId, clients]);

  const handleTaskChange = (index: number, value: string) => {
    const newTasks = [...formData.completedTasks];
    newTasks[index] = value;
    setFormData({ ...formData, completedTasks: newTasks });
  };

  const addTask = () => {
    setFormData({
      ...formData,
      completedTasks: [...formData.completedTasks, ''],
    });
  };

  const removeTask = (index: number) => {
    setFormData({
      ...formData,
      completedTasks: formData.completedTasks.filter((_, i) => i !== index),
    });
  };

  const handleMetricChange = (index: number, field: 'label' | 'value', value: string) => {
    const newMetrics = [...formData.metrics];
    newMetrics[index][field] = value;
    setFormData({ ...formData, metrics: newMetrics });
  };

  const addMetric = () => {
    setFormData({
      ...formData,
      metrics: [...formData.metrics, { label: '', value: '' }],
    });
  };

  const removeMetric = (index: number) => {
    setFormData({
      ...formData,
      metrics: formData.metrics.filter((_, i) => i !== index),
    });
  };

  const handleDeliverableChange = (index: number, value: string) => {
    const newDeliverables = [...formData.upcomingDeliverables];
    newDeliverables[index] = value;
    setFormData({ ...formData, upcomingDeliverables: newDeliverables });
  };

  const addDeliverable = () => {
    setFormData({
      ...formData,
      upcomingDeliverables: [...formData.upcomingDeliverables, ''],
    });
  };

  const removeDeliverable = (index: number) => {
    setFormData({
      ...formData,
      upcomingDeliverables: formData.upcomingDeliverables.filter((_, i) => i !== index),
    });
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportData: formData,
          tone,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate report');

      const data = await response.json();
      setGeneratedReport(data.report);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedReport);
    alert('Report copied to clipboard!');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Input Form */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Progress Report Generator
        </h2>

        <div className="space-y-6">
          {/* Client Selector */}
          {clients.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Client (Auto-populate from marketing content)
              </label>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
              >
                <option value="">-- Select a client --</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.company} ({client.marketingContent?.length || 0} content pieces)
                  </option>
                ))}
              </select>
              {selectedClientId && (
                <p className="text-xs text-purple-600 mt-1">
                  ✨ Tasks auto-populated from marketing content!
                </p>
              )}
            </div>
          )}

          {/* Client Info */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client Name
            </label>
            <input
              type="text"
              value={formData.clientName}
              onChange={(e) =>
                setFormData({ ...formData, clientName: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
              placeholder="e.g., Acme Corporation"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Period
            </label>
            <input
              type="text"
              value={formData.reportPeriod}
              onChange={(e) =>
                setFormData({ ...formData, reportPeriod: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 placeholder:text-gray-400"
              placeholder="e.g., Week of Nov 4-8 or October 2024"
            />
          </div>

          {/* Completed Tasks */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Completed Tasks
            </label>
            {formData.completedTasks.map((task, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={task}
                  onChange={(e) => handleTaskChange(index, e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 placeholder:text-gray-400"
                  placeholder="e.g., Published 3 blog posts"
                />
                {formData.completedTasks.length > 1 && (
                  <button
                    onClick={() => removeTask(index)}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={addTask}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              + Add Task
            </button>
          </div>

          {/* Metrics */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Key Metrics
            </label>
            {formData.metrics.map((metric, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={metric.label}
                  onChange={(e) =>
                    handleMetricChange(index, 'label', e.target.value)
                  }
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 placeholder:text-gray-400"
                  placeholder="Metric name"
                />
                <input
                  type="text"
                  value={metric.value}
                  onChange={(e) =>
                    handleMetricChange(index, 'value', e.target.value)
                  }
                  className="w-32 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 placeholder:text-gray-400"
                  placeholder="Value"
                />
                {formData.metrics.length > 1 && (
                  <button
                    onClick={() => removeMetric(index)}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={addMetric}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              + Add Metric
            </button>
          </div>

          {/* Upcoming Deliverables */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upcoming Deliverables
            </label>
            {formData.upcomingDeliverables.map((deliverable, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={deliverable}
                  onChange={(e) =>
                    handleDeliverableChange(index, e.target.value)
                  }
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 placeholder:text-gray-400"
                  placeholder="e.g., Email campaign launching next week"
                />
                {formData.upcomingDeliverables.length > 1 && (
                  <button
                    onClick={() => removeDeliverable(index)}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={addDeliverable}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              + Add Deliverable
            </button>
          </div>

          {/* Optional Fields */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Highlights (Optional)
            </label>
            <textarea
              value={formData.highlights}
              onChange={(e) =>
                setFormData({ ...formData, highlights: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 placeholder:text-gray-400"
              rows={2}
              placeholder="Any special wins or highlights to emphasize"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Blockers/Issues (Optional)
            </label>
            <textarea
              value={formData.blockers}
              onChange={(e) =>
                setFormData({ ...formData, blockers: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 placeholder:text-gray-400"
              rows={2}
              placeholder="Any challenges or blockers to mention"
            />
          </div>

          {/* Tone Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Tone
            </label>
            <div className="flex gap-3">
              {['formal', 'casual', 'detailed'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTone(t as any)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    tone === t
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !formData.clientName || !formData.reportPeriod}
            className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isGenerating ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
      </div>

      {/* Generated Report Display */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Generated Report</h2>
          {generatedReport && (
            <button
              onClick={copyToClipboard}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
            >
              Copy to Clipboard
            </button>
          )}
        </div>

        {!generatedReport && !isGenerating && (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <svg
              className="w-16 h-16 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-center">
              Fill out the form and click "Generate Report"<br />
              to see your AI-generated progress update
            </p>
          </div>
        )}

        {isGenerating && (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
            <p className="text-gray-600">Claude is writing your report...</p>
          </div>
        )}

        {generatedReport && (
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap text-gray-800">
                {generatedReport}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
