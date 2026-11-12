import axios from 'axios';
import { generateAdvancedRecommendations } from '../utils/aiOptimizer';
import { analyzeCompression } from './compressionService';
import { analyzeCaching } from './cachingService';
import logger from '../utils/logger';

const API_KEY = process.env.PAGESPEED_API_KEY || ''; // Needs to be set in .env

export const analyzeUrl = async (url: string) => {
  try {
    // Calling Google PageSpeed Insights API
    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&category=PERFORMANCE&strategy=desktop&key=${API_KEY}`;
    
    // Fallback mock if no API key is provided
    if (!API_KEY) {
      console.warn("No PAGESPEED_API_KEY found, returning mocked data.");
      return getMockData(url);
    }

    const response = await axios.get(apiUrl);
    const data = response.data;
    
    const lighthouseResult = data.lighthouseResult;
    const categories = lighthouseResult.categories;
    const audits = lighthouseResult.audits;

    const score = Math.round(categories.performance.score * 100);
    const lcp = audits['largest-contentful-paint'].numericValue;
    const fcp = audits['first-contentful-paint'].numericValue;
    const cls = audits['cumulative-layout-shift'].numericValue;
    const ttfb = audits['server-response-time'].numericValue;
    const tbt = audits['total-blocking-time']?.numericValue || 0;
    const si = audits['speed-index']?.numericValue || 0;

    // We can extract specific audits that failed to feed into the AI
    const failedAudits = Object.values(audits).filter((audit: any) => audit.score !== null && audit.score < 0.9);

    const recommendations = await generateAdvancedRecommendations(failedAudits as any[], url);

    // Additional checks — now includes compression & caching
    const [additionalChecks, compressionData, cachingData] = await Promise.all([
      runAdditionalAudits(url),
      analyzeCompression(url).catch(() => null),
      analyzeCaching(url).catch(() => null)
    ]);

    // Extract network requests for waterfall
    const networkRequests = audits['network-requests']?.details?.items || [];

    return {
      url,
      score,
      metrics: {
        lcp,
        fcp,
        cls,
        ttfb,
        tbt,
        si
      },
      recommendations,
      additionalChecks: {
        ...additionalChecks,
        compression: compressionData ? {
          gzip: compressionData.gzip,
          brotli: compressionData.brotli,
          ratio: compressionData.compressionRatio
        } : null,
        caching: cachingData ? {
          score: cachingData.score,
          hasEtag: cachingData.etag,
          cacheControl: !!cachingData.cacheControl
        } : null
      },
      networkRequests
    };
  } catch (error) {
    console.error("Error analyzing URL:", error);
    throw new Error('Failed to analyze the URL. Please check the URL and try again.');
  }
};

const runAdditionalAudits = async (url: string) => {
    try {
        const response = await axios.get(url, { timeout: 5000 });
        const headers = response.headers;
        const html = response.data;

        const checks = {
            security: {
                csp: !!headers['content-security-policy'],
                hsts: !!headers['strict-transport-security'],
                xframe: !!headers['x-frame-options'],
                nosniff: !!headers['x-content-type-options'],
            },
            seo: {
                hasTitle: /<title>/.test(html),
                hasMetaDesc: /<meta name="description"/.test(html),
                hasH1: /<h1/.test(html),
                hasCanonical: /<link[^>]+rel\s*=\s*["']canonical["']/.test(html),
                hasOpenGraph: /<meta[^>]+property\s*=\s*["']og:/.test(html),
            },
            performance: {
                hasServiceWorker: /navigator\.serviceWorker/.test(html),
                hasPreconnect: /<link[^>]+rel\s*=\s*["']preconnect["']/.test(html),
                hasPreload: /<link[^>]+rel\s*=\s*["']preload["']/.test(html),
                hasDnsPrefetch: /<link[^>]+rel\s*=\s*["']dns-prefetch["']/.test(html),
            }
        };
        return checks;
    } catch (e) {
        return null;
    }
}

const getMockData = async (url: string) => {
  // Simulate network delay
  return new Promise<any>((resolve) => {
    setTimeout(() => {
      resolve({
        url,
        score: Math.floor(Math.random() * 40) + 40, // 40-80
        metrics: {
          lcp: Math.floor(Math.random() * 3000) + 1000,
          fcp: Math.floor(Math.random() * 1500) + 500,
          cls: Math.random() * 0.3,
          ttfb: Math.floor(Math.random() * 800) + 100,
          tbt: Math.floor(Math.random() * 500) + 50,
          si: Math.floor(Math.random() * 3000) + 1000
        },
        recommendations: [
          { issue: "Large images delaying LCP", impact: "High", recommendation: "Convert images to WebP/AVIF format and ensure proper sizing.", explanation: "Large unoptimized images are the #1 cause of slow LCP. Modern formats like WebP reduce file sizes by 25-35% and AVIF by up to 50% compared to JPEG.", impactScore: 85, predictedImprovement: 10, codeSnippet: "<picture>\n  <source srcset='image.avif' type='image/avif'>\n  <source srcset='image.webp' type='image/webp'>\n  <img src='image.jpg' alt='description'>\n</picture>" },
          { issue: "Render-blocking resources", impact: "High", recommendation: "Defer or inline critical CSS and JS.", explanation: "Scripts and stylesheets in <head> without async/defer block rendering. The browser cannot paint anything until these resources are downloaded and parsed.", impactScore: 90, predictedImprovement: 15, codeSnippet: "<script defer src='app.js'></script>\n<link rel='preload' as='style' href='styles.css' onload='this.rel=\"stylesheet\"'>" },
          { issue: "No text compression", impact: "High", recommendation: "Enable Gzip/Brotli compression on server.", explanation: "Text-based resources (HTML, CSS, JS) should be compressed in transit. Brotli offers 15-25% better compression than Gzip.", impactScore: 80, predictedImprovement: 8, codeSnippet: "# Nginx config\ngzip on;\ngzip_types text/plain text/css application/json application/javascript;\nbrotli on;\nbrotli_types text/plain text/css application/json;" },
          { issue: "Missing cache headers", impact: "Medium", recommendation: "Add Cache-Control headers for static assets.", explanation: "Without proper caching, browsers re-download all assets on every visit. Use immutable + max-age for versioned static assets.", impactScore: 65, predictedImprovement: 5, codeSnippet: "# Cache static assets for 1 year\nCache-Control: public, max-age=31536000, immutable\n\n# Cache HTML with revalidation\nCache-Control: no-cache\nETag: \"abc123\"" },
          { issue: "No CDN detected", impact: "Medium", recommendation: "Deploy static assets behind a CDN for global edge delivery.", explanation: "CDNs serve content from the nearest edge server, reducing latency by 50-70% for geographically distributed users.", impactScore: 60, predictedImprovement: 5, codeSnippet: "// Cloudflare Workers example\naddEventListener('fetch', event => {\n  event.respondWith(\n    caches.match(event.request).then(r => r || fetch(event.request))\n  );\n});" }
        ],
        networkRequests: [
          { url: url, resourceType: "Document", startTime: 0, endTime: 100, transferSize: 15000 },
          { url: "https://example.com/style.css", resourceType: "Stylesheet", startTime: 50, endTime: 250, transferSize: 25000 },
          { url: "https://example.com/app.js", resourceType: "Script", startTime: 100, endTime: 400, transferSize: 85000 },
          { url: "https://example.com/hero.png", resourceType: "Image", startTime: 200, endTime: 800, transferSize: 500000 },
          { url: "https://fonts.googleapis.com/css2", resourceType: "Stylesheet", startTime: 120, endTime: 280, transferSize: 12000 },
          { url: "https://example.com/analytics.js", resourceType: "Script", startTime: 300, endTime: 450, transferSize: 32000 }
        ],
        additionalChecks: {
          security: { csp: false, hsts: true, xframe: true, nosniff: true },
          seo: { hasTitle: true, hasMetaDesc: false, hasH1: true, hasCanonical: false, hasOpenGraph: false },
          performance: { hasServiceWorker: false, hasPreconnect: true, hasPreload: false, hasDnsPrefetch: true },
          compression: { gzip: true, brotli: false, ratio: 65 },
          caching: { score: 35, hasEtag: false, cacheControl: false }
        }
      });
    }, 2000);
  });
};
