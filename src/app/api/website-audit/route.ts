import { NextResponse } from 'next/server';
import sharp from 'sharp';
import puppeteer from 'puppeteer';

interface Recommendation {
  category: string;
  suggestions: string[];
  strengths: string[];
}

async function analyzeWebsiteUrl(url: string) {
  const browser = await puppeteer.launch();
  try {
    const page = await browser.newPage();
    
    // Set viewport to mobile size first to check responsiveness
    await page.setViewport({ width: 375, height: 667 });
    
    // Measure load time
    const startTime = Date.now();
    await page.goto(url, { waitUntil: 'networkidle0' });
    const loadTime = Date.now() - startTime;
    
    // Check for mobile responsiveness
    const mobileContent = await page.content();
    const hasMobileVersion = !mobileContent.includes('width=device-width') || 
                            mobileContent.includes('@media') ||
                            mobileContent.includes('viewport');
    
    // Check for contact information
    const hasContactInfo = await page.evaluate(() => {
      const text = document.body.innerText.toLowerCase();
      return text.includes('contact') || 
             text.includes('phone') || 
             text.includes('email') ||
             text.includes('address');
    });
    
    // Check for services page
    const hasServicesPage = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      return links.some(link => 
        link.textContent?.toLowerCase().includes('services') ||
        link.href.toLowerCase().includes('services')
      );
    });
    
    // Check for booking system
    const hasBookingSystem = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      return links.some(link => 
        link.textContent?.toLowerCase().includes('book') ||
        link.href.toLowerCase().includes('book') ||
        link.textContent?.toLowerCase().includes('appointment') ||
        link.href.toLowerCase().includes('appointment')
      );
    });

    // Take screenshot for design analysis
    const screenshot = await page.screenshot();
    const { data, info } = await sharp(screenshot)
      .grayscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Basic design quality analysis
    const totalPixels = info.width * info.height;
    const pixelValues = Array.from(data);
    const meanBrightness = pixelValues.reduce((sum, val) => sum + val, 0) / totalPixels;
    const variance = pixelValues.reduce((sum, val) => sum + Math.pow(val - meanBrightness, 2), 0) / totalPixels;
    const stdDev = Math.sqrt(variance);

    // Design quality is based on contrast (stdDev) and overall brightness
    const designQuality = stdDev > 50 && meanBrightness > 100 ? 'Good' : 
                         stdDev > 30 && meanBrightness > 80 ? 'Average' : 'Needs Improvement';

    return {
      hasMobileVersion,
      hasContactInfo,
      hasServicesPage,
      hasBookingSystem,
      loadSpeed: loadTime < 2000 ? 'Fast' : loadTime < 4000 ? 'Average' : 'Slow',
      designQuality
    };
  } finally {
    await browser.close();
  }
}

async function analyzeWebsiteScreenshot(imageBuffer: Buffer) {
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

    // Design quality is based on contrast (stdDev) and overall brightness
    const designQuality = stdDev > 50 && meanBrightness > 100 ? 'Good' : 
                         stdDev > 30 && meanBrightness > 80 ? 'Average' : 'Needs Improvement';

    // For screenshots, we can only analyze visual elements
    return {
      hasMobileVersion: info.width <= 375, // Assuming mobile screenshots are 375px or less wide
      hasContactInfo: false, // Can't reliably detect from screenshot
      hasServicesPage: false, // Can't reliably detect from screenshot
      hasBookingSystem: false, // Can't reliably detect from screenshot
      loadSpeed: 'Unknown', // Can't measure from screenshot
      designQuality
    };
  } catch (error) {
    console.error('Error analyzing screenshot:', error);
    throw new Error('Failed to analyze the screenshot');
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const url = formData.get('url') as string;
    const screenshot = formData.get('screenshot') as File;

    if (!url && !screenshot) {
      return NextResponse.json(
        { error: 'Either URL or screenshot is required' },
        { status: 400 }
      );
    }

    let websiteAnalysis;
    if (url) {
      websiteAnalysis = await analyzeWebsiteUrl(url);
    } else if (screenshot) {
      const arrayBuffer = await screenshot.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      websiteAnalysis = await analyzeWebsiteScreenshot(buffer);
    }

    // Type assertion since we know websiteAnalysis will be defined here
    // due to the validation check at the start of the function
    const analysis = websiteAnalysis as NonNullable<typeof websiteAnalysis>;

    // Generate recommendations based on the analysis
    const recommendations: Recommendation[] = [
      {
        category: 'Website Design & User Experience',
        suggestions: [],
        strengths: []
      },
      {
        category: 'Content & Information',
        suggestions: [],
        strengths: []
      },
      {
        category: 'Business Features',
        suggestions: [],
        strengths: []
      }
    ];

    // Add specific recommendations and strengths based on analysis
    if (analysis.hasMobileVersion) {
      recommendations[0].strengths.push('Your website is mobile-friendly - this is crucial for reaching clients on the go');
    } else {
      recommendations[0].suggestions.push('Make your website mobile-responsive to improve user experience on smartphones and tablets');
    }

    if (analysis.designQuality === 'Good') {
      recommendations[0].strengths.push('Your website has good visual design with appropriate contrast and brightness');
    } else if (analysis.designQuality === 'Average') {
      recommendations[0].suggestions.push('Consider improving the visual contrast and brightness of your website');
    } else {
      recommendations[0].suggestions.push('Your website needs significant design improvements - consider working with a professional designer');
    }

    if (analysis.loadSpeed === 'Fast') {
      recommendations[0].strengths.push('Your website loads quickly - this helps keep visitors engaged');
    } else if (analysis.loadSpeed === 'Average') {
      recommendations[0].suggestions.push('Optimize your website\'s load speed to improve user experience');
    } else if (analysis.loadSpeed === 'Slow') {
      recommendations[0].suggestions.push('Your website loads slowly - this may cause visitors to leave before seeing your content');
    }

    if (analysis.hasContactInfo) {
      recommendations[1].strengths.push('Your website includes contact information - this makes it easy for clients to reach you');
    } else {
      recommendations[1].suggestions.push('Add clear contact information including phone, email, and address');
    }

    if (analysis.hasServicesPage) {
      recommendations[1].strengths.push('You have a dedicated services page - this helps clients understand what you offer');
    } else {
      recommendations[1].suggestions.push('Create a services page that clearly lists and describes your salon services');
    }

    if (analysis.hasBookingSystem) {
      recommendations[2].strengths.push('You have an online booking system - this makes it convenient for clients to schedule appointments');
    } else {
      recommendations[2].suggestions.push('Add an online booking system to make it easier for clients to schedule appointments');
    }

    // Add base recommendations that apply to all websites
    if (recommendations[0].suggestions.length === 0) {
      recommendations[0].suggestions.push('Consider adding a photo gallery to showcase your work');
      recommendations[0].suggestions.push('Ensure your website has a consistent color scheme that matches your brand');
    }

    if (recommendations[1].suggestions.length === 0) {
      recommendations[1].suggestions.push('Add customer testimonials to build trust');
      recommendations[1].suggestions.push('Include your business hours in a prominent location');
    }

    if (recommendations[2].suggestions.length === 0) {
      recommendations[2].suggestions.push('Add social media links to connect with clients');
      recommendations[2].suggestions.push('Consider adding a blog section to share hair care tips and trends');
    }

    const result = {
      timestamp: new Date().toISOString(),
      recommendations,
      websiteAnalysis: analysis
    };

    return NextResponse.json({ 
      success: true, 
      message: 'Analysis completed successfully',
      data: result
    });
  } catch (error) {
    console.error('Error processing website audit request:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to process request';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 