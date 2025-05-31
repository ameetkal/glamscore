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
            <div className="border border-gray-200 rounded-lg p-6 hover:border-[#E1306C] transition-colors relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#E1306C] to-[#833AB4] opacity-10 rounded-bl-full"></div>
              <div className="relative">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#E1306C] to-[#833AB4] rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Instagram Profile Audit
                  </h3>
                </div>
                <p className="text-gray-600 mb-6">
                  Upload a screenshot of your Instagram profile to get recommendations on:
                </p>
                <ul className="space-y-2 text-gray-600 mb-6">
                  <li className="flex items-start">
                    <span className="text-[#E1306C] mr-2">•</span>
                    <span>Profile optimization</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#E1306C] mr-2">•</span>
                    <span>Content strategy</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#E1306C] mr-2">•</span>
                    <span>Engagement tactics</span>
                  </li>
                </ul>
                <Link 
                  href="/instagram-audit" 
                  className="block w-full text-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-[#E1306C] to-[#833AB4] hover:from-[#C72A5D] hover:to-[#6B2F94] transition-colors"
                >
                  Start Instagram Audit
                </Link>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-6 hover:border-[#1C6B62] transition-colors relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#1C6B62] opacity-10 rounded-bl-full"></div>
              <div className="relative">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-[#1C6B62] rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Website Audit
                  </h3>
                </div>
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
            </div>

            <div className="border border-gray-200 rounded-lg p-6 hover:border-[#4285F4] transition-colors relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#4285F4] to-[#34A853] opacity-10 rounded-bl-full"></div>
              <div className="relative">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#4285F4] to-[#34A853] rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Google Business Audit
                  </h3>
                </div>
                <p className="text-gray-600 mb-6">
                  Enter your Google Business Profile URL or upload a screenshot to get recommendations on:
                </p>
                <ul className="space-y-2 text-gray-600 mb-6">
                  <li className="flex items-start">
                    <span className="text-[#4285F4] mr-2">•</span>
                    <span>Profile optimization</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#4285F4] mr-2">•</span>
                    <span>Review management</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#4285F4] mr-2">•</span>
                    <span>Local SEO tactics</span>
                  </li>
                </ul>
                <Link 
                  href="/google-business-audit" 
                  className="block w-full text-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-[#4285F4] to-[#34A853] hover:from-[#3367D6] hover:to-[#2E8B57] transition-colors"
                >
                  Start Google Business Audit
                </Link>
              </div>
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
