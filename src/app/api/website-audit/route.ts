import { NextResponse } from 'next/server';
import sharp from 'sharp';
import puppeteer from 'puppeteer';

type Status = 'green' | 'yellow' | 'red';

interface PerformanceMetrics {
  loadTime: number;
  domContentLoaded: number;
  firstPaint: number;
  firstContentfulPaint: number;
}

interface Recommendation {
  category: string;
  suggestions: string[];
  strengths: string[];
  status: Status;
}

interface AuditMetrics {
  seo: {
    metaTitle: string;
    metaDescription: string;
    h1Tags: string[];
    keywordDensity: number;
    hasSitemap: boolean;
    status: Status;
  };
  performance: {
    loadTime: number;
    lighthouseScore: number;
    imageOptimization: boolean;
    status: Status;
  };
  mobile: {
    isResponsive: boolean;
    touchElements: boolean;
    viewportMeta: boolean;
    status: Status;
  };
  branding: {
    hasLogo: boolean;
    colorConsistency: boolean;
    fontConsistency: boolean;
    status: Status;
  };
  social: {
    hasInstagram: boolean;
    hasFacebook: boolean;
    hasSocialFeeds: boolean;
    status: Status;
  };
  contact: {
    hasPhone: boolean;
    hasEmail: boolean;
    hasLocation: boolean;
    hasBooking: boolean;
    status: Status;
  };
  accessibility: {
    contrastRatio: number;
    hasAriaTags: boolean;
    hasAltTexts: boolean;
    status: Status;
  };
}

function calculatePerformanceScore(metrics: PerformanceMetrics, loadTime: number): number {
  // Calculate a performance score based on various metrics
  // This is a simplified version of performance scoring
  const weights = {
    loadTime: 0.3,
    domContentLoaded: 0.2,
    firstPaint: 0.25,
    firstContentfulPaint: 0.25
  };

  const scores = {
    loadTime: Math.max(0, 100 - (loadTime / 50)), // 0-100 score based on load time
    domContentLoaded: Math.max(0, 100 - (metrics.domContentLoaded / 40)),
    firstPaint: Math.max(0, 100 - (metrics.firstPaint / 30)),
    firstContentfulPaint: Math.max(0, 100 - (metrics.firstContentfulPaint / 30))
  };

  return Math.round(
    scores.loadTime * weights.loadTime +
    scores.domContentLoaded * weights.domContentLoaded +
    scores.firstPaint * weights.firstPaint +
    scores.firstContentfulPaint * weights.firstContentfulPaint
  );
}

function validateAndFormatUrl(url: string): string {
  // Remove any whitespace
  url = url.trim();
  
  // If it's a naked domain (no protocol), add https://
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  
  // If it's a naked domain without www, add www.
  if (!url.includes('://www.') && !url.includes('://localhost')) {
    url = url.replace('://', '://www.');
  }

  try {
    // Validate the URL
    new URL(url);
    return url;
  } catch (err) {
    throw new Error('Invalid URL format');
  }
}

