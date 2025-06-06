export interface ScoringCriteria {
  category: string;
  items: string[];
}

export interface ScoringResult {
  totalPoints: number;
  maxPoints: number;
  percentage: number;
  details: {
    [key: string]: {
      score: number;
      maxScore: number;
      items: {
        [key: string]: boolean;
      };
    };
  };
}

export const GOOGLE_BUSINESS_SCORING_CRITERIA: ScoringCriteria[] = [
  {
    category: "Profile Completeness",
    items: [
      "Business name is accurate and consistent",
      "Business category is correctly set",
      "Business hours are up to date",
      "Business description is complete",
      "Business location is accurate"
    ]
  },
  {
    category: "Visual Content",
    items: [
      "Profile photo is high quality",
      "Cover photo is present and relevant",
      "Business photos showcase services/products",
      "Regular photo updates",
      "Photo quality and variety"
    ]
  },
  {
    category: "Reviews & Ratings",
    items: [
      "High average rating (4+ stars)",
      "Regular review responses",
      "Review response rate",
      "Review quality and detail",
      "Review recency"
    ]
  },
  {
    category: "Posts & Updates",
    items: [
      "Regular post frequency",
      "Post variety and relevance",
      "Post engagement",
      "Post call-to-actions",
      "Post visual quality"
    ]
  },
  {
    category: "Local SEO",
    items: [
      "Keywords in business description",
      "Local area keywords",
      "Service area defined",
      "NAP consistency",
      "Local citations"
    ]
  },
  {
    category: "Engagement & Interaction",
    items: [
      "Message response rate",
      "Question response rate",
      "User interaction",
      "Post engagement",
      "Review interaction"
    ]
  }
]; 