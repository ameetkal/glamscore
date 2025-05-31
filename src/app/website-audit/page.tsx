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
  stage: AnalysisStage;
  progress: number;
  message: string;
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
        description: 'Image alt text coverage'
      }
    }
  },
  contentCompleteness: {
    maxPoints: 25,
    criteria: {
      servicesListed: {
        weight: 8,
        thresholds: {
          green: 1, // All services listed with details
          yellow: 0.5, // Basic service list
          red: 0 // Missing or incomplete service list
        },
        description: 'Service listing completeness'
      },
      imageQuality: {
        weight: 5,
        thresholds: {
          green: 8, // 8-10/10 image quality
          yellow: 5, // 5-7/10 image quality
          red: 5 // Less than 5/10 image quality
        },
        description: 'Image quality score'
      },
      staffBios: {
        weight: 4,
        thresholds: {
          green: 1, // Complete staff profiles
          yellow: 0.5, // Basic staff information
          red: 0 // Missing staff information
        },
        description: 'Staff bio completeness'
      },
      testimonials: {
        weight: 4,
        thresholds: {
          green: 1, // Multiple verified testimonials
          yellow: 0.5, // Basic testimonials
          red: 0 // No testimonials
        },
        description: 'Testimonial presence and quality'
      },
      blog: {
        weight: 4,
        thresholds: {
          green: 1, // Active blog with quality content
          yellow: 0.5, // Basic blog presence
          red: 0 // No blog
        },
        description: 'Blog content quality and activity'
      }
    }
  },
  brandingConsistency: {
    maxPoints: 10,
    criteria: {
      logo: {
        weight: 3,
        thresholds: {
          green: 1, // Professional logo used consistently
          yellow: 0.5, // Basic logo usage
          red: 0 // No logo or inconsistent usage
        },
        description: 'Logo presence and consistency'
      },
      colorUsage: {
        weight: 2,
        thresholds: {
          green: 1, // Consistent brand colors
          yellow: 0.5, // Some color consistency
          red: 0 // Inconsistent color usage
        },
        description: 'Brand color consistency'
      },
      typography: {
        weight: 2,
        thresholds: {
          green: 1, // Consistent typography
          yellow: 0.5, // Basic typography consistency
          red: 0 // Inconsistent typography
        },
        description: 'Typography consistency'
      },
      consistentTone: {
        weight: 3,
        thresholds: {
          green: 1, // Consistent brand voice
          yellow: 0.5, // Some tone consistency
          red: 0 // Inconsistent tone
        },
        description: 'Brand voice consistency'
      }
    }
  },
  socialContactIntegration: {
    maxPoints: 10,
    criteria: {
      socialMediaLinks: {
        weight: 4,
        thresholds: {
          green: 1, // All social media linked
          yellow: 0.5, // Some social media linked
          red: 0 // No social media links
        },
        description: 'Social media integration'
      },
      contactForm: {
        weight: 3,
        thresholds: {
          green: 1, // Professional contact form
          yellow: 0.5, // Basic contact form
          red: 0 // No contact form
        },
        description: 'Contact form quality'
      },
      bookingIntegration: {
        weight: 3,
        thresholds: {
          green: 1, // Integrated booking system
          yellow: 0.5, // Basic booking option
          red: 0 // No booking option
        },
        description: 'Booking system integration'
      }
    }
  },
  securityAccessibility: {
    maxPoints: 5,
    criteria: {
      https: {
        weight: 1,
        thresholds: {
          green: 1, // HTTPS enabled
          yellow: 0, // No HTTPS
          red: 0 // No HTTPS
        },
        description: 'HTTPS implementation'
      },
      ariaTags: {
        weight: 1,
        thresholds: {
          green: 1, // ARIA tags implemented
          yellow: 0.5, // Some ARIA tags
          red: 0 // No ARIA tags
        },
        description: 'ARIA tag implementation'
      },
      altText: {
        weight: 1,
        thresholds: {
          green: 1, // All images have alt text
          yellow: 0.5, // Some images have alt text
          red: 0 // No alt text
        },
        description: 'Image alt text implementation'
      },
      contrastCompliance: {
        weight: 2,
        thresholds: {
          green: 1, // WCAG compliant
          yellow: 0.5, // Partially compliant
          red: 0 // Not compliant
        },
        description: 'Color contrast compliance'
      }
    }
  }
};

