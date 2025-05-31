"use client";

import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            GlamScore Digital Audit
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Get personalized recommendations to improve your beauty business&apos;s online presence
          </p>
          <div className="flex justify-center space-x-4 flex-wrap">
            <Link 
              href="/instagram-audit" 
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#1C6B62] hover:bg-[#15554D] transition-colors mb-4"
            >
              Instagram Profile Audit
            </Link>
            <Link 
              href="/website-audit" 
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#1C6B62] hover:bg-[#15554D] transition-colors mb-4"
            >
              Website Audit
            </Link>
            <Link 
              href="/google-business-audit" 
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#1C6B62] hover:bg-[#15554D] transition-colors mb-4"
            >
              Google Business Audit
            </Link>
          </div>
        </div>

        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Choose Your Audit Type
            </h2>
            <p className="text-gray-600">
              Select an audit type to get started. Each audit provides specific recommendations
              to help improve your beauty business&apos;s online presence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="border border-gray-200 rounded-lg p-6 hover:border-[#1C6B62] transition-colors">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Instagram Profile Audit
              </h3>
              <p className="text-gray-600 mb-6">
                Upload a screenshot of your Instagram profile to get recommendations on:
              </p>
              <ul className="space-y-2 text-gray-600 mb-6">
                <li className="flex items-start">
                  <span className="text-[#1C6B62] mr-2">•</span>
                  <span>Profile optimization</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#1C6B62] mr-2">•</span>
                  <span>Content strategy</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#1C6B62] mr-2">•</span>
                  <span>Engagement tactics</span>
                </li>
              </ul>
              <Link 
                href="/instagram-audit" 
                className="block w-full text-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#1C6B62] hover:bg-[#15554D] transition-colors"
              >
                Start Instagram Audit
              </Link>
            </div>

            <div className="border border-gray-200 rounded-lg p-6 hover:border-[#1C6B62] transition-colors">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Website Audit
              </h3>
              <p className="text-gray-600 mb-6">
                Enter your website URL or upload a screenshot to get recommendations on:
              </p>
              <ul className="space-y-2 text-gray-600 mb-6">
                <li className="flex items-start">
                  <span className="text-[#1C6B62] mr-2">•</span>
                  <span>Design & user experience</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#1C6B62] mr-2">•</span>
                  <span>Content & information</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#1C6B62] mr-2">•</span>
                  <span>Business features</span>
                </li>
              </ul>
              <Link 
                href="/website-audit" 
                className="block w-full text-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#1C6B62] hover:bg-[#15554D] transition-colors"
              >
                Start Website Audit
              </Link>
            </div>

            <div className="border border-gray-200 rounded-lg p-6 hover:border-[#1C6B62] transition-colors">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Google Business Audit
              </h3>
              <p className="text-gray-600 mb-6">
                Enter your Google Business Profile URL or upload a screenshot to get recommendations on:
              </p>
              <ul className="space-y-2 text-gray-600 mb-6">
                <li className="flex items-start">
                  <span className="text-[#1C6B62] mr-2">•</span>
                  <span>Profile optimization</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#1C6B62] mr-2">•</span>
                  <span>Review management</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#1C6B62] mr-2">•</span>
                  <span>Local SEO tactics</span>
                </li>
              </ul>
              <Link 
                href="/google-business-audit" 
                className="block w-full text-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#1C6B62] hover:bg-[#15554D] transition-colors"
              >
                Start Google Business Audit
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-gray-600">
          <p>Powered by <a href="https://glammatic.com" className="text-[#1C6B62] hover:underline" target="_blank" rel="noopener noreferrer">Glammatic.com</a></p>
        </div>
      </div>
    </main>
  );
}
