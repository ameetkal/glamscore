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
  seo: {
    metaTitle: string;
    metaDescription: string;
    h1Tags: string[];
    keywordDensity: number;
    hasSitemap: boolean;
    status: 'green' | 'yellow' | 'red';
  };
  performance: {
    loadTime: number;
    lighthouseScore: number;
    imageOptimization: boolean;
    status: 'green' | 'yellow' | 'red';
  };
  mobile: {
    isResponsive: boolean;
    touchElements: boolean;
    viewportMeta: boolean;
    status: 'green' | 'yellow' | 'red';
  };
  branding: {
    hasLogo: boolean;
    colorConsistency: boolean;
    fontConsistency: boolean;
    status: 'green' | 'yellow' | 'red';
  };
  social: {
    hasInstagram: boolean;
    hasFacebook: boolean;
    hasSocialFeeds: boolean;
    status: 'green' | 'yellow' | 'red';
  };
  contact: {
    hasPhone: boolean;
    hasEmail: boolean;
    hasLocation: boolean;
    hasBooking: boolean;
    status: 'green' | 'yellow' | 'red';
  };
  accessibility: {
    contrastRatio: number;
    hasAriaTags: boolean;
    hasAltTexts: boolean;
    status: 'green' | 'yellow' | 'red';
  };
}

interface Analysis {
  timestamp: string;
  recommendations: Recommendation[];
  websiteAnalysis: AuditMetrics;
}

// Add new type for progress tracking
type AnalysisStage = 
  | 'initializing'
  | 'loading_website'
  | 'analyzing_seo'
  | 'analyzing_performance'
  | 'analyzing_mobile'
  | 'analyzing_branding'
  | 'analyzing_social'
  | 'analyzing_contact'
  | 'analyzing_accessibility'
  | 'generating_recommendations'
  | 'complete';

interface AnalysisProgress {
  stage: AnalysisStage;
  progress: number;
  message: string;
}

function formatUrl(url: string): string {
  // Remove any whitespace
  url = url.trim();
  
  // If it's a naked domain (no protocol), add https://
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  
  // If it's a naked domain without www, add www.
  if (!url.includes('://www.') && !url.includes('://localhost')) {
    url = url.replace('://', '://www.');
  }
  
  return url;
}

