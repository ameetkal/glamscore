"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { GOOGLE_BUSINESS_SCORING_CRITERIA, ScoringResult } from '@/types/google-business';

interface Recommendation {
  category: string;
  suggestions: string[];
  strengths: string[];
  status: 'green' | 'yellow' | 'red';
}

interface AuditMetrics {
  profileCompleteness: {
    businessName: boolean;
    businessCategory: boolean;
    businessHours: boolean;
    businessDescription: boolean;
    businessLocation: boolean;
    status: 'green' | 'yellow' | 'red';
    score: number;
  };
  visualContent: {
    profilePhoto: boolean;
    coverPhoto: boolean;
    businessPhotos: boolean;
    photoUpdates: boolean;
    photoQuality: boolean;
    status: 'green' | 'yellow' | 'red';
    score: number;
  };
  reviewsRatings: {
    averageRating: boolean;
    reviewResponses: boolean;
    responseRate: boolean;
    reviewQuality: boolean;
    reviewRecency: boolean;
    status: 'green' | 'yellow' | 'red';
    score: number;
  };
  postsUpdates: {
    postFrequency: boolean;
    postVariety: boolean;
    postEngagement: boolean;
    postCallToActions: boolean;
    postVisualQuality: boolean;
    status: 'green' | 'yellow' | 'red';
    score: number;
  };
  localSeo: {
    keywordsInDescription: boolean;
    localAreaKeywords: boolean;
    serviceArea: boolean;
    napConsistency: boolean;
    localCitations: boolean;
    status: 'green' | 'yellow' | 'red';
    score: number;
  };
  engagementInteraction: {
    messageResponseRate: boolean;
    questionResponseRate: boolean;
    userInteraction: boolean;
    postEngagement: boolean;
    reviewInteraction: boolean;
    status: 'green' | 'yellow' | 'red';
    score: number;
  };
  overallScore: number;
}

interface Analysis {
  timestamp: string;
  recommendations: Recommendation[];
  googleBusinessAnalysis: AuditMetrics;
}

type AnalysisStage = 
  | 'initializing'
  | 'loading_profile'
  | 'analyzing_profile'
  | 'analyzing_visuals'
  | 'analyzing_reviews'
  | 'analyzing_posts'
  | 'analyzing_seo'
  | 'analyzing_engagement'
  | 'generating_recommendations'
  | 'complete';

interface AnalysisProgress {
  message: string;
  percentage: number;
}

function formatUrl(url: string): string {
  url = url.trim();
  // Remove @ symbol if present at the start
  url = url.replace(/^@/, '');
  
  // If it's a naked domain (no protocol), add https://
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  
  return url;
}

