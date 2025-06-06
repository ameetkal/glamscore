"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ScoringResult, INSTAGRAM_SCORING_CRITERIA } from '@/types/instagram';

interface Recommendation {
  category: string;
  suggestions: string[];
  strengths: string[];
}

interface Analysis {
  timestamp: string;
  recommendations: Recommendation[];
  score: ScoringResult;
  imageAnalysis: {
    hasProfilePicture: boolean;
    hasBio: boolean;
    hasHighlights: boolean;
    postCount: number;
    gridLayout: string;
  };
}

export default function InstagramAudit() {
  const [handle, setHandle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [editableScore, setEditableScore] = useState<ScoringResult | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Load saved state on component mount
  useEffect(() => {
    const savedAnalysis = localStorage.getItem('instagramAuditAnalysis');
    const savedScore = localStorage.getItem('instagramAuditScore');
    const savedHandle = localStorage.getItem('instagramAuditHandle');
    
    if (savedAnalysis && savedScore) {
      try {
        setAnalysis(JSON.parse(savedAnalysis));
        setEditableScore(JSON.parse(savedScore));
        if (savedHandle) {
          setHandle(savedHandle);
        }
      } catch (e) {
        console.error('Error loading saved state:', e);
        // Clear invalid saved state
        localStorage.removeItem('instagramAuditAnalysis');
        localStorage.removeItem('instagramAuditScore');
        localStorage.removeItem('instagramAuditHandle');
      }
    }
  }, []);

  // Save state when it changes
  useEffect(() => {
    if (analysis && editableScore) {
      localStorage.setItem('instagramAuditAnalysis', JSON.stringify(analysis));
      localStorage.setItem('instagramAuditScore', JSON.stringify(editableScore));
      if (handle) {
        localStorage.setItem('instagramAuditHandle', handle);
      }
    }
  }, [analysis, editableScore, handle]);

  // Function to clear saved state
  const clearSavedState = () => {
    localStorage.removeItem('instagramAuditAnalysis');
    localStorage.removeItem('instagramAuditScore');
    localStorage.removeItem('instagramAuditHandle');
    setAnalysis(null);
    setEditableScore(null);
    setHandle('');
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleHandleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove @ symbol if user includes it
    const value = e.target.value.replace('@', '');
    setHandle(value);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setAnalysis(null);
    setEditableScore(null);
    
    if (!handle && !selectedFile) {
      setError('Please provide either an Instagram handle or upload a screenshot');
      return;
    }

    if (selectedFile && !selectedFile.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    if (selectedFile && selectedFile.size > 5 * 1024 * 1024) {
      setError('File size should be less than 5MB');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const formData = new FormData();
      if (handle) formData.append('handle', handle);
      if (selectedFile) formData.append('screenshot', selectedFile);

      const response = await fetch('/api/audit', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze profile');
      }

      setAnalysis(data.data);
      setEditableScore(data.data.score);

      // Scroll to results after a short delay to ensure the content is rendered
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
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
    const totalPoints = Object.values(newDetails).reduce((sum, category) => sum + category.score, 0);
    const maxPoints = Object.values(newDetails).reduce((sum, category) => sum + category.maxScore, 0);

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
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            GlamScore Instagram Profile Audit
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get personalized recommendations to improve your beauty business&apos;s online presence
            <Link 
              href="/instagram-scoring" 
              className="inline-block ml-2 group relative"
              aria-label="Learn more about scoring criteria"
            >
              <svg 
                className="w-5 h-5 text-[#1C6B62] hover:text-[#15554D] transition-colors" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
              <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-sm text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Learn more about scoring criteria
              </span>
            </Link>
          </p>
          <div className="mt-4 space-x-4">
            <Link 
              href="/website-audit" 
              className="text-[#1C6B62] hover:text-[#15554D] transition-colors"
            >
              Switch to Website Audit →
            </Link>
            <Link 
              href="/google-business-audit" 
              className="text-[#1C6B62] hover:text-[#15554D] transition-colors"
            >
              Switch to Google Business Audit →
            </Link>
          </div>
        </div>

        <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label 
                htmlFor="handle" 
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Instagram Handle
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">@</span>
                </div>
                <input
                  type="text"
                  id="handle"
                  name="handle"
                  value={handle}
                  onChange={handleHandleChange}
                  placeholder="your-salon-handle"
                  className="w-full pl-8 px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isLoading}
                  inputMode="text"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                />
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or</span>
              </div>
            </div>

            <div>
              <label 
                htmlFor="screenshot" 
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Upload Profile Screenshot
              </label>
              <div className="mt-1 flex justify-center px-4 sm:px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-500 transition-colors">
                <div className="space-y-2 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="flex flex-col sm:flex-row text-sm text-gray-600 items-center justify-center gap-2">
                    <label
                      htmlFor="screenshot"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500 px-4 py-2"
                    >
                      <span>Upload a file</span>
                      <input
                        id="screenshot"
                        name="screenshot"
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={handleFileChange}
                        disabled={isLoading}
                      />
                    </label>
                    <p className="text-gray-500">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, GIF up to 5MB
                  </p>
                </div>
              </div>
              {previewUrl && (
                <div className="mt-4 relative w-full h-48">
                  <Image
                    src={previewUrl}
                    alt="Preview"
                    fill
                    className="object-contain rounded-lg shadow-sm"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
              )}
              {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
              )}
            </div>
            <button
              type="submit"
              className="w-full bg-[#1C6B62] text-white px-8 py-3 rounded-lg hover:bg-[#15554D] transition-colors disabled:bg-[#1C6B62]/50 disabled:cursor-not-allowed"
              disabled={isLoading || (!handle && !selectedFile)}
            >
              {isLoading ? 'Analyzing...' : 'Get Free Audit'}
            </button>
          </form>
        </div>

        {analysis && editableScore && (
          <div ref={resultsRef} className="max-w-2xl mx-auto mt-8 sm:mt-12 bg-white rounded-xl shadow-lg p-4 sm:p-8">
            <div className="flex justify-between items-center mb-8">
              <div className="text-center flex-grow">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Your Instagram Score
                </h2>
                <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-r from-[#E1306C] to-[#833AB4] text-white">
                  <span className="text-4xl font-bold">{editableScore.percentage}%</span>
                </div>
                <p className="mt-4 text-gray-600">
                  {editableScore.totalPoints} out of {editableScore.maxPoints} points
                </p>
                <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
                  We use AI to analyze your profile, so some items may be incorrectly scored. Click the checkboxes to adjust any items that don't match your profile.
                </p>
              </div>
              <button
                onClick={clearSavedState}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                title="Start a new audit"
              >
                New Audit
              </button>
            </div>

            <div className="space-y-6">
              {Object.entries(editableScore.details).map(([category, details]) => (
                <div key={category} className="border-b border-gray-200 pb-4 last:border-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {category}
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(details.items).map(([item, completed]) => (
                      <div key={item} className="flex items-center group">
                        <input
                          type="checkbox"
                          checked={completed}
                          onChange={() => recalculateScore(category, item, !completed)}
                          className="w-4 h-4 text-[#E1306C] border-gray-300 rounded focus:ring-[#E1306C]"
                        />
                        <span className="ml-2 text-gray-600 group-hover:text-gray-900 transition-colors">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 mt-8">
              Analysis Results
            </h2>
            
            <div className="space-y-6 sm:space-y-8">
              {analysis.recommendations.map((category, index) => (
                <div key={index} className="border-b border-gray-200 pb-4 sm:pb-6 last:border-0">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">
                    {category.category}
                  </h3>
                  
                  {category.strengths.length > 0 && (
                    <div className="mb-3 sm:mb-4">
                      <h4 className="text-sm font-medium text-green-600 mb-2">
                        What's Working Well
                      </h4>
                      <ul className="space-y-1.5 sm:space-y-2">
                        {category.strengths.map((strength, strengthIndex) => (
                          <li key={strengthIndex} className="flex items-start text-sm sm:text-base">
                            <span className="text-green-500 mr-2 mt-1">✓</span>
                            <span className="text-gray-600">{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {category.suggestions.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-blue-600 mb-2">
                        Recommendations
                      </h4>
                      <ul className="space-y-1.5 sm:space-y-2">
                        {category.suggestions.map((suggestion, suggestionIndex) => (
                          <li key={suggestionIndex} className="flex items-start text-sm sm:text-base">
                            <span className="text-blue-600 mr-2 mt-1">•</span>
                            <span className="text-gray-600">{suggestion}</span>
                          </li>
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
    </main>
  );
} 