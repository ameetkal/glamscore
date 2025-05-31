"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Recommendation {
  category: string;
  suggestions: string[];
  strengths: string[];
}

interface Analysis {
  timestamp: string;
  recommendations: Recommendation[];
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
          </p>
          <div className="mt-4">
            <Link 
              href="/website-audit" 
              className="text-blue-600 hover:text-blue-800 transition-colors"
            >
              Switch to Website Audit →
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
              className="w-full bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
              disabled={isLoading || (!handle && !selectedFile)}
            >
              {isLoading ? 'Analyzing...' : 'Get Free Audit'}
            </button>
          </form>
        </div>

        {analysis && (
          <div className="max-w-2xl mx-auto mt-8 sm:mt-12 bg-white rounded-xl shadow-lg p-4 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
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

        <div className="mt-8 text-center text-gray-600">
          <p>Powered by <a href="https://glammatic.com" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Glammatic.com</a></p>
        </div>
      </div>
    </main>
  );
} 