export default function GoogleBusinessAudit() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<AnalysisProgress>({ message: '', percentage: 0 });
  const [result, setResult] = useState<any>(null);
  const [score, setScore] = useState<ScoringResult | null>(null);
  const [editableScore, setEditableScore] = useState<ScoringResult | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Add ProgressBar component inside GoogleBusinessAudit to access progress state
  const ProgressBar = () => (
    <div className="w-full space-y-2">
      <div className="flex justify-between text-sm text-gray-600">
        <span>{progress.message}</span>
        <span>{progress.percentage}%</span>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full transition-all duration-300 ease-in-out"
          style={{ width: `${progress.percentage}%`, backgroundColor: '#1C6B62' }}
        />
      </div>
    </div>
  );

  // Load saved state on component mount
  useEffect(() => {
    const savedAnalysis = localStorage.getItem('googleBusinessAuditAnalysis');
    const savedScore = localStorage.getItem('googleBusinessAuditScore');
    const savedUrl = localStorage.getItem('googleBusinessAuditUrl');
    
    if (savedAnalysis && savedScore) {
      try {
        setResult(JSON.parse(savedAnalysis));
        setScore(JSON.parse(savedScore));
        if (savedUrl) {
          setUrl(savedUrl);
        }
      } catch (e) {
        console.error('Error loading saved state:', e);
        // Clear invalid saved state
        localStorage.removeItem('googleBusinessAuditAnalysis');
        localStorage.removeItem('googleBusinessAuditScore');
        localStorage.removeItem('googleBusinessAuditUrl');
      }
    }
  }, []);

  // Save state when it changes
  useEffect(() => {
    if (result && score) {
      localStorage.setItem('googleBusinessAuditAnalysis', JSON.stringify(result));
      localStorage.setItem('googleBusinessAuditScore', JSON.stringify(score));
      if (url) {
        localStorage.setItem('googleBusinessAuditUrl', url);
      }
    }
  }, [result, score, url]);

  useEffect(() => {
    if (score) {
      setEditableScore(score);
    }
  }, [score]);

  // Function to clear saved state
  const clearSavedState = () => {
    localStorage.removeItem('googleBusinessAuditAnalysis');
    localStorage.removeItem('googleBusinessAuditScore');
    localStorage.removeItem('googleBusinessAuditUrl');
    setResult(null);
    setScore(null);
    setUrl('');
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setProgress({ message: 'Starting analysis...', percentage: 0 });
    setResult(null);
    setScore(null);

    try {
      const formData = new FormData();
      formData.append('url', url);

      const response = await fetch('/api/google-business-audit', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to analyze Google Business Profile');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to read response');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = new TextDecoder().decode(value);
        const lines = text.split('\n').filter(Boolean);

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.type === 'progress') {
              // Map the stage to a message and percentage
              const stageMessages: Record<string, { message: string; percentage: number }> = {
                'loading_profile': { message: 'Loading profile...', percentage: 10 },
                'analyzing_profile': { message: 'Analyzing profile information...', percentage: 20 },
                'analyzing_visuals': { message: 'Analyzing visual content...', percentage: 40 },
                'analyzing_information': { message: 'Analyzing business information...', percentage: 60 },
                'analyzing_reviews': { message: 'Analyzing reviews and ratings...', percentage: 70 },
                'analyzing_posts': { message: 'Analyzing posts and updates...', percentage: 80 },
                'analyzing_services': { message: 'Analyzing services...', percentage: 90 }
              };
              const progress = stageMessages[data.stage] || { message: data.stage, percentage: 0 };
              setProgress(progress);
            } else if (data.type === 'error') {
              throw new Error(data.error);
            } else if (data.type === 'result') {
              setResult(data.data);
              setScore(data.data.score);
              // Save score to localStorage
              localStorage.setItem('googleBusinessAuditScore', JSON.stringify(data.data.score));
            }
          } catch (e) {
            console.error('Error parsing line:', line, e);
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Function to recalculate score when criteria are toggled
  const recalculateScore = (category: string, item: string, completed: boolean) => {
    if (!editableScore) return;

    const newDetails = { ...editableScore.details };
    newDetails[category].items[item] = completed;
    
    // Recalculate category score
    const categoryItems = newDetails[category].items;
    const categoryScore = Object.values(categoryItems).filter(Boolean).length;
    newDetails[category].score = categoryScore;

    // Recalculate total score
    const totalPoints = Object.values(newDetails).reduce((sum, cat) => sum + cat.score, 0);
    const maxPoints = Object.values(newDetails).reduce((sum, cat) => sum + cat.maxScore, 0);

    setEditableScore({
      totalPoints,
      maxPoints,
      percentage: Math.round((totalPoints / maxPoints) * 100),
      details: newDetails
    });
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Google Business Profile Audit
          </h1>
          <p className="text-xl text-gray-600 flex items-center justify-center gap-2">
            Get personalized recommendations to improve your Google Business Profile
            <Link href="/google-business-scoring" className="group relative ml-2" aria-label="Learn more about scoring criteria">
              <svg className="w-6 h-6 text-[#4285F4] hover:text-[#3367D6] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-sm text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Learn more about scoring criteria
              </span>
            </Link>
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
              How to Find Your Google Business Profile URL
            </h2>
            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>Go to Google Maps</li>
                <li>Search for your business name</li>
                <li>Click on your business listing</li>
                <li>Copy the URL from your browser&apos;s address bar</li>
              </ol>
              <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
                Note: The URL should look something like: https://www.google.com/maps/place/Your+Business+Name
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="google-business-url" className="block text-sm font-medium text-gray-700 mb-2">
                Google Business Profile URL
              </label>
              <input
                type="text"
                id="google-business-url"
                name="url"
                value={url}
                onChange={handleUrlChange}
                placeholder="https://www.google.com/maps/place/Your+Business+Name"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-[#1C6B62] focus:border-[#1C6B62]"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#1C6B62] hover:bg-[#15554D] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1C6B62] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Analyzing...' : 'Start Analysis'}
            </button>
          </form>

          {loading && (
            <div className="mt-8">
              <ProgressBar />
              <p className="text-center text-gray-600">{progress.message}</p>
            </div>
          )}
        </div>

        {result && editableScore && (
          <div id="results" className="max-w-2xl mx-auto mt-8 sm:mt-12 bg-white rounded-xl shadow-lg p-4 sm:p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Analysis Results
            </h2>
            
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold text-gray-900 mb-2">
                Your Google Business Profile Score
              </h3>
              <div className="text-5xl font-bold text-[#4285F4]">
                {editableScore.percentage}%
              </div>
              <p className="text-gray-600 mt-2">
                {editableScore.totalPoints} out of {editableScore.maxPoints} points
              </p>
            </div>

            <div className="space-y-8">
              {Object.entries(editableScore.details).map(([category, data]) => (
                <div key={category} className="border-b border-gray-200 pb-6 last:border-0">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    {category}
                  </h3>
                  <div className="space-y-4">
                    {Object.entries(data.items).map(([item, completed]) => (
                      <div key={item} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={completed}
                          onChange={(e) => recalculateScore(category, item, e.target.checked)}
                          className="h-5 w-5 text-[#4285F4] border-gray-300 rounded focus:ring-[#4285F4]"
                        />
                        <label className="ml-3 text-gray-700">
                          {item}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Recommendations
              </h3>
              <div className="space-y-6">
                {result.recommendations.map((rec: Recommendation, index: number) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      {rec.category}
                    </h4>
                    {rec.strengths.length > 0 && (
                      <div className="mb-3">
                        <h5 className="text-sm font-medium text-gray-700 mb-1">
                          Strengths:
                        </h5>
                        <ul className="list-disc list-inside text-sm text-gray-600">
                          {rec.strengths.map((strength: string, i: number) => (
                            <li key={i}>{strength}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {rec.suggestions.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-1">
                          Suggestions:
                        </h5>
                        <ul className="list-disc list-inside text-sm text-gray-600">
                          {rec.suggestions.map((suggestion: string, i: number) => (
                            <li key={i}>{suggestion}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 text-center">
              <Link
                href="/"
                className="text-[#1C6B62] hover:text-[#15554D] transition-colors"
              >
                ← Back to Home
              </Link>
            </div>
          </div>
        )}

        <div className="mt-8 text-center text-gray-600">
          <p>Powered by <a href="https://glammatic.com" className="text-[#1C6B62] hover:underline" target="_blank" rel="noopener noreferrer">Glammatic.com</a></p>
        </div>
      </div>
    </main>
  );
} 