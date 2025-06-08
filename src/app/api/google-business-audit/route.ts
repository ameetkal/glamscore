import { NextRequest, NextResponse } from 'next/server';
import type { Page } from 'puppeteer';
import puppeteer from 'puppeteer';
import sharp from 'sharp';
import { GOOGLE_BUSINESS_SCORING_CRITERIA, ScoringResult } from '@/types/google-business';

interface ProgressData {
  message: string;
  percentage: number;
}

interface ErrorResponse {
  error: string;
  details?: unknown;
}

interface ReviewDetail {
  reviewText: string;
  hasResponse: boolean;
  rating: number;
}

interface ReviewsAnalysis {
  reviewElementsCount: number;
  reviewDetails: ReviewDetail[];
  averageRating: number;
  responseRate: number;
  reviewsAnalyzed: number;
  reviewsWithResponses: number;
}

const sendProgress = (stage: string, percentage: number): string => {
  const data: ProgressData = { message: stage, percentage };
  return JSON.stringify({ type: 'progress', data }) + '\n';
};

const sendError = (error: string, details?: unknown): string => {
  const response: ErrorResponse = { error };
  if (details) response.details = details;
  return JSON.stringify({ type: 'error', data: response });
};

// Helper function to analyze profile information
async function analyzeProfile(page: Page) {
  const profileInfo = await page.evaluate(() => {
    // Updated selectors for Google Maps business profile
    const name = document.querySelector('h1.DUwDvf')?.textContent?.trim() || '';
    const category = document.querySelector('button[jsaction*="category"]')?.textContent?.trim() || '';
    const description = document.querySelector('[data-item-id*="description"]')?.textContent?.trim() || 
                       document.querySelector('.editorial-summary')?.textContent?.trim() || '';
    
    return { name, category, description };
  });

  console.log('Profile Analysis:', profileInfo); // Debug log

  const status = 
    profileInfo.name && profileInfo.category && profileInfo.description
      ? 'green'
      : profileInfo.name && (profileInfo.category || profileInfo.description)
        ? 'yellow'
        : 'red';

  return {
    businessName: profileInfo.name,
    category: profileInfo.category,
    description: profileInfo.description,
    status
  };
}

// Helper function to analyze photos
async function analyzePhotos(page: Page) {
  const photoInfo = await page.evaluate(() => {
    // Updated selectors for Google Maps photos
    const photoElements = document.querySelectorAll('button[jsaction*="photos"] img, button[aria-label*="photo"] img, div[role="img"]');
    console.log('Found photo elements:', photoElements.length); // Debug log

    // More comprehensive photo analysis
    const photos = Array.from(photoElements).map(img => {
      const alt = img.getAttribute('alt')?.toLowerCase() || '';
      const ariaLabel = img.getAttribute('aria-label')?.toLowerCase() || '';
      const src = img.getAttribute('src') || '';
      const title = img.getAttribute('title')?.toLowerCase() || '';
      
      return {
        alt,
        ariaLabel,
        src,
        title,
        text: `${alt} ${ariaLabel} ${title}`.toLowerCase()
      };
    });

    console.log('Photo details:', photos); // Debug log

    const hasProfilePhoto = photos.some(photo => 
      photo.text.includes('profile') || 
      photo.text.includes('logo') ||
      photo.text.includes('business')
    );

    const hasCoverPhoto = photos.some(photo => 
      photo.text.includes('cover') || 
      photo.text.includes('banner') ||
      photo.text.includes('header')
    );

    const hasInteriorPhotos = photos.some(photo => 
      photo.text.includes('interior') || 
      photo.text.includes('inside') ||
      photo.text.includes('salon') ||
      photo.text.includes('spa') ||
      photo.text.includes('store') ||
      photo.text.includes('shop')
    );

    const hasExteriorPhotos = photos.some(photo => 
      photo.text.includes('exterior') || 
      photo.text.includes('outside') ||
      photo.text.includes('building') ||
      photo.text.includes('storefront') ||
      photo.text.includes('facade')
    );

    const totalPhotos = photos.length;
    
    return { 
      hasProfilePhoto, 
      hasCoverPhoto, 
      hasInteriorPhotos, 
      hasExteriorPhotos,
      totalPhotos,
      photoDetails: photos // Include for debugging
    };
  });

  console.log('Photos Analysis:', photoInfo); // Debug log

  const status = 
    photoInfo.hasProfilePhoto && photoInfo.hasCoverPhoto && (photoInfo.hasInteriorPhotos || photoInfo.hasExteriorPhotos) && photoInfo.totalPhotos >= 5
      ? 'green'
      : photoInfo.hasProfilePhoto && (photoInfo.hasCoverPhoto || photoInfo.hasInteriorPhotos || photoInfo.hasExteriorPhotos) && photoInfo.totalPhotos >= 3
        ? 'yellow'
        : 'red';

  return {
    ...photoInfo,
    status
  };
}

