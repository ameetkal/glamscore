"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Recommendation {
  category: string;
  suggestions: string[];
  strengths: string[];
  status: 'green' | 'yellow' | 'red';
}

interface AuditMetrics {
  profile: {
    businessName: string;
    category: string;
    description: string;
    status: 'green' | 'yellow' | 'red';
  };
  photos: {
    profilePhoto: boolean;
    coverPhoto: boolean;
    interiorPhotos: boolean;
    exteriorPhotos: boolean;
    status: 'green' | 'yellow' | 'red';
  };
  information: {
    hours: boolean;
    phone: boolean;
    website: boolean;
    address: boolean;
    status: 'green' | 'yellow' | 'red';
  };
  reviews: {
    averageRating: number;
    totalReviews: number;
    responseRate: number;
    status: 'green' | 'yellow' | 'red';
  };
  posts: {
    hasPosts: boolean;
    postFrequency: number;
    postEngagement: number;
    status: 'green' | 'yellow' | 'red';
  };
  services: {
    hasServices: boolean;
    serviceCount: number;
    hasPricing: boolean;
    status: 'green' | 'yellow' | 'red';
  };
}

interface Analysis {
  timestamp: string;
  recommendations: Recommendation[];
  gbpAnalysis: AuditMetrics;
}

type AnalysisStage = 
  | 'initializing'
  | 'loading_profile'
  | 'analyzing_profile'
  | 'analyzing_photos'
  | 'analyzing_information'
  | 'analyzing_reviews'
  | 'analyzing_posts'
  | 'analyzing_services'
  | 'generating_recommendations'
  | 'complete';

interface AnalysisProgress {
  stage: AnalysisStage;
  progress: number;
  message: string;
}

interface ProgressData {
  type: 'progress';
  stage: AnalysisStage;
}

interface ResultData {
  type: 'result';
  data: Analysis;
}

type ApiResponse = ProgressData | ResultData;

function formatGbpUrl(url: string): string {
  url = url.trim();
  
  // If it's a naked domain (no protocol), add https://
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  
  return url;
}