export default function WebsiteAudit() {
  const [url, setUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [progress, setProgress] = useState<AnalysisProgress>({
    stage: 'initializing',
    progress: 0,
    message: 'Initializing analysis...'
  });

  // Add progress messages for each stage
  const progressMessages: Record<AnalysisStage, string> = {
    initializing: 'Initializing analysis...',
    loading_website: 'Loading website...',
    analyzing_seo: 'Analyzing SEO elements...',
    analyzing_performance: 'Checking performance metrics...',
    analyzing_mobile: 'Testing mobile responsiveness...',
    analyzing_branding: 'Evaluating branding consistency...',
    analyzing_social: 'Checking social media integration...',
    analyzing_contact: 'Verifying contact information...',
    analyzing_accessibility: 'Testing accessibility features...',
    generating_recommendations: 'Generating recommendations...',
    complete: 'Analysis complete!'
  };

  // Add progress percentages for each stage
  const progressPercentages: Record<AnalysisStage, number> = {
    initializing: 0,
    loading_website: 10,
    analyzing_seo: 20,
    analyzing_performance: 30,
    analyzing_mobile: 40,
    analyzing_branding: 50,
    analyzing_social: 60,
    analyzing_contact: 70,
    analyzing_accessibility: 80,
    generating_recommendations: 90,
    complete: 100
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
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
    
    if (!url && !selectedFile) {
      setError('Please provide either a website URL or upload a screenshot');
      return;
    }

    if (url) {
      try {
        // Format the URL before sending
        const formattedUrl = formatUrl(url);
        // Validate the formatted URL
        new URL(formattedUrl);
        setUrl(formattedUrl); // Update the input with the formatted URL
      } catch (err) {
        setError('Please enter a valid website URL (e.g., example.com or www.example.com)');
        return;
      }
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
      if (url) formData.append('url', url);
      if (selectedFile) formData.append('screenshot', selectedFile);

      const response = await fetch('/api/website-audit', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze website');
      }

      // Create a reader for the response stream
      const reader = response.body?.getReader();
      if (!reader) throw new Error('Failed to start analysis');

      let buffer = ''; // Buffer to store partial chunks

      // Read the stream
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          // Process any remaining data in the buffer
          if (buffer.trim()) {
            try {
              const data = JSON.parse(buffer);
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

        // Convert the chunk to text and add to buffer
        const chunk = new TextDecoder().decode(value);
        buffer += chunk;

        // Process complete JSON objects in the buffer
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep the last partial line in the buffer

        for (const line of lines) {
          if (!line.trim()) continue;
          
          try {
            const data = JSON.parse(line);
            console.log('Received data:', data); // Debug log

            if (data.type === 'progress' && typeof data.stage === 'string') {
              const stage = data.stage as AnalysisStage;
              if (stage in progressPercentages) {
                console.log('Updating progress:', stage); // Debug log
                setProgress({
                  stage,
                  progress: progressPercentages[stage],
                  message: progressMessages[stage]
                });
              }
            } else if (data.type === 'result') {
              console.log('Received final result'); // Debug log
              setAnalysis(data.data);
              setProgress({
                stage: 'complete',
                progress: 100,
                message: progressMessages.complete
              });
            } else if (data.type === 'error') {
              throw new Error(data.error || 'Analysis failed');
            }
          } catch (e) {
            console.error('Error parsing JSON:', e, 'Line:', line); // Debug log
            if (line.includes('error')) {
              throw new Error(line);
            }
          }
        }
      }
    } catch (err) {
      console.error('Analysis error:', err); // Debug log
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setProgress({
        stage: 'initializing',
        progress: 0,
        message: 'Analysis failed'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Add progress bar component
  const ProgressBar = () => (
    <div className="w-full space-y-2">
      <div className="flex justify-between text-sm text-gray-600">
        <span>{progress.message}</span>
        <span>{progress.progress}%</span>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 transition-all duration-300 ease-in-out"
          style={{ width: `${progress.progress}%` }}
        />
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            GlamScore Website Audit
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Enter your beauty business&apos;s website URL or upload a screenshot to get personalized recommendations
          </p>
          <div className="mt-4">
            <Link 
              href="/instagram-audit" 
              className="text-blue-600 hover:text-blue-800 transition-colors"
            >
              Switch to Instagram Profile Audit →
            </Link>
          </div>
        </div>

        <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label 
                htmlFor="url" 
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Website URL
              </label>
              <input
                type="text"
                id="url"
                name="url"
                value={url}
                onChange={handleUrlChange}
                placeholder="Enter your domain (e.g., example.com)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              />
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
                Upload Website Screenshot
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                <div className="space-y-1 text-center">
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
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="screenshot"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
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
                    <p className="pl-1">or drag and drop</p>
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
            {isLoading && (
              <div className="mt-4">
                <ProgressBar />
              </div>
            )}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
              disabled={isLoading || (!url && !selectedFile)}
            >
              {isLoading ? 'Analyzing...' : 'Get Free Audit'}
            </button>
          </form>
        </div>

        {analysis && (
          <div className="max-w-4xl mx-auto mt-12 bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Analysis Results
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {Object.entries(analysis.websiteAnalysis).map(([category, metrics]) => (
                <div key={category} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 capitalize">
                      {category}
                    </h3>
                    <div className={`w-3 h-3 rounded-full ${
                      metrics.status === 'green' ? 'bg-green-500' :
                      metrics.status === 'yellow' ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`} />
                  </div>
                  <div className="space-y-2 text-sm">
                    {Object.entries(metrics).map(([key, value]) => {
                      if (key === 'status') return null;
                      if (typeof value === 'boolean') {
                        return (
                          <div key={key} className="flex items-center justify-between">
                            <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                            <span className={value ? 'text-green-600' : 'text-red-600'}>
                              {value ? '✓' : '✗'}
                            </span>
                          </div>
                        );
                      }
                      if (typeof value === 'number') {
                        return (
                          <div key={key} className="flex items-center justify-between">
                            <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                            <span className="text-gray-900">
                              {key === 'loadTime' ? `${value}ms` :
                               key === 'keywordDensity' ? `${value.toFixed(1)}%` :
                               key === 'lighthouseScore' ? `${value.toFixed(0)}/100` :
                               value}
                            </span>
                          </div>
                        );
                      }
                      if (Array.isArray(value)) {
                        return (
                          <div key={key} className="flex items-center justify-between">
                            <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                            <span className="text-gray-900">{value.length}</span>
                          </div>
                        );
                      }
                      if (typeof value === 'string') {
                        return (
                          <div key={key} className="flex items-center justify-between">
                            <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                            <span className="text-gray-900 truncate max-w-[200px]">{value}</span>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-8">
              {analysis.recommendations.map((category, index) => (
                <div key={index} className="border-b border-gray-200 pb-6 last:border-0">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {category.category}
                    </h3>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      category.status === 'green' ? 'bg-green-100 text-green-800' :
                      category.status === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {category.status === 'green' ? 'Good' :
                       category.status === 'yellow' ? 'Needs Improvement' :
                       'Critical'}
                    </div>
                  </div>
                  
                  {category.strengths.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-green-600 mb-2">
                        What's Working Well
                      </h4>
                      <ul className="space-y-2">
                        {category.strengths.map((strength, strengthIndex) => (
                          <li key={strengthIndex} className="flex items-start">
                            <span className="text-green-500 mr-2">✓</span>
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
                      <ul className="space-y-2">
                        {category.suggestions.map((suggestion, suggestionIndex) => (
                          <li key={suggestionIndex} className="flex items-start">
                            <span className="text-blue-600 mr-2">•</span>
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