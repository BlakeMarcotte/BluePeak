'use client';

import { useState, useRef, useEffect } from 'react';
import { DiscoveryMessage, DiscoveryData } from '@/types';

interface DiscoveryChatProps {
  onComplete: (data: DiscoveryData, messages: DiscoveryMessage[], logoUrl?: string) => void;
}

export default function DiscoveryChat({ onComplete }: DiscoveryChatProps) {
  const [messages, setMessages] = useState<DiscoveryMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm here to learn about your business and marketing needs. Let's start - what are your main marketing goals right now?",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [showLogoUpload, setShowLogoUpload] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const extractDiscoveryData = (msgs: DiscoveryMessage[]): DiscoveryData => {
    // Extract structured data by finding assistant questions and the following user answers
    const data: DiscoveryData = {};

    for (let i = 0; i < msgs.length - 1; i++) {
      const currentMsg = msgs[i];
      const nextMsg = msgs[i + 1];

      // Only process if current is assistant question and next is user answer
      if (currentMsg.role === 'assistant' && nextMsg.role === 'user') {
        const question = currentMsg.content.toLowerCase();
        const answer = nextMsg.content.trim();

        // Extract based on question keywords
        if (question.includes('marketing goal') || question.includes('main goal')) {
          data.businessGoals = answer;
        } else if (question.includes('target audience') || question.includes('ideal customer')) {
          data.targetAudience = answer;
        } else if (question.includes('services') || question.includes('interested in')) {
          data.servicesNeeded = [answer];
        } else if (question.includes('company name') || question.includes('business name')) {
          data.companyName = answer;
        } else if (question.includes('industry') || question.includes('sector')) {
          data.industry = answer;
        } else if (question.includes('budget')) {
          data.budget = answer;
        } else if (question.includes('timeline') || question.includes('timeframe')) {
          data.timeline = answer;
        } else if (question.includes('challenge') || question.includes('problem')) {
          data.currentChallenges = answer;
        }
      }
    }

    return data;
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: DiscoveryMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      // Convert to format expected by API
      // Filter out the initial assistant greeting (Anthropic requires user to go first)
      const apiMessages = updatedMessages
        .filter((m, index) => !(index === 0 && m.role === 'assistant'))
        .map(m => ({
          role: m.role,
          content: m.content,
        }));

      const response = await fetch('/api/discovery-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();

      const assistantMessage: DiscoveryMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);

      if (data.isComplete) {
        setIsComplete(true);
        // Show logo upload UI instead of immediately completing
        setTimeout(() => {
          setShowLogoUpload(true);
        }, 1000);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: DiscoveryMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I encountered an error. Could you please try again?",
        timestamp: new Date(),
      };
      setMessages([...updatedMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setUploadError('Please select an image file');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setUploadError('File size must be less than 5MB');
        return;
      }

      // Clean up previous preview URL
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      // Create preview URL
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);
      setSelectedFile(file);
      setUploadError('');
    }
  };

  // Clean up preview URL when component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleLogoUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('logo', selectedFile);

      const response = await fetch('/api/upload-logo', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Upload error response:', errorData);
        throw new Error(errorData.details || errorData.error || 'Failed to upload logo');
      }

      const { logoUrl } = await response.json();
      console.log('✅ Logo uploaded successfully:', logoUrl);

      // Complete discovery with logo URL
      const discoveryData = extractDiscoveryData(messages);
      onComplete(discoveryData, messages, logoUrl);
    } catch (error: any) {
      console.error('Logo upload error:', error);
      setUploadError(error.message || 'Failed to upload logo. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSkipLogo = () => {
    const discoveryData = extractDiscoveryData(messages);
    onComplete(discoveryData, messages);
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-lg shadow-lg">
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-4 rounded-t-lg">
        <h2 className="text-xl font-semibold">Discovery Chat</h2>
        <p className="text-sm text-purple-100">Let's learn about your business needs</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <p className={`text-xs mt-1 ${
                message.role === 'user' ? 'text-purple-200' : 'text-gray-500'
              }`}>
                {new Date(message.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-3">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}

        {isComplete && (
          <div className="flex justify-center">
            <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg px-4 py-3 text-sm">
              Thank you! Your responses have been recorded.
            </div>
          </div>
        )}

        {showLogoUpload && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mt-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              One Last Thing - Upload Your Logo
            </h3>
            <p className="text-sm text-gray-700 mb-4">
              Please upload your company logo so we can include it in your proposal and marketing materials.
            </p>

            <div className="space-y-4">
              {/* Image Preview */}
              {previewUrl && (
                <div className="flex justify-center">
                  <div className="relative">
                    <img
                      src={previewUrl}
                      alt="Logo preview"
                      className="max-w-xs max-h-48 rounded-lg border-2 border-purple-200 object-contain bg-white"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  {selectedFile ? 'Change File' : 'Choose File'}
                </button>
                {selectedFile && (
                  <span className="text-sm text-gray-600">
                    {selectedFile.name}
                  </span>
                )}
              </div>

              {uploadError && (
                <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg px-4 py-2 text-sm">
                  {uploadError}
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={handleLogoUpload}
                  disabled={!selectedFile || isUploading}
                  className="bg-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {isUploading ? 'Uploading...' : 'Upload Logo'}
                </button>
                <button
                  onClick={handleSkipLogo}
                  disabled={isUploading}
                  className="text-gray-600 hover:text-gray-900 px-4 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Skip for now
                </button>
              </div>

              <p className="text-xs text-gray-500">
                Accepted formats: JPG, PNG, SVG (max 5MB)
              </p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex space-x-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading || isComplete}
            placeholder="Type your message..."
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-900 placeholder:text-gray-400"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || isComplete || !inputValue.trim()}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