async function analyzeWebsiteUrl(url: string, controller: ReadableStreamDefaultController): Promise<AuditMetrics> {
  // Validate and format the URL before proceeding
  const formattedUrl = validateAndFormatUrl(url);
  
  const browser = await puppeteer.launch({ 
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      '--window-size=1920x1080'
    ]
  });
  
  try {
    sendProgressUpdate(controller, 'initializing');
    
    const page = await browser.newPage();
    sendProgressUpdate(controller, 'loading_website');
    
    // Set viewport to mobile size first
    await page.setViewport({ width: 375, height: 667 });
    
    // Set a longer timeout and more lenient wait conditions
    page.setDefaultNavigationTimeout(60000); // 60 seconds
    page.setDefaultTimeout(60000);

    // Start performance measurement
    const startTime = Date.now();
    try {
      // Try to load the page with a more lenient wait condition
      const response = await page.goto(formattedUrl, { 
        waitUntil: ['domcontentloaded', 'networkidle2'], // More lenient wait condition
        timeout: 60000 // 60 second timeout
      });

      if (!response) {
        throw new Error('No response from website');
      }

      if (!response.ok()) {
        throw new Error(`Website returned status code: ${response.status()}`);
      }

      // Wait a bit more for any dynamic content
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (err) {
      throw new Error(`Failed to load website: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }

    // Get performance metrics using Puppeteer
    const performanceMetrics = await page.evaluate(() => {
      try {
        // Use type assertion to access Performance API
        const perf = window.performance as any;
        const navigation = perf.getEntriesByType('navigation')[0];
        const paint = perf.getEntriesByType('paint');
        
        return {
          loadTime: navigation?.loadEventEnd - navigation?.startTime || 0,
          domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.startTime || 0,
          firstPaint: paint?.find((entry: any) => entry.name === 'first-paint')?.startTime || 0,
          firstContentfulPaint: paint?.find((entry: any) => entry.name === 'first-contentful-paint')?.startTime || 0,
        } as PerformanceMetrics;
      } catch (err) {
        console.warn('Could not get performance metrics:', err);
        return {
          loadTime: 0,
          domContentLoaded: 0,
          firstPaint: 0,
          firstContentfulPaint: 0,
        } as PerformanceMetrics;
      }
    });

    sendProgressUpdate(controller, 'analyzing_seo');
    // SEO Analysis
    const seo = await page.evaluate(() => {
      const metaTitle = document.querySelector('title')?.textContent || '';
      const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
      const h1Tags = Array.from(document.querySelectorAll('h1')).map(h1 => h1.textContent || '');
      
      // Check for sitemap
      const sitemapLink = document.querySelector('link[rel="sitemap"]');
      const robotsTxt = document.querySelector('meta[name="robots"]')?.getAttribute('content');
      const hasSitemap = Boolean(sitemapLink || (robotsTxt && robotsTxt.includes('sitemap')));

      // Basic keyword density analysis
      const text = document.body.innerText.toLowerCase();
      const words = text.split(/\s+/);
      const wordCount = words.length;
      const keywordCount = words.filter(word => 
        ['beauty', 'spa', 'salon', 'hair', 'stylist', 'treatment', 'service', 'wellness'].includes(word)
      ).length;
      const keywordDensity = (keywordCount / wordCount) * 100;

      const status: Status = (metaTitle && metaDescription && h1Tags.length > 0 && hasSitemap) ? 'green' : 
                            (metaTitle || metaDescription || h1Tags.length > 0) ? 'yellow' : 'red';

      return {
        metaTitle,
        metaDescription,
        h1Tags,
        keywordDensity,
        hasSitemap,
        status
      };
    });

    sendProgressUpdate(controller, 'analyzing_performance');
    // Performance Analysis
    const performance = {
      loadTime: Date.now() - startTime,
      lighthouseScore: performanceMetrics.loadTime > 0 ? calculatePerformanceScore(performanceMetrics, Date.now() - startTime) : 0,
      imageOptimization: await page.evaluate(() => {
        const images = Array.from(document.querySelectorAll('img'));
        const modernFormats = images.filter(img => {
          const src = img.src.toLowerCase();
          return src.endsWith('.webp') || src.endsWith('.avif') || src.includes('?format=webp');
        });
        return modernFormats.length / images.length > 0.5;
      }),
      status: (Date.now() - startTime < 2000 && performanceMetrics.loadTime > 0) ? 'green' :
              (Date.now() - startTime < 4000 && performanceMetrics.loadTime > 0) ? 'yellow' : 'red' as Status
    };

    sendProgressUpdate(controller, 'analyzing_mobile');
    // Mobile Analysis
    const mobile = await page.evaluate(() => {
      const viewportMeta = document.querySelector('meta[name="viewport"]')?.getAttribute('content')?.includes('width=device-width') || false;
      const touchElements = document.querySelectorAll('button, a, input, [role="button"]').length > 0;
      const isResponsive = window.innerWidth === 375; // Check if mobile viewport is respected

      const status: Status = (isResponsive && touchElements && viewportMeta) ? 'green' :
                            (isResponsive || touchElements) ? 'yellow' : 'red';

      return {
        isResponsive,
        touchElements,
        viewportMeta,
        status
      };
    });

    sendProgressUpdate(controller, 'analyzing_branding');
    // Branding Analysis
    const branding = await page.evaluate(() => {
      const hasLogo = document.querySelector('img[alt*="logo" i]') !== null;
      const styles = Array.from(document.styleSheets);
      const colors = new Set();
      const fonts = new Set();

      styles.forEach(style => {
        try {
          const rules = style.cssRules;
          for (let rule of rules) {
            if (rule instanceof CSSStyleRule) {
              // Extract colors
              const colorMatch = rule.style.color || rule.style.backgroundColor;
              if (colorMatch) colors.add(colorMatch);
              
              // Extract fonts
              const fontFamily = rule.style.fontFamily;
              if (fontFamily) fonts.add(fontFamily);
            }
          }
        } catch (e) {
          // Skip cross-origin stylesheets
        }
      });

      const status: Status = (hasLogo && colors.size <= 5 && fonts.size <= 3) ? 'green' :
                            (hasLogo || (colors.size <= 5 && fonts.size <= 3)) ? 'yellow' : 'red';

      return {
        hasLogo,
        colorConsistency: colors.size <= 5, // Assuming 5 or fewer colors is consistent
        fontConsistency: fonts.size <= 3, // Assuming 3 or fewer fonts is consistent
        status
      };
    });

    sendProgressUpdate(controller, 'analyzing_social');
    // Social Media Analysis
    const social = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      const hasInstagram = links.some(link => {
        try {
          const href = link.getAttribute('href') || '';
          const text = (link.textContent || '').toLowerCase();
          return href.includes('instagram.com') || text.includes('instagram');
        } catch (e) {
          return false;
        }
      });
      const hasFacebook = links.some(link => {
        try {
          const href = link.getAttribute('href') || '';
          const text = (link.textContent || '').toLowerCase();
          return href.includes('facebook.com') || text.includes('facebook');
        } catch (e) {
          return false;
        }
      });
      const hasSocialFeeds = document.querySelector('[class*="instagram-feed"], [class*="facebook-feed"]') !== null;

      const status: Status = (hasInstagram && hasFacebook) ? 'green' :
                            (hasInstagram || hasFacebook) ? 'yellow' : 'red';

      return {
        hasInstagram,
        hasFacebook,
        hasSocialFeeds,
        status
      };
    });

    sendProgressUpdate(controller, 'analyzing_contact');
    // Contact Information Analysis
    const contact = await page.evaluate(() => {
      const text = document.body.innerText.toLowerCase();
      const hasPhone = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/.test(text) || 
                      text.includes('phone') || text.includes('call');
      const hasEmail = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(text) ||
                      text.includes('email') || text.includes('@');
      const hasLocation = text.includes('address') || text.includes('location') || text.includes('find us');
      const hasBooking = text.includes('book') || text.includes('appointment') || text.includes('schedule');

      const status: Status = (hasPhone && hasEmail && hasLocation && hasBooking) ? 'green' :
                            (hasPhone && (hasEmail || hasLocation)) ? 'yellow' : 'red';

      return {
        hasPhone,
        hasEmail,
        hasLocation,
        hasBooking,
        status
      };
    });

    sendProgressUpdate(controller, 'analyzing_accessibility');
    // Accessibility Analysis
    const accessibility = await page.evaluate(() => {
      // Check for any element with an ARIA attribute
      const hasAriaTags = Array.from(document.querySelectorAll('*')).some(el => {
        const attributes = el.attributes;
        for (let i = 0; i < attributes.length; i++) {
          if (attributes[i].name.startsWith('aria-')) {
            return true;
          }
        }
        return false;
      });

      const images = document.querySelectorAll('img');
      const hasAltTexts = Array.from(images).every(img => img.hasAttribute('alt'));
      
      // Basic contrast check (this is simplified - a real check would be more complex)
      const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, a');
      const hasGoodContrast = Array.from(textElements).every(el => {
        const style = window.getComputedStyle(el);
        const color = style.color;
        const bgColor = style.backgroundColor;
        // This is a simplified check - real contrast calculation would be more complex
        return color !== bgColor;
      });

      const status: Status = (hasAriaTags && hasAltTexts && hasGoodContrast) ? 'green' :
                            (hasAltTexts || hasAriaTags) ? 'yellow' : 'red';

      return {
        contrastRatio: hasGoodContrast ? 1 : 0,
        hasAriaTags,
        hasAltTexts,
        status
      };
    });

    sendProgressUpdate(controller, 'generating_recommendations');

    return {
      seo,
      performance,
      mobile,
      branding,
      social,
      contact,
      accessibility
    };

  } finally {
    await browser.close();
  }
}

async function analyzeWebsiteScreenshot(imageBuffer: Buffer): Promise<AuditMetrics> {
  try {
    // Convert to grayscale for analysis
    const { data, info } = await sharp(imageBuffer)
      .grayscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Basic image analysis
    const pixelValues = Array.from(data);
    const meanBrightness = pixelValues.reduce((sum, val) => sum + val, 0) / pixelValues.length;
    const variance = pixelValues.reduce((sum, val) => sum + Math.pow(val - meanBrightness, 2), 0) / pixelValues.length;
    const stdDev = Math.sqrt(variance);

    // For screenshots, we can only analyze visual elements
    return {
      seo: {
        metaTitle: '',
        metaDescription: '',
        h1Tags: [],
        keywordDensity: 0,
        hasSitemap: false,
        status: 'red'
      },
      performance: {
        loadTime: 0,
        lighthouseScore: 0,
        imageOptimization: stdDev > 50 && meanBrightness > 100,
        status: stdDev > 50 && meanBrightness > 100 ? 'green' : 
                stdDev > 30 && meanBrightness > 80 ? 'yellow' : 'red'
      },
      mobile: {
        isResponsive: info.width <= 375,
        touchElements: false,
        viewportMeta: false,
        status: info.width <= 375 ? 'green' : 'red'
      },
      branding: {
        hasLogo: false,
        colorConsistency: stdDev > 30,
        fontConsistency: false,
        status: stdDev > 30 ? 'yellow' : 'red'
      },
      social: {
        hasInstagram: false,
        hasFacebook: false,
        hasSocialFeeds: false,
        status: 'red'
      },
      contact: {
        hasPhone: false,
        hasEmail: false,
        hasLocation: false,
        hasBooking: false,
        status: 'red'
      },
      accessibility: {
        contrastRatio: stdDev > 50 ? 1 : 0,
        hasAriaTags: false,
        hasAltTexts: false,
        status: stdDev > 50 ? 'yellow' : 'red'
      }
    };
  } catch (error) {
    console.error('Error analyzing screenshot:', error);
    throw new Error('Failed to analyze the screenshot');
  }
}

// Add helper function to send progress updates
function sendProgressUpdate(controller: ReadableStreamDefaultController, stage: string) {
  const encoder = new TextEncoder();
  controller.enqueue(encoder.encode(JSON.stringify({
    type: 'progress',
    stage
  }) + '\n'));
}

export async function POST(request: Request) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const formData = await request.formData();
        const url = formData.get('url') as string;
        const screenshot = formData.get('screenshot') as File;

        if (!url && !screenshot) {
          controller.enqueue(encoder.encode(JSON.stringify({
            type: 'error',
            error: 'Either URL or screenshot is required'
          }) + '\n'));
          controller.close();
          return;
        }

        let websiteAnalysis: AuditMetrics;
        try {
          if (url) {
            websiteAnalysis = await analyzeWebsiteUrl(url, controller);
          } else if (screenshot) {
            const arrayBuffer = await screenshot.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            websiteAnalysis = await analyzeWebsiteScreenshot(buffer);
          } else {
            throw new Error('No input provided');
          }
        } catch (err) {
          controller.enqueue(encoder.encode(JSON.stringify({
            type: 'error',
            error: err instanceof Error ? err.message : 'Failed to analyze website'
          }) + '\n'));
          controller.close();
          return;
        }

        // Generate recommendations based on the analysis
        const recommendations: Recommendation[] = [
          {
            category: 'SEO Optimization',
            suggestions: [],
            strengths: [],
            status: websiteAnalysis.seo.status
          },
          {
            category: 'Performance & Speed',
            suggestions: [],
            strengths: [],
            status: websiteAnalysis.performance.status
          },
          {
            category: 'Mobile Experience',
            suggestions: [],
            strengths: [],
            status: websiteAnalysis.mobile.status
          },
          {
            category: 'Branding & Design',
            suggestions: [],
            strengths: [],
            status: websiteAnalysis.branding.status
          },
          {
            category: 'Social Media Integration',
            suggestions: [],
            strengths: [],
            status: websiteAnalysis.social.status
          },
          {
            category: 'Contact Information',
            suggestions: [],
            strengths: [],
            status: websiteAnalysis.contact.status
          },
          {
            category: 'Accessibility',
            suggestions: [],
            strengths: [],
            status: websiteAnalysis.accessibility.status
          }
        ];

        // Add SEO recommendations
        if (websiteAnalysis.seo.metaTitle) {
          recommendations[0].strengths.push('Your website has a title tag - this is crucial for SEO');
        } else {
          recommendations[0].suggestions.push('Add a descriptive title tag that includes your business name and main services');
        }

        if (websiteAnalysis.seo.metaDescription) {
          recommendations[0].strengths.push('Your website has a meta description - this helps with search results');
        } else {
          recommendations[0].suggestions.push('Add a compelling meta description that summarizes your beauty services');
        }

        if (websiteAnalysis.seo.h1Tags.length > 0) {
          recommendations[0].strengths.push('Your website uses H1 tags properly for content hierarchy');
        } else {
          recommendations[0].suggestions.push('Add an H1 tag to your main page content');
        }

        // Add Performance recommendations
        if (websiteAnalysis.performance.loadTime < 2000) {
          recommendations[1].strengths.push('Your website loads quickly - this is great for user experience');
        } else {
          recommendations[1].suggestions.push(`Optimize your website's load time (currently ${websiteAnalysis.performance.loadTime}ms)`);
        }

        if (websiteAnalysis.performance.lighthouseScore > 90) {
          recommendations[1].strengths.push('Your website has excellent performance scores');
        } else {
          recommendations[1].suggestions.push(`Improve your Lighthouse performance score (currently ${websiteAnalysis.performance.lighthouseScore})`);
        }

        // Add Mobile recommendations
        if (websiteAnalysis.mobile.isResponsive) {
          recommendations[2].strengths.push('Your website is mobile-responsive');
        } else {
          recommendations[2].suggestions.push('Make your website mobile-responsive');
        }

        if (websiteAnalysis.mobile.touchElements) {
          recommendations[2].strengths.push('Your website has touch-friendly elements');
        } else {
          recommendations[2].suggestions.push('Add touch-friendly elements for mobile users');
        }

        // Add Branding recommendations
        if (websiteAnalysis.branding.hasLogo) {
          recommendations[3].strengths.push('Your website has a logo - this helps with brand recognition');
        } else {
          recommendations[3].suggestions.push('Add your business logo to the website');
        }

        if (websiteAnalysis.branding.colorConsistency) {
          recommendations[3].strengths.push('Your website maintains consistent colors');
        } else {
          recommendations[3].suggestions.push('Use a consistent color palette throughout your website');
        }

        // Add Social Media recommendations
        if (websiteAnalysis.social.hasInstagram && websiteAnalysis.social.hasFacebook) {
          recommendations[4].strengths.push('Your website links to both Instagram and Facebook');
        } else if (websiteAnalysis.social.hasInstagram || websiteAnalysis.social.hasFacebook) {
          recommendations[4].suggestions.push('Add links to all your social media profiles');
        } else {
          recommendations[4].suggestions.push('Add social media links to connect with clients');
        }

        // Add Contact recommendations
        if (websiteAnalysis.contact.hasPhone && websiteAnalysis.contact.hasEmail && websiteAnalysis.contact.hasLocation) {
          recommendations[5].strengths.push('Your website includes comprehensive contact information');
        } else {
          if (!websiteAnalysis.contact.hasPhone) recommendations[5].suggestions.push('Add your business phone number');
          if (!websiteAnalysis.contact.hasEmail) recommendations[5].suggestions.push('Add your business email address');
          if (!websiteAnalysis.contact.hasLocation) recommendations[5].suggestions.push('Add your business location');
        }

        if (websiteAnalysis.contact.hasBooking) {
          recommendations[5].strengths.push('Your website includes online booking');
        } else {
          recommendations[5].suggestions.push('Add an online booking system');
        }

        // Add Accessibility recommendations
        if (websiteAnalysis.accessibility.hasAltTexts) {
          recommendations[6].strengths.push('Your images have alt text - this is great for accessibility');
        } else {
          recommendations[6].suggestions.push('Add alt text to all images');
        }

        if (websiteAnalysis.accessibility.hasAriaTags) {
          recommendations[6].strengths.push('Your website uses ARIA tags for better accessibility');
        } else {
          recommendations[6].suggestions.push('Add ARIA tags to improve accessibility');
        }

        const result = {
          timestamp: new Date().toISOString(),
          recommendations,
          websiteAnalysis
        };

        // Send the final result
        controller.enqueue(encoder.encode(JSON.stringify({
          type: 'result',
          data: result
        }) + '\n'));
        controller.close();
      } catch (error) {
        console.error('Error processing website audit request:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to process request';
        controller.enqueue(encoder.encode(JSON.stringify({
          type: 'error',
          error: errorMessage
        }) + '\n'));
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
} 