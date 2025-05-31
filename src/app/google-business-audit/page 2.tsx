"use client";

import { useState } from 'react';
import Link from 'next/link';

export default function GoogleBusinessAudit() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!url) {
      setError('Please enter your Google Business Profile URL');
      return;
    }

    try {
      // Validate URL format
      const formattedUrl = url.trim();
      if (!formattedUrl.includes('google.com/maps/place/')) {
        throw new Error('Please enter a valid Google Business Profile URL');
      }
      new URL(formattedUrl);
      
      setIsLoading(true);
      // TODO: Implement the actual audit logic
      // For now, just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Please enter a valid URL');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
              Google Business Profile Audit
            </h1>
            <div className="flex space-x-4">
              <Link 
                href="/website-audit"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Website Audit →
              </Link>
              <Link 
                href="/instagram-audit"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Instagram Audit →
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Get Your GlamScore</h2>
            
            {/* Instructions Tooltip */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-blue-900 mb-1">How to find your Google Business Profile URL:</h3>
                  <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                    <li>Go to Google Maps</li>
                    <li>Search for your business name</li>
                    <li>Click on your business listing</li>
                    <li>Click "Share" and copy the link</li>
                    <li>Paste the URL here (it should look like: google.com/maps/place/Your-Business-Name)</li>
                  </ol>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
                  Google Business Profile URL
                </label>
                <input
                  type="url"
                  id="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.google.com/maps/place/Your-Business-Name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                />
                {error && (
                  <p className="mt-2 text-sm text-red-600">{error}</p>
                )}
              </div>
              <button
                type="submit"
                disabled={!url || isLoading}
                className={`w-full px-6 py-3 rounded-lg text-white font-medium transition-colors ${
                  !url || isLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                }`}
              >
                {isLoading ? 'Analyzing...' : 'Get Your GlamScore'}
              </button>
            </form>

            {/* GlamScore Explanation Link */}
            <div className="mt-6 text-center">
              <Link 
                href="/glamscore-explanation"
                className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Learn how GlamScore is calculated
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 