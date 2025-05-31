"use client";

import { useState } from 'react';
import Link from 'next/link';

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

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState<Analysis | null>(null);

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
    
    if (!selectedFile) {
      setError('Please upload a screenshot of your Instagram profile');
      return;
    }

    // Check file type
    if (!selectedFile.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    // Check file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size should be less than 5MB');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('screenshot', selectedFile);

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
            Salon Digital Audit
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Get personalized recommendations to improve your salon's online presence
          </p>
          <div className="flex justify-center space-x-8">
            <Link 
              href="/instagram-audit" 
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Instagram Profile Audit
            </Link>
            <Link 
              href="/website-audit" 
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Website Audit
            </Link>
          </div>
        </div>

        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Choose Your Audit Type
            </h2>
            <p className="text-gray-600">
              Select either an Instagram profile audit or website audit to get started.
              Each audit provides specific recommendations to help improve your salon's online presence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="border border-gray-200 rounded-lg p-6 hover:border-blue-500 transition-colors">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Instagram Profile Audit
              </h3>
              <p className="text-gray-600 mb-6">
                Upload a screenshot of your Instagram profile to get recommendations on:
              </p>
              <ul className="space-y-2 text-gray-600 mb-6">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Profile optimization</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Content strategy</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Engagement tactics</span>
                </li>
              </ul>
              <Link 
                href="/instagram-audit" 
                className="block w-full text-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                Start Instagram Audit
              </Link>
            </div>

            <div className="border border-gray-200 rounded-lg p-6 hover:border-blue-500 transition-colors">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Website Audit
              </h3>
              <p className="text-gray-600 mb-6">
                Enter your website URL or upload a screenshot to get recommendations on:
              </p>
              <ul className="space-y-2 text-gray-600 mb-6">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Design & user experience</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Content & information</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Business features</span>
                </li>
              </ul>
              <Link 
                href="/website-audit" 
                className="block w-full text-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                Start Website Audit
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-gray-600">
          <p>Powered by <a href="https://glammatic.com" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Glammatic.com</a></p>
        </div>
      </div>
    </main>
  );
}
