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

export const WEBSITE_SCORING_CRITERIA: ScoringCriteria[] = [
  {
    category: "Technical SEO",
    items: [
      "Page load speed is under 2 seconds",
      "Mobile-friendly design",
      "Core Web Vitals pass",
      "No broken links"
    ]
  },
  {
    category: "On-Page SEO",
    items: [
      "Meta title is optimized (50-60 characters)",
      "Meta description is optimized (150-160 characters)",
      "H1 tags are properly used",
      "Keyword presence in content is high",
      "Alt text coverage for images is high"
    ]
  },
  {
    category: "Content Completeness",
    items: [
      "Services are listed and described",
      "High-quality images are used",
      "Staff bios are present",
      "Testimonials are included",
      "Blog or news section is present"
    ]
  },
  {
    category: "Branding Consistency",
    items: [
      "Logo is present and consistent",
      "Color usage is consistent",
      "Typography is consistent",
      "Tone of voice is consistent"
    ]
  },
  {
    category: "Social & Contact Integration",
    items: [
      "Social media links are present",
      "Contact form is functional",
      "Booking integration is present"
    ]
  },
  {
    category: "Security & Accessibility",
    items: [
      "HTTPS is enabled",
      "ARIA tags are used",
      "Alt text is present for images",
      "Contrast compliance is met"
    ]
  }
]; 