import { NextRequest } from 'next/server';
import type { Page } from 'puppeteer';
import puppeteer from 'puppeteer';
import sharp from 'sharp';

// Helper function to send progress updates
function sendProgress(stage: string) {
  return new TextEncoder().encode(
    JSON.stringify({ type: 'progress', stage }) + '\n'
  );
}

// Helper function to send final result
function sendResult(data: any) {
  return new TextEncoder().encode(
    JSON.stringify({ type: 'result', data }) + '\n'
  );
}

// Helper function to analyze profile information
async function analyzeProfile(page: Page) {
  const profileInfo = await page.evaluate(() => {
    const name = document.querySelector('h1')?.textContent || '';
    const category = document.querySelector('[data-item-id="category"]')?.textContent || '';
    const description = document.querySelector('[data-item-id="description"]')?.textContent || '';
    
    return { name, category, description };
  });

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
    const hasProfilePhoto = !!document.querySelector('[data-photo-id="profile"]');
    const hasCoverPhoto = !!document.querySelector('[data-photo-id="cover"]');
    const hasInteriorPhotos = !!document.querySelector('[data-photo-id="interior"]');
    const hasExteriorPhotos = !!document.querySelector('[data-photo-id="exterior"]');
    
    return { hasProfilePhoto, hasCoverPhoto, hasInteriorPhotos, hasExteriorPhotos };
  });

  const status = 
    photoInfo.hasProfilePhoto && photoInfo.hasCoverPhoto && (photoInfo.hasInteriorPhotos || photoInfo.hasExteriorPhotos)
      ? 'green'
      : photoInfo.hasProfilePhoto && (photoInfo.hasCoverPhoto || photoInfo.hasInteriorPhotos || photoInfo.hasExteriorPhotos)
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
    const hours = !!document.querySelector('[data-item-id="hours"]');
    const phone = !!document.querySelector('[data-item-id="phone"]');
    const website = !!document.querySelector('[data-item-id="website"]');
    const address = !!document.querySelector('[data-item-id="address"]');
    
    return { hours, phone, website, address };
  });

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
async function analyzeReviews(page: Page) {
  const reviewInfo = await page.evaluate(() => {
    const ratingElement = document.querySelector('[data-item-id="rating"]');
    const reviewsElement = document.querySelector('[data-item-id="reviews"]');
    const responsesElement = document.querySelector('[data-item-id="responses"]');
    
    const averageRating = parseFloat(ratingElement?.textContent || '0');
    const totalReviews = parseInt(reviewsElement?.textContent?.replace(/[^0-9]/g, '') || '0');
    const responseRate = parseFloat(responsesElement?.textContent?.replace(/[^0-9.]/g, '') || '0');
    
    return { averageRating, totalReviews, responseRate };
  });

  const status = 
    reviewInfo.averageRating >= 4.5 && reviewInfo.totalReviews >= 50 && reviewInfo.responseRate >= 80
      ? 'green'
      : reviewInfo.averageRating >= 4.0 && reviewInfo.totalReviews >= 20 && reviewInfo.responseRate >= 50
        ? 'yellow'
        : 'red';

  return {
    ...reviewInfo,
    status
  };
}

// Helper function to analyze posts
async function analyzePosts(page: Page) {
  const postInfo = await page.evaluate(() => {
    const posts = document.querySelectorAll('[data-item-id="post"]');
    const hasPosts = posts.length > 0;
    const postFrequency = posts.length; // Posts in the last 30 days
    const postEngagement = Array.from(posts).reduce((total, post) => {
      const likes = parseInt(post.querySelector('[data-item-id="likes"]')?.textContent || '0');
      const comments = parseInt(post.querySelector('[data-item-id="comments"]')?.textContent || '0');
      return total + likes + comments;
    }, 0) / (posts.length || 1);
    
    return { hasPosts, postFrequency, postEngagement };
  });

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
    const services = document.querySelectorAll('[data-item-id="service"]');
    const hasServices = services.length > 0;
    const serviceCount = services.length;
    const hasPricing = Array.from(services).some(service => 
      !!service.querySelector('[data-item-id="price"]')
    );
    
    return { hasServices, serviceCount, hasPricing };
  });

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

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  // Start processing in the background
  (async () => {
    try {
      const formData = await request.formData();
      const url = formData.get('url') as string;

      if (!url) {
        throw new Error('Please provide a Google Maps business URL');
      }

      // Validate URL format
      if (!url.includes('google.com/maps')) {
        throw new Error('Please provide a valid Google Maps URL');
      }

      let browser;
      try {
        // Send initial progress
        await writer.write(sendProgress('initializing'));

        // Launch browser
        browser = await puppeteer.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });

        // Send loading progress
        await writer.write(sendProgress('loading_profile'));
        
        // Navigate to the URL and wait for the business profile to load
        await page.goto(url, { waitUntil: 'networkidle0' });

        // Wait for key elements to be present
        await page.waitForSelector('h1', { timeout: 10000 }).catch(() => {
          throw new Error('Could not find business profile. Please make sure the URL is correct and the business is listed on Google Maps.');
        });

        // Analyze different aspects of the profile
        await writer.write(sendProgress('analyzing_profile'));
        const profileAnalysis = await analyzeProfile(page);

        await writer.write(sendProgress('analyzing_photos'));
        const photosAnalysis = await analyzePhotos(page);

        await writer.write(sendProgress('analyzing_information'));
        const informationAnalysis = await analyzeInformation(page);

        await writer.write(sendProgress('analyzing_reviews'));
        const reviewsAnalysis = await analyzeReviews(page);

        await writer.write(sendProgress('analyzing_posts'));
        const postsAnalysis = await analyzePosts(page);

        await writer.write(sendProgress('analyzing_services'));
        const servicesAnalysis = await analyzeServices(page);

        // Generate recommendations
        await writer.write(sendProgress('generating_recommendations'));
        const recommendations = generateRecommendations({
          profile: profileAnalysis,
          photos: photosAnalysis,
          information: informationAnalysis,
          reviews: reviewsAnalysis,
          posts: postsAnalysis,
          services: servicesAnalysis
        });

        // Send final result
        const result = {
          timestamp: new Date().toISOString(),
          recommendations,
          gbpAnalysis: {
            profile: profileAnalysis,
            photos: photosAnalysis,
            information: informationAnalysis,
            reviews: reviewsAnalysis,
            posts: postsAnalysis,
            services: servicesAnalysis
          }
        };

        await writer.write(sendResult(result));
      } finally {
        if (browser) {
          await browser.close();
        }
      }
    } catch (error) {
      console.error('Error in Google Business Profile analysis:', error);
      await writer.write(
        encoder.encode(
          JSON.stringify({
            type: 'error',
            error: error instanceof Error ? error.message : 'An error occurred during analysis'
          }) + '\n'
        )
      );
    } finally {
      await writer.close();
    }
  })();

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
} 