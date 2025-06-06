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

export const INSTAGRAM_SCORING_CRITERIA: ScoringCriteria[] = [
  {
    category: "Profile Optimization",
    items: [
      "Profile picture quality and relevance",
      "Bio completeness and clarity",
      "Story highlights organization",
      "Link in bio optimization"
    ]
  },
  {
    category: "Content Strategy",
    items: [
      "Post frequency and consistency",
      "Content variety and quality",
      "Grid layout and aesthetics",
      "Caption quality and engagement"
    ]
  },
  {
    category: "Engagement",
    items: [
      "Response rate to comments",
      "Story engagement",
      "Community interaction",
      "Hashtag strategy"
    ]
  }
]; 