// Helper function to analyze business information
async function analyzeInformation(page: Page) {
  const info = await page.evaluate(() => {
    // Updated selectors for Google Maps business information
    const hours = !!document.querySelector('button[data-item-id*="hours"], button[aria-label*="hours"]');
    const phone = !!document.querySelector('button[data-item-id*="phone"], button[aria-label*="phone"], a[href^="tel:"]');
    const website = !!document.querySelector('a[data-item-id*="authority"], a[aria-label*="website"]');
    const address = !!document.querySelector('button[data-item-id*="address"], button[aria-label*="address"]');
    
    return { hours, phone, website, address };
  });

  console.log('Information Analysis:', info); // Debug log

  const status = 
    info.hours && info.phone && info.website && info.address
      ? 'green'
      : (info.hours || info.phone) && (info.website || info.address)
        ? 'yellow'
        : 'red';

  return {
    ...info,
    status
  };
}

// Helper function to analyze reviews
async function analyzeReviews(page: Page): Promise<ReviewsAnalysis> {
  try {
    // Wait for reviews to load
    await page.waitForSelector('.F7nice', { timeout: 10000 }).catch(() => null);
    
    // Get total reviews and average rating from the main business profile header
    const totalReviews = await page.$eval('.F7nice span[aria-label*="reviews"]', (el) => {
      const label = el.getAttribute('aria-label') || '';
      const match = label.match(/(\d+)\s+reviews/);
      return match ? parseInt(match[1]) : 0;
    }).catch(() => 0);

    const averageRating = await page.$eval('.F7nice span[aria-hidden="true"]', (el) => {
      return parseFloat(el.textContent || '0');
    }).catch(() => 0);

    console.log(`Profile shows ${totalReviews} total reviews with ${averageRating} average rating`);

    // Get all review elements from the main reviews section
    const reviewElements = await page.$$('.jftiEf');
    console.log(`Found ${reviewElements.length} review elements`);

    const reviewDetails: ReviewDetail[] = [];

    for (const element of reviewElements) {
      try {
        // Get review text
        const reviewText = await element.$eval('.wiI7pd', (el) => el.textContent || '').catch(() => '');
        
        // Check for response
        const responseElement = await element.$('.CDe7pd');
        const hasResponse = !!responseElement;
        
        // Get rating from star elements
        const starElements = await element.$$('.rFrJzc:not(.UpDOYb)');
        const rating = starElements.length;

        reviewDetails.push({
          reviewText,
          hasResponse,
          rating
        });
      } catch (error) {
        console.error('Error processing review element:', error);
      }
    }

    // Calculate response rate based on visible reviews
    const reviewsWithResponses = reviewDetails.filter(review => review.hasResponse).length;
    const reviewsAnalyzed = reviewDetails.length;
    const responseRate = totalReviews > 0 ? (reviewsWithResponses / totalReviews) * 100 : 0;

    const result = {
      reviewElementsCount: totalReviews, // Use the total from profile header
      reviewDetails,
      averageRating, // Use the average from profile header
      responseRate,
      reviewsAnalyzed, // Add number of reviews analyzed
      reviewsWithResponses // Add number of reviews with responses
    };

    console.log('Final reviews analysis result:', result);
    return result;
  } catch (error) {
    console.error('Error in analyzeReviews:', error);
    return {
      reviewElementsCount: 0,
      reviewDetails: [],
      averageRating: 0,
      responseRate: 0,
      reviewsAnalyzed: 0,
      reviewsWithResponses: 0
    };
  }
}

