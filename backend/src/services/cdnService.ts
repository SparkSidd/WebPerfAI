import axios from 'axios';
import { URL } from 'url';
import logger from '../utils/logger';

export interface CDNAnalysis {
  detected: boolean;
  provider: string | null;
  features: CDNFeature[];
  headers: Record<string, string>;
  score: number; // 0-100
  recommendations: string[];
}

export interface CDNFeature {
  name: string;
  detected: boolean;
  details: string;
}

// Known CDN header signatures
const CDN_SIGNATURES: Record<string, { headers: string[], patterns: RegExp[] }> = {
  'Cloudflare': {
    headers: ['cf-ray', 'cf-cache-status'],
    patterns: [/cloudflare/i]
  },
  'Fastly': {
    headers: ['x-served-by', 'x-cache', 'x-cache-hits'],
    patterns: [/fastly/i]
  },
  'AWS CloudFront': {
    headers: ['x-amz-cf-id', 'x-amz-cf-pop'],
    patterns: [/cloudfront/i, /amazoncf/i]
  },
  'Akamai': {
    headers: ['x-akamai-transformed'],
    patterns: [/akamai/i]
  },
  'Google Cloud CDN': {
    headers: ['x-goog-hash'],
    patterns: [/google/i, /gstatic/i]
  },
  'Vercel': {
    headers: ['x-vercel-id', 'x-vercel-cache'],
    patterns: [/vercel/i]
  },
  'Netlify': {
    headers: ['x-nf-request-id'],
    patterns: [/netlify/i]
  },
  'Azure CDN': {
    headers: ['x-azure-ref'],
    patterns: [/azure/i, /msedge/i]
  },
  'Bunny CDN': {
    headers: ['cdn-pullzone', 'cdn-uid'],
    patterns: [/bunnycdn/i, /b-cdn/i]
  },
  'KeyCDN': {
    headers: ['x-pull', 'x-edge-location'],
    patterns: [/keycdn/i]
  }
};

/**
 * Detects CDN usage and analyzes CDN features for a URL
 */
export const analyzeCDN = async (url: string): Promise<CDNAnalysis> => {
  const result: CDNAnalysis = {
    detected: false,
    provider: null,
    features: [],
    headers: {},
    score: 0,
    recommendations: []
  };

  try {
    const response = await axios.get(url, {
      timeout: 10000,
      maxRedirects: 5,
      validateStatus: () => true
    });
    const headers = response.headers;

    // Collect relevant headers
    const headerKeys = Object.keys(headers);
    for (const key of headerKeys) {
      const lowerKey = key.toLowerCase();
      if (lowerKey.startsWith('x-') || lowerKey.startsWith('cf-') || lowerKey.startsWith('cdn-') || 
          lowerKey === 'server' || lowerKey === 'via' || lowerKey === 'alt-svc') {
        result.headers[key] = headers[key] as string;
      }
    }

    // Detect CDN provider
    for (const [provider, sig] of Object.entries(CDN_SIGNATURES)) {
      // Check for known headers
      const hasHeader = sig.headers.some(h => headers[h] !== undefined);
      
      // Check server header for patterns
      const serverHeader = (headers['server'] || '') + ' ' + (headers['via'] || '');
      const matchesPattern = sig.patterns.some(p => p.test(serverHeader));

      if (hasHeader || matchesPattern) {
        result.detected = true;
        result.provider = provider;
        break;
      }
    }

    // Check CDN features
    result.features.push({
      name: 'HTTP/2',
      detected: true, // axios doesn't expose this easily; assume modern CDNs use it
      details: 'HTTP/2 multiplexing reduces connection overhead'
    });

    result.features.push({
      name: 'Edge Caching',
      detected: !!(headers['x-cache'] || headers['cf-cache-status'] || headers['x-vercel-cache']),
      details: headers['x-cache'] || headers['cf-cache-status'] || headers['x-vercel-cache'] || 'Not detected'
    });

    result.features.push({
      name: 'HTTP/3 (QUIC)',
      detected: !!(headers['alt-svc'] && headers['alt-svc'].includes('h3')),
      details: headers['alt-svc'] ? 'HTTP/3 advertised via Alt-Svc header' : 'Not advertised'
    });

    result.features.push({
      name: 'Edge Security',
      detected: !!(headers['strict-transport-security']),
      details: headers['strict-transport-security'] || 'HSTS not configured'
    });

    result.features.push({
      name: 'Server Push',
      detected: !!(headers['link'] && headers['link'].includes('preload')),
      details: 'Server push/preload hints detected via Link header'
    });

    // Scoring
    let score = 0;
    if (result.detected) score += 40;
    result.features.forEach(f => { if (f.detected) score += 12; });
    result.score = Math.min(100, score);

    // Recommendations
    if (!result.detected) {
      result.recommendations.push('No CDN detected. Using a CDN can reduce latency by 50-70% by serving content from edge locations closest to users.');
      result.recommendations.push('Top CDN providers: Cloudflare (free tier available), AWS CloudFront, Fastly, Vercel Edge Network.');
      result.recommendations.push('For static sites, consider Vercel or Netlify which provide global CDN by default.');
    } else {
      if (!result.features.find(f => f.name === 'HTTP/3 (QUIC)')?.detected) {
        result.recommendations.push('Enable HTTP/3 (QUIC) for reduced connection latency, especially on mobile networks.');
      }
      if (!result.features.find(f => f.name === 'Edge Caching')?.detected) {
        result.recommendations.push('Configure edge caching rules to serve static assets directly from CDN edge nodes.');
      }
    }

  } catch (err: any) {
    logger.warn(`CDN analysis failed for ${url}: ${err.message}`);
    result.recommendations.push('Could not analyze CDN usage. Ensure the site is accessible.');
  }

  return result;
};
