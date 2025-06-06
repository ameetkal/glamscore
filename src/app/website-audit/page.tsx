"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { WEBSITE_SCORING_CRITERIA, ScoringResult } from '@/types/website';

interface Recommendation {
  category: string;
  suggestions: string[];
  strengths: string[];
  status: 'green' | 'yellow' | 'red';
}

interface CoreWebVitals {
  lcp: number;
  fid: number;
  cls: number;
}

interface AuditMetrics {
  technicalSeo: {
    pageLoadSpeed: number;
    mobileFriendly: boolean;
    coreWebVitals: CoreWebVitals;
    brokenLinks: number;
    status: 'green' | 'yellow' | 'red';
    score: number;
  };
  onPageSeo: {
    metaTitle: string;
    metaDescription: string;
    h1Tags: string[];
    keywordPresence: number;
    altTextCoverage: number;
    status: 'green' | 'yellow' | 'red';
    score: number;
  };
  contentCompleteness: {
    servicesListed: boolean;
    imageQuality: number;
    staffBios: boolean;
    testimonials: boolean;
    blog: boolean;
    status: 'green' | 'yellow' | 'red';
    score: number;
  };
  brandingConsistency: {
    logo: boolean;
    colorUsage: boolean;
    typography: boolean;
    consistentTone: boolean;
    status: 'green' | 'yellow' | 'red';
    score: number;
  };
  socialContactIntegration: {
    socialMediaLinks: boolean;
    contactForm: boolean;
    bookingIntegration: boolean;
    status: 'green' | 'yellow' | 'red';
    score: number;
  };
  securityAccessibility: {
    https: boolean;
    ariaTags: boolean;
    altText: boolean;
    contrastCompliance: boolean;
    status: 'green' | 'yellow' | 'red';
    score: number;
  };
  overallScore: number;
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
  stage: string;
  message: string;
  percentage: number;
}

interface ScoringCriteria {
  maxPoints: number;
  criteria: {
    [key: string]: {
      weight: number;
      thresholds: {
        green: number;
        yellow: number;
        red: number;
      };
      description: string;
    };
  };
}