// Helper function to analyze posts
async function analyzePosts(page: Page) {
  const postInfo = await page.evaluate(() => {
    // Updated selectors for Google Maps posts
    const posts = document.querySelectorAll('div[role="article"], div[aria-label*="post"]');
    const hasPosts = posts.length > 0;
    const postFrequency = posts.length; // Posts in the last 30 days
    const postEngagement = Array.from(posts).reduce((total, post) => {
      const likes = parseInt(post.querySelector('span[aria-label*="likes"]')?.textContent?.replace(/[^0-9]/g, '') || '0');
      const comments = parseInt(post.querySelector('span[aria-label*="comments"]')?.textContent?.replace(/[^0-9]/g, '') || '0');
      return total + likes + comments;
    }, 0) / (posts.length || 1);
    
    return { hasPosts, postFrequency, postEngagement };
  });

  console.log('Posts Analysis:', postInfo); // Debug log

  const status = 
    postInfo.hasPosts && postInfo.postFrequency >= 4 && postInfo.postEngagement >= 10
      ? 'green'
      : postInfo.hasPosts && (postInfo.postFrequency >= 2 || postInfo.postEngagement >= 5)
        ? 'yellow'
        : 'red';

  return {
    ...postInfo,
    status
  };
}

// Helper function to analyze services
async function analyzeServices(page: Page) {
  const serviceInfo = await page.evaluate(() => {
    // Updated selectors for Google Maps services
    const services = document.querySelectorAll('div[role="listitem"], div[aria-label*="service"]');
    const hasServices = services.length > 0;
    const serviceCount = services.length;
    const hasPricing = Array.from(services).some(service => 
      !!service.querySelector('span[aria-label*="price"], span[aria-label*="cost"]')
    );
    
    return { hasServices, serviceCount, hasPricing };
  });

  console.log('Services Analysis:', serviceInfo); // Debug log

  const status = 
    serviceInfo.hasServices && serviceInfo.serviceCount >= 5 && serviceInfo.hasPricing
      ? 'green'
      : serviceInfo.hasServices && (serviceInfo.serviceCount >= 3 || serviceInfo.hasPricing)
        ? 'yellow'
        : 'red';

  return {
    ...serviceInfo,
    status
  };
}