export default function GoogleBusinessAudit() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [progress, setProgress] = useState<AnalysisProgress>({
    stage: 'initializing',
    progress: 0,
    message: 'Initializing analysis...'
  });

  const progressMessages: Record<AnalysisStage, string> = {
    initializing: 'Initializing analysis...',
    loading_profile: 'Loading Google Business Profile...',
    analyzing_profile: 'Analyzing profile information...',
    analyzing_photos: 'Checking photos and media...',
    analyzing_information: 'Verifying business information...',
    analyzing_reviews: 'Analyzing reviews and ratings...',
    analyzing_posts: 'Evaluating posts and updates...',
    analyzing_services: 'Checking services and offerings...',
    generating_recommendations: 'Generating recommendations...',
    complete: 'Analysis complete!'
  };

  const progressPercentages: Record<AnalysisStage, number> = {
    initializing: 0,
    loading_profile: 10,
    analyzing_profile: 20,
    analyzing_photos: 30,
    analyzing_information: 40,
    analyzing_reviews: 50,
    analyzing_posts: 60,
    analyzing_services: 70,
    generating_recommendations: 90,
    complete: 100
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setAnalysis(null);
    setProgress({
      stage: 'initializing',
      progress: 0,
      message: progressMessages.initializing
    });
    
    if (!url) {
      setError('Please provide your Google Maps business URL');
      return;
    }

    try {
      const formattedUrl = formatGbpUrl(url);
      new URL(formattedUrl);
      setUrl(formattedUrl);
    } catch (err) {
      setError('Please enter a valid Google Maps URL');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('url', url);

      const response = await fetch('/api/google-business-audit', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze Google Business Profile');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Failed to start analysis');

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          if (buffer.trim()) {
            try {
              const data = JSON.parse(buffer) as ApiResponse;
              if (data.type === 'result') {
                setAnalysis(data.data);
                setProgress({
                  stage: 'complete',
                  progress: 100,
                  message: progressMessages.complete
                });
              }
            } catch (e) {
              console.error('Error parsing final buffer:', e);
            }
          }
          break;
        }

        const chunk = new TextDecoder().decode(value);
        buffer += chunk;

        // Process complete JSON objects in the buffer
        let newlineIndex;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          const line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.trim()) {
            try {
              const data = JSON.parse(line) as ApiResponse;
              if (data.type === 'progress') {
                setProgress({
                  stage: data.stage,
                  progress: progressPercentages[data.stage],
                  message: progressMessages[data.stage]
                });
              }
            } catch (e) {
              console.error('Error parsing progress data:', e);
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during analysis');
    } finally {
      setIsLoading(false);
    }
  };

  const ProgressBar = () => (
    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
      <div 
        className="h-2.5 rounded-full transition-all duration-500"
        style={{ width: `${progress.progress}%`, backgroundColor: '#1C6B62' }}
      ></div>
    </div>
  );

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Google Business Profile Audit
            </h1>
            <p className="text-xl text-gray-600">
              Get personalized recommendations to improve your Google Business Profile
            </p>
            <div className="mt-4 space-x-4">
              <Link 
                href="/instagram-audit" 
                className="text-[#1C6B62] hover:text-[#15554D] transition-colors"
              >
                Switch to Instagram Profile Audit →
              </Link>
              <Link 
                href="/website-audit" 
                className="text-[#1C6B62] hover:text-[#15554D] transition-colors"
              >
                Switch to Website Audit →
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                How to Find Your Google Maps URL
              </h2>
              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  <li>Go to <a href="https://www.google.com/maps" target="_blank" rel="noopener noreferrer" className="text-[#1C6B62] hover:underline">Google Maps</a></li>
                  <li>Search for your business name</li>
                  <li>Click on your business listing</li>
                  <li>Click the "Share" button</li>
                  <li>Click "Copy link" to get your business URL</li>
                </ol>
                <p className="text-sm text-gray-500 mt-4">
                  Note: Make sure you&apos;re copying the URL from your business&apos;s Google Maps listing.
                  The URL should look something like: https://www.google.com/maps/place/Your+Business+Name
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="gbp-url" className="block text-sm font-medium text-gray-700 mb-2">
                  Google Maps Business URL
                </label>
                <input
                  type="text"
                  id="gbp-url"
                  value={url}
                  onChange={handleUrlChange}
                  placeholder="https://www.google.com/maps/place/your-business"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-[#1C6B62] focus:border-[#1C6B62]"
                  disabled={isLoading}
                />
              </div>

              {error && (
                <div className="text-red-600 text-sm">{error}</div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#1C6B62] hover:bg-[#15554D] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1C6B62] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Analyzing...' : 'Start Analysis'}
              </button>
            </form>

            {isLoading && (
              <div className="mt-8">
                <ProgressBar />
                <p className="text-center text-gray-600">{progress.message}</p>
              </div>
            )}
          </div>

          {analysis && (
            <div className="max-w-2xl mx-auto mt-8 sm:mt-12 bg-white rounded-xl shadow-lg p-4 sm:p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                Analysis Results
              </h2>
              
              <div className="space-y-8">
                {analysis.recommendations.map((rec, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">
                      {rec.category}
                    </h3>
                    
                    {rec.strengths.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Strengths:</h4>
                        <ul className="list-disc list-inside space-y-1 text-green-600">
                          {rec.strengths.map((strength, i) => (
                            <li key={i}>{strength}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {rec.suggestions.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Recommendations:</h4>
                        <ul className="list-disc list-inside space-y-1 text-gray-600">
                          {rec.suggestions.map((suggestion, i) => (
                            <li key={i}>{suggestion}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 text-center">
            <Link
              href="/"
              className="text-[#1C6B62] hover:text-[#15554D] font-medium"
            >
              ← Back to Home
            </Link>
          </div>

          <div className="mt-8 text-center text-gray-600">
            <p>Powered by <a href="https://glammatic.com" className="text-[#1C6B62] hover:underline" target="_blank" rel="noopener noreferrer">Glammatic.com</a></p>
          </div>
        </div>
      </div>
    </main>
  );
} 