const scoringSystem: Record<keyof Omit<AuditMetrics, 'overallScore'>, ScoringCriteria> = {
  technicalSeo: {
    maxPoints: 30,
    criteria: {
      pageLoadSpeed: {
        weight: 10,
        thresholds: {
          green: 2000, // 2 seconds or less
          yellow: 4000, // 4 seconds
          red: 4000 // More than 4 seconds
        },
        description: 'Page load time in milliseconds'
      },
      mobileFriendly: {
        weight: 5,
        thresholds: {
          green: 1, // Fully responsive
          yellow: 0.5, // Partially responsive
          red: 0 // Not responsive
        },
        description: 'Mobile responsiveness score'
      },
      coreWebVitals: {
        weight: 10,
        thresholds: {
          green: 0.9, // All vitals pass
          yellow: 0.6, // Some vitals pass
          red: 0.3 // Most vitals fail
        },
        description: 'Core Web Vitals performance'
      },
      brokenLinks: {
        weight: 5,
        thresholds: {
          green: 0, // No broken links
          yellow: 5, // 1-5 broken links
          red: 5 // More than 5 broken links
        },
        description: 'Number of broken links'
      }
    }
  },
  onPageSeo: {
    maxPoints: 20,
    criteria: {
      metaTitle: {
        weight: 4,
        thresholds: {
          green: 1, // Perfect title (50-60 chars, includes keywords)
          yellow: 0.5, // Acceptable title
          red: 0 // Missing or poor title
        },
        description: 'Meta title optimization'
      },
      metaDescription: {
        weight: 4,
        thresholds: {
          green: 1, // Perfect description (150-160 chars, includes keywords)
          yellow: 0.5, // Acceptable description
          red: 0 // Missing or poor description
        },
        description: 'Meta description optimization'
      },
      h1Tags: {
        weight: 4,
        thresholds: {
          green: 1, // Perfect H1 structure
          yellow: 0.5, // Acceptable H1 structure
          red: 0 // Poor H1 structure
        },
        description: 'H1 tag optimization'
      },
      keywordPresence: {
        weight: 4,
        thresholds: {
          green: 80, // 80-100% keyword coverage
          yellow: 50, // 50-79% keyword coverage
          red: 50 // Less than 50% keyword coverage
        },
        description: 'Keyword presence in content'
      },
      altTextCoverage: {
        weight: 4,
        thresholds: {
          green: 90, // 90-100% images have alt text
          yellow: 60, // 60-89% images have alt text
          red: 60 // Less than 60% images have alt text
        },
        description: 'Alt text coverage for images'
      }
    }
  },
  contentCompleteness: {
    maxPoints: 20,
    criteria: {
      servicesListed: {
        weight: 4,
        thresholds: {
          green: 1, // Services are listed and described
          yellow: 0.5, // Services are listed but not described
          red: 0 // Services are not listed
        },
        description: 'Services are listed and described'
      },
      imageQuality: {
        weight: 4,
        thresholds: {
          green: 1, // High-quality images
          yellow: 0.5, // Acceptable image quality
          red: 0 // Poor image quality
        },
        description: 'Image quality'
      },
      staffBios: {
        weight: 4,
        thresholds: {
          green: 1, // Staff bios are present
          yellow: 0.5, // Partial staff bios
          red: 0 // No staff bios
        },
        description: 'Staff bios'
      },
      testimonials: {
        weight: 4,
        thresholds: {
          green: 1, // Testimonials are included
          yellow: 0.5, // Partial testimonials
          red: 0 // No testimonials
        },
        description: 'Testimonials'
      },
      blog: {
        weight: 4,
        thresholds: {
          green: 1, // Blog or news section is present
          yellow: 0.5, // Partial blog or news section
          red: 0 // No blog or news section
        },
        description: 'Blog or news section'
      }
    }
  },
  brandingConsistency: {
    maxPoints: 20,
    criteria: {
      logo: {
        weight: 5,
        thresholds: {
          green: 1, // Logo is present and consistent
          yellow: 0.5, // Logo is present but inconsistent
          red: 0 // No logo
        },
        description: 'Logo presence and consistency'
      },
      colorUsage: {
        weight: 5,
        thresholds: {
          green: 1, // Color usage is consistent
          yellow: 0.5, // Partial color consistency
          red: 0 // Inconsistent color usage
        },
        description: 'Color usage consistency'
      },
      typography: {
        weight: 5,
        thresholds: {
          green: 1, // Typography is consistent
          yellow: 0.5, // Partial typography consistency
          red: 0 // Inconsistent typography
        },
        description: 'Typography consistency'
      },
      consistentTone: {
        weight: 5,
        thresholds: {
          green: 1, // Tone of voice is consistent
          yellow: 0.5, // Partial tone consistency
          red: 0 // Inconsistent tone of voice
        },
        description: 'Tone of voice consistency'
      }
    }
  },
  socialContactIntegration: {
    maxPoints: 15,
    criteria: {
      socialMediaLinks: {
        weight: 5,
        thresholds: {
          green: 1, // Social media links are present
          yellow: 0.5, // Partial social media links
          red: 0 // No social media links
        },
        description: 'Social media links'
      },
      contactForm: {
        weight: 5,
        thresholds: {
          green: 1, // Contact form is functional
          yellow: 0.5, // Partial contact form
          red: 0 // No contact form
        },
        description: 'Contact form'
      },
      bookingIntegration: {
        weight: 5,
        thresholds: {
          green: 1, // Booking integration is present
          yellow: 0.5, // Partial booking integration
          red: 0 // No booking integration
        },
        description: 'Booking integration'
      }
    }
  },
  securityAccessibility: {
    maxPoints: 20,
    criteria: {
      https: {
        weight: 5,
        thresholds: {
          green: 1, // HTTPS is enabled
          yellow: 0.5, // Partial HTTPS
          red: 0 // No HTTPS
        },
        description: 'HTTPS'
      },
      ariaTags: {
        weight: 5,
        thresholds: {
          green: 1, // ARIA tags are used
          yellow: 0.5, // Partial ARIA tags
          red: 0 // No ARIA tags
        },
        description: 'ARIA tags'
      },
      altText: {
        weight: 5,
        thresholds: {
          green: 1, // Alt text is present for images
          yellow: 0.5, // Partial alt text
          red: 0 // No alt text
        },
        description: 'Alt text'
      },
      contrastCompliance: {
        weight: 5,
        thresholds: {
          green: 1, // Contrast compliance is met
          yellow: 0.5, // Partial contrast compliance
          red: 0 // No contrast compliance
        },
        description: 'Contrast compliance'
      }
    }
  }
};

function calculateCategoryScore(category: keyof typeof scoringSystem, metrics: any): number {
  const criteria = scoringSystem[category].criteria;
  let score = 0;
  for (const [key, value] of Object.entries(criteria)) {
    const metricValue = metrics[key];
    if (metricValue >= value.thresholds.green) {
      score += value.weight;
    } else if (metricValue >= value.thresholds.yellow) {
      score += value.weight * 0.5;
    }
  }
  return score;
}