// Helper function to generate recommendations
function generateRecommendations(analysis: any) {
  const recommendations = [];

  // Profile recommendations
  if (analysis.profile.status !== 'green') {
    recommendations.push({
      category: 'Profile Information',
      strengths: analysis.profile.status === 'yellow' ? ['Basic profile information is present'] : [],
      suggestions: [
        !analysis.profile.businessName && 'Add your business name',
        !analysis.profile.category && 'Select appropriate business categories',
        !analysis.profile.description && 'Add a detailed business description',
        'Ensure your business name matches your branding',
        'Keep your business description focused on your services and unique value proposition'
      ].filter(Boolean) as string[],
      status: analysis.profile.status
    });
  }

  // Photo recommendations
  if (analysis.photos.status !== 'green') {
    recommendations.push({
      category: 'Photos & Media',
      strengths: analysis.photos.status === 'yellow' ? ['Some photos are present'] : [],
      suggestions: [
        !analysis.photos.profilePhoto && 'Add a professional profile photo',
        !analysis.photos.coverPhoto && 'Add a cover photo showcasing your business',
        !analysis.photos.interiorPhotos && 'Add photos of your salon interior',
        !analysis.photos.exteriorPhotos && 'Add photos of your business exterior',
        'Ensure all photos are high quality and well-lit',
        'Update photos regularly to showcase your latest work'
      ].filter(Boolean) as string[],
      status: analysis.photos.status
    });
  }

  // Information recommendations
  if (analysis.information.status !== 'green') {
    recommendations.push({
      category: 'Business Information',
      strengths: analysis.information.status === 'yellow' ? ['Some contact information is present'] : [],
      suggestions: [
        !analysis.information.hours && 'Add your business hours',
        !analysis.information.phone && 'Add your business phone number',
        !analysis.information.website && 'Add your website URL',
        !analysis.information.address && 'Add your complete business address',
        'Keep your business hours up to date',
        'Ensure your phone number is clickable'
      ].filter(Boolean) as string[],
      status: analysis.information.status
    });
  }

  // Review recommendations
  if (analysis.reviews.status !== 'green') {
    recommendations.push({
      category: 'Reviews & Ratings',
      strengths: analysis.reviews.status === 'yellow' ? ['Some reviews are present'] : [],
      suggestions: [
        analysis.reviews.averageRating < 4.5 && 'Work on improving your average rating',
        analysis.reviews.totalReviews < 50 && 'Encourage more customers to leave reviews',
        analysis.reviews.responseRate < 80 && 'Respond to more customer reviews',
        'Respond to all reviews, especially negative ones',
        'Thank customers for positive reviews',
        'Address specific points mentioned in reviews'
      ].filter(Boolean) as string[],
      status: analysis.reviews.status
    });
  }

  // Post recommendations
  if (analysis.posts.status !== 'green') {
    recommendations.push({
      category: 'Posts & Updates',
      strengths: analysis.posts.status === 'yellow' ? ['Some posts are present'] : [],
      suggestions: [
        !analysis.posts.hasPosts && 'Start creating regular posts',
        analysis.posts.postFrequency < 4 && 'Increase your posting frequency',
        analysis.posts.postEngagement < 10 && 'Create more engaging content',
        'Post about special offers and promotions',
        'Share before/after photos of your work',
        'Post about new services or products'
      ].filter(Boolean) as string[],
      status: analysis.posts.status
    });
  }

  // Service recommendations
  if (analysis.services.status !== 'green') {
    recommendations.push({
      category: 'Services & Offerings',
      strengths: analysis.services.status === 'yellow' ? ['Some services are listed'] : [],
      suggestions: [
        !analysis.services.hasServices && 'Add your services to your profile',
        analysis.services.serviceCount < 5 && 'Add more services to your profile',
        !analysis.services.hasPricing && 'Add pricing information to your services',
        'Organize services into categories',
        'Add detailed descriptions for each service',
        'Keep service information up to date'
      ].filter(Boolean) as string[],
      status: analysis.services.status
    });
  }

  return recommendations;
}

function isValidGoogleMapsUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    // Accept all Google Maps URL formats
    return (urlObj.hostname.match(/^(www\.)?google\.com$/) && urlObj.pathname.includes('/maps/place/')) ||
           (urlObj.hostname === 'g.co' && urlObj.pathname.startsWith('/kgs/')) ||
           (urlObj.hostname === 'maps.google.com' && urlObj.pathname.includes('/place/')) ||
           (urlObj.hostname === 'maps.app.goo.gl');
  } catch {
    return false;
  }
}