// Helper function to calculate category score
function calculateCategoryScore(category: keyof typeof scoringSystem, metrics: any): number {
  if (!metrics) return 0;
  
  const criteria = scoringSystem[category].criteria;
  let totalScore = 0;
  let maxPossibleScore = 0;

  Object.entries(criteria).forEach(([key, criterion]) => {
    // Skip if the metric doesn't exist in the data
    if (!(key in metrics)) {
      maxPossibleScore += criterion.weight;
      return;
    }

    const value = metrics[key];
    let score = 0;

    try {
      if (typeof value === 'boolean') {
        score = value ? criterion.weight : 0;
      } else if (typeof value === 'number') {
        if (key === 'coreWebVitals') {
          // Special handling for core web vitals
          const vitals = metrics.coreWebVitals as unknown as CoreWebVitals;
          if (vitals && typeof vitals === 'object') {
            const lcpScore = (vitals.lcp ?? 0) <= 2.5 ? 1 : (vitals.lcp ?? 0) <= 4 ? 0.5 : 0;
            const fidScore = (vitals.fid ?? 0) <= 100 ? 1 : (vitals.fid ?? 0) <= 300 ? 0.5 : 0;
            const clsScore = (vitals.cls ?? 0) <= 0.1 ? 1 : (vitals.cls ?? 0) <= 0.25 ? 0.5 : 0;
            score = ((lcpScore + fidScore + clsScore) / 3) * criterion.weight;
          }
        } else {
          // For other numeric values
          const numValue = value ?? 0;
          if (numValue >= criterion.thresholds.green) {
            score = criterion.weight;
          } else if (numValue >= criterion.thresholds.yellow) {
            score = criterion.weight * 0.5;
          } else {
            score = 0;
          }
        }
      }

      totalScore += score;
      maxPossibleScore += criterion.weight;
    } catch (error) {
      console.error(`Error calculating score for ${category}.${key}:`, error);
      maxPossibleScore += criterion.weight;
    }
  });

  return maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * scoringSystem[category].maxPoints : 0;
}

