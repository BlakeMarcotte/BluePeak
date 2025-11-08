'use client';

import { useState, useRef, useEffect } from 'react';
import { DiscoveryMessage, DiscoveryData } from '@/types';

interface DiscoveryChatProps {
  onComplete: (data: DiscoveryData, messages: DiscoveryMessage[]) => void;
}

export default function DiscoveryChat({ onComplete }: DiscoveryChatProps) {
  const [messages, setMessages] = useState<DiscoveryMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm here to learn about your business and marketing needs. Let's start with the basics - what's your company name?",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const extractDiscoveryData = (msgs: DiscoveryMessage[]): DiscoveryData => {
    const conversation = msgs.map(m => `${m.role}: ${m.content}`).join('\n');

    // Simple extraction logic - in production, you'd use Claude to extract structured data
    const data: DiscoveryData = {};

    // Extract company name (usually in first user response)
    const companyMatch = conversation.match(/user:\s*([A-Z][a-zA-Z\s&]+)(?:\n|$)/);
    if (companyMatch) data.companyName = companyMatch[1].trim();

    // Look for industry mentions
    const industryKeywords = ['industry', 'sector', 'field', 'business'];
    const industryMsg = msgs.find(m =>
      m.role === 'user' && industryKeywords.some(k => m.content.toLowerCase().includes(k))
    );
    if (industryMsg) data.industry = industryMsg.content;

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
        const discoveryData = extractDiscoveryData(finalMessages);
        setTimeout(() => {
          onComplete(discoveryData, finalMessages);
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-lg shadow-lg">
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-4 rounded-t-lg">
        <h2 className="text-xl font-semibold">Discovery Call</h2>
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

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex space-x-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
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
