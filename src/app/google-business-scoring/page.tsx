"use client";

import Link from 'next/link';
import { GOOGLE_BUSINESS_SCORING_CRITERIA } from '@/types/google-business';

export default function GoogleBusinessScoring() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Google Business Profile Scoring Criteria
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Understand how we evaluate your Google Business Profile's effectiveness
          </p>
          <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">How Scoring Works</h2>
            <div className="text-left space-y-4 text-gray-600">
              <p>
                Our scoring system evaluates your Google Business Profile across six key categories: Profile Completeness, Visual Content, Reviews & Ratings, Posts & Updates, Local SEO, and Engagement & Interaction. Each category contains specific criteria that contribute to your overall score.
              </p>
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900">Scoring Rules:</h3>
                <ul className="list-disc list-inside space-y-2">
                  <li>Each criterion is worth 1 point</li>
                  <li>Criteria are evaluated as either complete (1 point) or incomplete (0 points)</li>
                  <li>Your total score is calculated as: (Points Earned ÷ Total Possible Points) × 100</li>
                  <li>The final score is displayed as a percentage</li>
                </ul>
              </div>
              <p>
                After the initial AI analysis, you can manually adjust any criteria that may have been incorrectly evaluated. This ensures you get the most accurate score possible for your Google Business Profile.
              </p>
            </div>
          </div>
          <div className="mt-4">
            <Link 
              href="/google-business-audit" 
              className="text-[#4285F4] hover:text-[#3367D6] transition-colors"
            >
              ← Back to Google Business Audit
            </Link>
          </div>
        </div>

        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-8">
          <div className="space-y-8">
            {GOOGLE_BUSINESS_SCORING_CRITERIA.map((category, index) => (
              <div key={index} className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-900">{category.category}</h2>
                <ol className="list-decimal list-inside space-y-4 text-gray-600">
                  {category.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="ml-4">{item}</li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
} 