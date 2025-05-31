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
    const photoElements = document.querySelectorAll('button[jsaction*="photos"] img, button[aria-label*="photo"] img');
    const hasProfilePhoto = Array.from(photoElements).some(img => 
      img.getAttribute('alt')?.toLowerCase().includes('profile') || 
      img.getAttribute('aria-label')?.toLowerCase().includes('profile')
    );
    const hasCoverPhoto = Array.from(photoElements).some(img => 
      img.getAttribute('alt')?.toLowerCase().includes('cover') || 
      img.getAttribute('aria-label')?.toLowerCase().includes('cover')
    );
    const hasInteriorPhotos = Array.from(photoElements).some(img => 
      img.getAttribute('alt')?.toLowerCase().includes('interior') || 
      img.getAttribute('aria-label')?.toLowerCase().includes('interior')
    );
    const hasExteriorPhotos = Array.from(photoElements).some(img => 
      img.getAttribute('alt')?.toLowerCase().includes('exterior') || 
      img.getAttribute('aria-label')?.toLowerCase().includes('exterior')
    );
    
    return { hasProfilePhoto, hasCoverPhoto, hasInteriorPhotos, hasExteriorPhotos };
  });

  console.log('Photos Analysis:', photoInfo); // Debug log

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
async function analyzeReviews(page: Page) {
  const reviewInfo = await page.evaluate(() => {
    // Updated selectors for Google Maps reviews
    const ratingElement = document.querySelector('div.F7nice span[aria-hidden="true"]');
    const reviewsElement = document.querySelector('div.F7nice span[aria-label*="reviews"]');
    const responsesElement = document.querySelector('div[aria-label*="responses"]');
    
    const averageRating = parseFloat(ratingElement?.textContent?.trim() || '0');
    const totalReviews = parseInt(reviewsElement?.textContent?.replace(/[^0-9]/g, '') || '0');
    const responseRate = parseFloat(responsesElement?.textContent?.replace(/[^0-9.]/g, '') || '0');
    
    return { averageRating, totalReviews, responseRate };
  });

  console.log('Reviews Analysis:', reviewInfo); // Debug log

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

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  // Start processing in the background
  (async () => {
    try {
      const formData = await request.formData();
      let url = formData.get('url') as string;

      if (!url) {
        throw new Error('Please provide a Google Maps business URL');
      }

      // Clean and format the URL
      url = url.trim();
      // Remove @ symbol if present at the start
      url = url.replace(/^@/, '');
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      console.log('Initial URL:', url); // Debug log

      // Validate URL format
      if (!isValidGoogleMapsUrl(url)) {
        console.error('Invalid URL format:', url); // Debug log
        throw new Error('Please provide a valid Google Maps URL (e.g., https://maps.app.goo.gl/..., https://www.google.com/maps/place/..., or https://g.co/kgs/...)');
      }

      let browser;
      try {
        // Send initial progress
        await writer.write(sendProgress('initializing'));

        // Launch browser with additional settings for better redirect handling
        browser = await puppeteer.launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process'
          ]
        });

        const page = await browser.newPage();
        
        // Enable request interception to log redirects
        await page.setRequestInterception(true);
        
        // Track all redirects
        const redirects: string[] = [];
        page.on('request', request => {
          console.log('Request URL:', request.url());
          redirects.push(request.url());
          request.continue();
        });
        
        page.on('response', response => {
          console.log('Response URL:', response.url(), 'Status:', response.status());
          if (response.status() >= 300 && response.status() < 400) {
            console.log('Redirect Location:', response.headers()['location']);
          }
        });

        await page.setViewport({ width: 1280, height: 800 });

        // Send loading progress
        await writer.write(sendProgress('loading_profile'));
        
        // Handle all types of Google Maps URLs that need redirects
        if (url.includes('g.co/kgs/') || url.includes('maps.app.goo.gl')) {
          console.log('Processing shortened URL:', url);
          
          // Set a longer timeout for redirects
          await page.setDefaultNavigationTimeout(30000);
          
          try {
            // Navigate to the URL and wait for all redirects to complete
            const response = await page.goto(url, {
              waitUntil: 'networkidle0',
              timeout: 30000
            });

            if (!response) {
              throw new Error('No response received from the URL');
            }

            console.log('Redirect chain:', redirects); // Debug log
            console.log('Final URL after redirects:', page.url());
            
            // Check if we ended up on a Google Maps business page
            const finalUrl = page.url();
            if (!finalUrl.includes('google.com/maps/place/') && !finalUrl.includes('maps.google.com/place/')) {
              console.error('Redirect did not lead to a Google Maps business page. Final URL:', finalUrl);
              console.error('Full redirect chain:', redirects);
              throw new Error('The provided URL did not redirect to a valid Google Maps business page. Please make sure you copied the correct business URL from Google Maps.');
            }
          } catch (error) {
            console.error('Navigation error:', error);
            console.error('Redirect chain so far:', redirects);
            throw new Error(`Failed to navigate to the business page: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        } else {
          // Navigate directly for google.com/maps URLs
          await page.goto(url, { waitUntil: 'networkidle0' });
        }

        // Wait for key elements to be present with a longer timeout
        try {
          await page.waitForSelector('h1', { timeout: 15000 });
          console.log('Found business profile elements on page:', page.url());
        } catch (error) {
          console.error('Could not find business profile elements on page:', page.url());
          console.error('Page content:', await page.content());
          throw new Error('Could not find business profile. Please make sure the URL is correct and the business is listed on Google Maps.');
        }

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