function createScoringResult(analysis: any): ScoringResult {
  const scoreData: ScoringResult = {
    totalPoints: 0,
    maxPoints: 0,
    percentage: 0,
    details: {}
  };

  // Map analysis data to scoring criteria
  const categoryMappings = {
    "Profile Completeness": {
      "Business name is clear and professional": Boolean(analysis.profile.businessName),
      "Business category is accurately set": Boolean(analysis.profile.category),
      "Business hours are listed and accurate": Boolean(analysis.information.hours),
      "Business description is detailed and informative": Boolean(analysis.profile.description),
      "Business location is accurate and verified": Boolean(analysis.information.address)
    },
    "Visual Content": {
      "Profile photo is professional and high-quality": Boolean(analysis.photos.hasProfilePhoto),
      "Cover photo is engaging and relevant": Boolean(analysis.photos.hasCoverPhoto),
      "Business photos showcase services/products": Boolean(analysis.photos.hasInteriorPhotos || analysis.photos.hasExteriorPhotos),
      "Photos are regularly updated": Boolean(analysis.photos.hasInteriorPhotos || analysis.photos.hasExteriorPhotos),
      "Photo quality meets professional standards": Boolean(analysis.photos.hasProfilePhoto && analysis.photos.hasCoverPhoto)
    },
    "Reviews & Ratings": {
      "Average rating is 4.5 or higher": analysis.reviews.averageRating >= 4.5,
      "Owner responses to reviews are present": analysis.reviews.responseRate > 0,
      "Response rate to reviews is high": analysis.reviews.responseRate >= 50,
      "Review quality is high": analysis.reviews.totalReviews >= 20,
      "Recent reviews are positive": analysis.reviews.averageRating >= 4.5
    },
    "Posts & Updates": {
      "Regular posting schedule (2+ posts/month)": analysis.posts.postFrequency >= 2,
      "Variety of post types (offers, events, updates)": analysis.posts.hasPosts,
      "Posts receive good engagement": analysis.posts.postEngagement >= 5,
      "Posts include clear calls-to-action": analysis.posts.hasPosts,
      "Post visuals are high quality": analysis.posts.hasPosts
    },
    "Local SEO": {
      "Keywords in business description": Boolean(analysis.profile.description),
      "Local area keywords used": Boolean(analysis.profile.description),
      "Service area is defined": Boolean(analysis.information.address),
      "NAP (Name, Address, Phone) is consistent": Boolean(analysis.information.phone && analysis.information.address),
      "Local citations are present": Boolean(analysis.information.website)
    },
    "Engagement & Interaction": {
      "Quick response to messages": Boolean(analysis.information.phone),
      "Answers questions promptly": Boolean(analysis.information.website),
      "High user interaction rate": analysis.posts.postEngagement >= 5,
      "Active post engagement": analysis.posts.postEngagement >= 5,
      "Engages with review responses": analysis.reviews.responseRate >= 50
    }
  };

  // Calculate scores for each category
  Object.entries(categoryMappings).forEach(([category, items]) => {
    const categoryScore = Object.values(items).filter(Boolean).length;
    const maxScore = Object.keys(items).length;
    
    scoreData.details[category] = {
      score: categoryScore,
      maxScore,
      items
    };
    
    scoreData.totalPoints += categoryScore;
    scoreData.maxPoints += maxScore;
  });

  scoreData.percentage = Math.round((scoreData.totalPoints / scoreData.maxPoints) * 100);
  return scoreData;
}

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const formData = await request.formData();
        const url = formData.get('url') as string;
        const screenshot = formData.get('screenshot') as File;

        if (!url && !screenshot) {
          controller.enqueue(encoder.encode(sendError('Please provide either a URL or a screenshot')));
          controller.close();
          return;
        }

        let analysis;
        let browser;
        try {
          if (url) {
            if (!isValidGoogleMapsUrl(url)) {
              throw new Error('Please enter a valid Google Maps URL');
            }

            browser = await puppeteer.launch({
              headless: true,
              args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu'
              ]
            });

            const page = await browser.newPage();
            await page.setViewport({ width: 1280, height: 800 });
            
            // Set a longer timeout
            page.setDefaultNavigationTimeout(60000); // 60 seconds
            page.setDefaultTimeout(60000);

            // Send progress updates
            controller.enqueue(encoder.encode(sendProgress('loading_profile', 0)));
            
            try {
              // Navigate with more options
              await page.goto(url, { 
                waitUntil: ['networkidle0', 'domcontentloaded'],
                timeout: 60000
              });

              // Wait for either the business name or an error message
              await Promise.race([
                page.waitForSelector('h1.DUwDvf', { timeout: 60000 }),
                page.waitForSelector('div[role="alert"]', { timeout: 60000 })
              ]);

              // Check if we got an error message
              const errorMessage = await page.evaluate(() => {
                const alert = document.querySelector('div[role="alert"]');
                return alert ? alert.textContent : null;
              });

              if (errorMessage) {
                throw new Error(`Google Maps error: ${errorMessage}`);
              }

              // Log the raw HTML for debugging
              const rawHtml = await page.content();
              console.log('Raw HTML:', rawHtml);

              controller.enqueue(encoder.encode(sendProgress('analyzing_profile', 25)));
              const profile = await analyzeProfile(page);
              console.log('Profile Analysis Results:', JSON.stringify(profile, null, 2));

              controller.enqueue(encoder.encode(sendProgress('analyzing_visuals', 50)));
              const photos = await analyzePhotos(page);
              console.log('Photos Analysis Results:', JSON.stringify(photos, null, 2));

              controller.enqueue(encoder.encode(sendProgress('analyzing_information', 75)));
              const information = await analyzeInformation(page);
              console.log('Information Analysis Results:', JSON.stringify(information, null, 2));

              controller.enqueue(encoder.encode(sendProgress('analyzing_reviews', 90)));
              const reviews = await analyzeReviews(page) as ReviewsAnalysis;
              console.log('Reviews Analysis:', reviews);
              
              const reviewsAnalysisResults = {
                averageRating: reviews.averageRating,
                totalReviews: reviews.reviewElementsCount,
                responseRate: (reviews.reviewDetails.filter(review => review.hasResponse).length / reviews.reviewDetails.length) * 100,
                reviewsWithResponses: reviews.reviewDetails.filter(review => review.hasResponse).length,
                reviewElementsCount: reviews.reviewElementsCount,
                reviewDetails: reviews.reviewDetails,
                status: reviews.reviewElementsCount > 0 ? 'green' : 'red'
              };
              console.log('Final reviews analysis results:', reviewsAnalysisResults);

              controller.enqueue(encoder.encode(sendProgress('analyzing_posts', 95)));
              const posts = await analyzePosts(page);
              console.log('Posts Analysis Results:', JSON.stringify(posts, null, 2));

              controller.enqueue(encoder.encode(sendProgress('analyzing_services', 100)));
              const services = await analyzeServices(page);
              console.log('Services Analysis Results:', JSON.stringify(services, null, 2));

              analysis = {
                profile,
                photos,
                information,
                reviews: reviewsAnalysisResults,
                posts,
                services
              };
            } catch (pageError: unknown) {
              console.error('Page navigation error:', pageError);
              throw new Error(`Failed to load Google Business Profile: ${pageError instanceof Error ? pageError.message : 'Unknown error'}`);
            } finally {
              if (browser) {
                await browser.close();
              }
            }
          } else if (screenshot) {
            throw new Error('Screenshot analysis is not implemented yet');
          }
        } catch (err) {
          console.error('Analysis error:', err);
          controller.enqueue(encoder.encode(JSON.stringify({
            type: 'error',
            data: {
              error: err instanceof Error ? err.message : 'Failed to analyze Google Business Profile'
            }
          }) + '\n'));
          controller.close();
          return;
        }

        // Generate recommendations based on the analysis
        const recommendations = generateRecommendations(analysis);

        const result = {
          timestamp: new Date().toISOString(),
          recommendations,
          googleBusinessAnalysis: analysis,
          score: createScoringResult(analysis)
        };

        // Send the final result
        controller.enqueue(encoder.encode(JSON.stringify({
          type: 'result',
          data: result
        }) + '\n'));
        controller.close();
      } catch (error) {
        console.error('Stream error:', error);
        controller.enqueue(encoder.encode(JSON.stringify({
          type: 'error',
          data: {
            error: error instanceof Error ? error.message : 'An unexpected error occurred'
          }
        }) + '\n'));
        controller.close();
      }
    }
  });

  return new NextResponse(stream);
} 