// Helper function to calculate overall score
function calculateOverallScore(metrics: AuditMetrics | null | undefined): number {
  if (!metrics) return 0;

  const categories = Object.keys(scoringSystem) as Array<keyof typeof scoringSystem>;
  let totalScore = 0;

  categories.forEach(category => {
    try {
      const categoryMetrics = metrics[category];
      if (categoryMetrics) {
        totalScore += calculateCategoryScore(category, categoryMetrics);
      }
    } catch (error) {
      console.error(`Error calculating score for category ${category}:`, error);
    }
  });

  return Math.round(totalScore);
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
      setError('Please provide your website URL');
      return;
    }

    try {
      const formattedUrl = formatUrl(url);
      new URL(formattedUrl);
      setUrl(formattedUrl);
    } catch (err) {
      setError('Please enter a valid website URL (e.g., example.com or www.example.com)');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('url', url);

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
          className="h-full transition-all duration-300 ease-in-out"
          style={{ width: `${progress.progress}%`, backgroundColor: '#1C6B62' }}
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
            Enter your beauty business&apos;s website URL to get personalized recommendations
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1C6B62] focus:border-[#1C6B62]"
                disabled={isLoading}
              />
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
              className="w-full bg-[#1C6B62] text-white px-8 py-3 rounded-lg hover:bg-[#15554D] transition-colors disabled:bg-[#1C6B62]/50 disabled:cursor-not-allowed"
              disabled={isLoading || !url}
            >
              {isLoading ? 'Analyzing...' : 'Get Free Audit'}
            </button>
          </form>
        </div>

        {analysis && (
          <div className="max-w-4xl mx-auto mt-12 bg-white rounded-xl shadow-lg p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Analysis Results
              </h2>
              <div className="flex items-center justify-between">
                <p className="text-gray-600">Overall Score</p>
                <div className="text-3xl font-bold text-[#1C6B62]">
                  {calculateOverallScore(analysis?.websiteAnalysis ?? null)}%
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {Object.entries(analysis.websiteAnalysis || {}).map(([category, metrics]) => {
                if (category === 'overallScore') return null;
                if (!metrics) return null;
                
                const categoryWeights = {
                  technicalSeo: 30,
                  onPageSeo: 20,
                  contentCompleteness: 25,
                  brandingConsistency: 10,
                  socialContactIntegration: 10,
                  securityAccessibility: 5
                };

                const categoryNames = {
                  technicalSeo: 'Technical SEO',
                  onPageSeo: 'On-Page SEO',
                  contentCompleteness: 'Content Completeness',
                  brandingConsistency: 'Branding Consistency',
                  socialContactIntegration: 'Social/Contact Integration',
                  securityAccessibility: 'Security & Accessibility'
                };

                const weight = categoryWeights[category as keyof typeof categoryWeights] ?? 0;
                const name = categoryNames[category as keyof typeof categoryNames] ?? category;
                const score = (metrics as any).score ?? 0;
                const status = (metrics as any).status ?? 'yellow';

                return (
                  <div key={category} className="bg-gray-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Weight: {weight}%
                        </p>
                      </div>
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-2 ${
                          status === 'green' ? 'bg-green-500' :
                          status === 'yellow' ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`} />
                        <span className="text-lg font-semibold text-[#1C6B62]">
                          {score.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-3 text-sm">
                      {Object.entries(metrics).map(([key, value]) => {
                        if (key === 'status' || key === 'score') return null;
                        
                        if (key === 'coreWebVitals') {
                          const vitals = value as CoreWebVitals;
                          if (!vitals) return null;
                          return (
                            <div key={key} className="space-y-2">
                              <p className="font-medium text-gray-700">Core Web Vitals:</p>
                              <div className="pl-4 space-y-1">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">LCP</span>
                                  <span className={(vitals.lcp ?? 0) <= 2.5 ? 'text-green-600' : 'text-red-600'}>
                                    {(vitals.lcp ?? 0).toFixed(2)}s
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">FID</span>
                                  <span className={(vitals.fid ?? 0) <= 100 ? 'text-green-600' : 'text-red-600'}>
                                    {(vitals.fid ?? 0).toFixed(0)}ms
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">CLS</span>
                                  <span className={(vitals.cls ?? 0) <= 0.1 ? 'text-green-600' : 'text-red-600'}>
                                    {(vitals.cls ?? 0).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        }

                        if (typeof value === 'boolean') {
                          return (
                            <div key={key} className="flex justify-between items-center">
                              <span className="text-gray-600 capitalize">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                              </span>
                              <span className={value ? 'text-green-600' : 'text-red-600'}>
                                {value ? '✓' : '✗'}
                              </span>
                            </div>
                          );
                        }

                        if (typeof value === 'number') {
                          return (
                            <div key={key} className="flex justify-between items-center">
                              <span className="text-gray-600 capitalize">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                              </span>
                              <span className="text-gray-900">
                                {key === 'pageLoadSpeed' ? `${(value ?? 0).toFixed(0)}ms` :
                                 key === 'keywordPresence' || key === 'altTextCoverage' ? `${(value ?? 0).toFixed(1)}%` :
                                 key === 'imageQuality' ? `${(value ?? 0).toFixed(1)}/10` :
                                 value ?? 0}
                              </span>
                            </div>
                          );
                        }

                        if (Array.isArray(value)) {
                          return (
                            <div key={key} className="flex justify-between items-center">
                              <span className="text-gray-600 capitalize">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                              </span>
                              <span className="text-gray-900">{value?.length ?? 0}</span>
                            </div>
                          );
                        }

                        if (typeof value === 'string') {
                          return (
                            <div key={key} className="flex justify-between items-center">
                              <span className="text-gray-600 capitalize">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                              </span>
                              <span className="text-gray-900 truncate max-w-[200px]">{value ?? ''}</span>
                            </div>
                          );
                        }

                        return null;
                      })}
                    </div>
                  </div>
                );
              })}
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
                      <h4 className="text-sm font-medium text-[#1C6B62] mb-2">
                        Recommendations
                      </h4>
                      <ul className="space-y-2">
                        {category.suggestions.map((suggestion, suggestionIndex) => (
                          <li key={suggestionIndex} className="flex items-start">
                            <span className="text-[#1C6B62] mr-2">•</span>
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