function calculateOverallScore(metrics: AuditMetrics | null | undefined): number {
  if (!metrics) return 0;
  let totalScore = 0;
  let maxScore = 0;
  for (const [category, criteria] of Object.entries(scoringSystem)) {
    const categoryScore = calculateCategoryScore(category as keyof typeof scoringSystem, metrics[category as keyof AuditMetrics]);
    totalScore += categoryScore;
    maxScore += criteria.maxPoints;
  }
  return Math.round((totalScore / maxScore) * 100);
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

// Helper functions for progress updates
const getProgressPercentage = (stage: string): number => {
  const stages: Record<string, number> = {
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
  return stages[stage] || 0;
};

const getProgressMessage = (stage: string): string => {
  const messages: Record<string, string> = {
    initializing: 'Initializing analysis...',
    loading_website: 'Loading website...',
    analyzing_seo: 'Analyzing SEO elements...',
    analyzing_performance: 'Checking performance...',
    analyzing_mobile: 'Evaluating mobile experience...',
    analyzing_branding: 'Analyzing branding...',
    analyzing_social: 'Checking social media integration...',
    analyzing_contact: 'Verifying contact information...',
    analyzing_accessibility: 'Testing accessibility...',
    generating_recommendations: 'Generating recommendations...',
    complete: 'Analysis complete!'
  };
  return messages[stage] || 'Processing...';
};

export default function WebsiteAudit() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [progress, setProgress] = useState<AnalysisProgress>({
    stage: 'initializing',
    message: 'Initializing analysis...',
    percentage: 0
  });
  const [editableScore, setEditableScore] = useState<ScoringResult | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Add ProgressBar component inside WebsiteAudit to access progress state
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
    const savedAnalysis = localStorage.getItem('websiteAuditAnalysis');
    const savedScore = localStorage.getItem('websiteAuditScore');
    const savedUrl = localStorage.getItem('websiteAuditUrl');
    
    if (savedAnalysis && savedScore) {
      try {
        setAnalysis(JSON.parse(savedAnalysis));
        setEditableScore(JSON.parse(savedScore));
        if (savedUrl) {
          setUrl(savedUrl);
        }
      } catch (e) {
        console.error('Error loading saved state:', e);
        // Clear invalid saved state
        localStorage.removeItem('websiteAuditAnalysis');
        localStorage.removeItem('websiteAuditScore');
        localStorage.removeItem('websiteAuditUrl');
      }
    }
  }, []);

  // Save state when it changes
  useEffect(() => {
    if (analysis && editableScore) {
      localStorage.setItem('websiteAuditAnalysis', JSON.stringify(analysis));
      localStorage.setItem('websiteAuditScore', JSON.stringify(editableScore));
      if (url) {
        localStorage.setItem('websiteAuditUrl', url);
      }
    }
  }, [analysis, editableScore, url]);

  // Function to clear saved state
  const clearSavedState = () => {
    localStorage.removeItem('websiteAuditAnalysis');
    localStorage.removeItem('websiteAuditScore');
    localStorage.removeItem('websiteAuditUrl');
    setAnalysis(null);
    setEditableScore(null);
    setUrl('');
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setProgress({ stage: 'initializing', message: 'Starting analysis...', percentage: 0 });

    if (!url) {
      setError('Please enter a URL');
      setIsLoading(false);
      return;
    }

    const formattedUrl = formatUrl(url);
    if (!formattedUrl) {
      setError('Please enter a valid URL');
      setIsLoading(false);
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('url', formattedUrl);

    fetch('/api/website-audit', {
      method: 'POST',
      body: formDataToSend,
    })
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to analyze website');
        }

        if (!response.body) {
          throw new Error('No response body');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.trim()) continue;

            try {
              const data = JSON.parse(line);
              if (data.type === 'progress') {
                setProgress({
                  stage: data.stage,
                  message: data.message,
                  percentage: data.percentage
                });
              } else if (data.type === 'error') {
                throw new Error(data.error);
              } else if (data.type === 'result') {
                setAnalysis(data.data);
                setEditableScore(data.data.score);
                setIsLoading(false);
                // Scroll to results after a short delay to ensure DOM is updated
                setTimeout(() => {
                  const resultsElement = document.getElementById('results');
                  if (resultsElement) {
                    resultsElement.scrollIntoView({ behavior: 'smooth' });
                  }
                }, 100);
              }
            } catch (error) {
              console.error('Error parsing JSON:', error);
              throw new Error('Failed to parse server response');
            }
          }
        }
      })
      .catch((error) => {
        console.error('Error:', error);
        setError(error instanceof Error ? error.message : 'Failed to analyze website');
        setIsLoading(false);
      });
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
            Website Audit
          </h1>
          <p className="text-xl text-gray-600 flex items-center justify-center gap-2">
            Get personalized recommendations to improve your website
            <Link href="/website-scoring" className="group relative ml-2" aria-label="Learn more about scoring criteria">
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
              href="/google-business-audit" 
              className="text-[#1C6B62] hover:text-[#15554D] transition-colors"
            >
              Switch to Google Business Audit →
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              How to Find Your Website URL
            </h2>
            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>Go to your website</li>
                <li>Copy the URL from your browser's address bar</li>
                <li>Paste it into the input field below</li>
              </ol>
              <p className="text-sm text-gray-500 mt-4">
                Note: Make sure you&apos;re copying the URL from your website&apos;s homepage.
                The URL should look something like: https://www.yourwebsite.com
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="website-url" className="block text-sm font-medium text-gray-700 mb-2">
                Website URL
              </label>
              <input
                type="text"
                id="website-url"
                name="url"
                value={url}
                onChange={handleUrlChange}
                placeholder="https://www.yourwebsite.com"
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

        {analysis && editableScore && (
          <div id="results" className="max-w-2xl mx-auto mt-8 sm:mt-12 bg-white rounded-xl shadow-lg p-4 sm:p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Analysis Results
            </h2>
            
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold text-gray-900 mb-2">
                Your Website Score
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
                {analysis.recommendations.map((rec, index) => (
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
                          {rec.strengths.map((strength, i) => (
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