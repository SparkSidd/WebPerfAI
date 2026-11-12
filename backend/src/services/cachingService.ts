import axios from 'axios';
import logger from '../utils/logger';

export interface CachingAnalysis {
  cacheControl: string | null;
  expires: string | null;
  etag: boolean;
  lastModified: boolean;
  pragma: string | null;
  vary: string | null;
  age: number | null;
  cdnCache: string | null;
  score: number; // 0-100
  policies: CachePolicy[];
  recommendations: string[];
}

export interface CachePolicy {
  directive: string;
  value: string;
  status: 'good' | 'warning' | 'bad';
  explanation: string;
}

/**
 * Analyzes caching headers and policies for a given URL
 */
export const analyzeCaching = async (url: string): Promise<CachingAnalysis> => {
  const result: CachingAnalysis = {
    cacheControl: null,
    expires: null,
    etag: false,
    lastModified: false,
    pragma: null,
    vary: null,
    age: null,
    cdnCache: null,
    score: 0,
    policies: [],
    recommendations: []
  };

  try {
    const response = await axios.get(url, {
      timeout: 10000,
      maxRedirects: 5
    });
    const headers = response.headers;

    // Extract caching headers
    result.cacheControl = headers['cache-control'] ? String(headers['cache-control']) : null;
    result.expires = headers['expires'] ? String(headers['expires']) : null;
    result.etag = !!headers['etag'];
    result.lastModified = !!headers['last-modified'];
    result.pragma = headers['pragma'] ? String(headers['pragma']) : null;
    result.vary = headers['vary'] ? String(headers['vary']) : null;
    result.age = headers['age'] ? parseInt(String(headers['age'])) : null;
    result.cdnCache = (headers['x-cache'] || headers['cf-cache-status'] || headers['x-cdn']) ? String(headers['x-cache'] || headers['cf-cache-status'] || headers['x-cdn']) : null;

    let score = 0;

    // Analyze Cache-Control
    if (result.cacheControl) {
      const directives = result.cacheControl.split(',').map(d => d.trim().toLowerCase());
      
      for (const directive of directives) {
        if (directive.startsWith('max-age=')) {
          const maxAge = parseInt(directive.split('=')[1]);
          if (maxAge >= 31536000) {
            result.policies.push({ directive: 'max-age', value: `${maxAge}s (1 year+)`, status: 'good', explanation: 'Long-lived cache for immutable assets' });
            score += 25;
          } else if (maxAge >= 86400) {
            result.policies.push({ directive: 'max-age', value: `${maxAge}s (${Math.round(maxAge/86400)} days)`, status: 'good', explanation: 'Reasonable cache duration' });
            score += 20;
          } else if (maxAge > 0) {
            result.policies.push({ directive: 'max-age', value: `${maxAge}s (${Math.round(maxAge/3600)} hours)`, status: 'warning', explanation: 'Short cache duration, may cause unnecessary revalidation' });
            score += 10;
          } else {
            result.policies.push({ directive: 'max-age', value: '0', status: 'bad', explanation: 'No caching enabled via max-age' });
          }
        }
        
        if (directive === 'no-cache') {
          result.policies.push({ directive: 'no-cache', value: 'enabled', status: 'warning', explanation: 'Content must be revalidated with the server before use' });
          score += 5;
        }
        
        if (directive === 'no-store') {
          result.policies.push({ directive: 'no-store', value: 'enabled', status: 'bad', explanation: 'Content is never cached - acceptable for sensitive data only' });
        }
        
        if (directive === 'immutable') {
          result.policies.push({ directive: 'immutable', value: 'enabled', status: 'good', explanation: 'Browser will not revalidate even on reload' });
          score += 15;
        }
        
        if (directive.startsWith('s-maxage=')) {
          const sMaxAge = parseInt(directive.split('=')[1]);
          result.policies.push({ directive: 's-maxage', value: `${sMaxAge}s`, status: 'good', explanation: 'Shared cache (CDN) has specific max-age' });
          score += 10;
        }
        
        if (directive === 'public') {
          result.policies.push({ directive: 'public', value: 'enabled', status: 'good', explanation: 'Response can be cached by any cache' });
          score += 5;
        }
        
        if (directive === 'private') {
          result.policies.push({ directive: 'private', value: 'enabled', status: 'warning', explanation: 'Only browser cache, not shared/CDN cache' });
          score += 5;
        }

        if (directive === 'must-revalidate') {
          result.policies.push({ directive: 'must-revalidate', value: 'enabled', status: 'good', explanation: 'Stale responses must be revalidated' });
          score += 5;
        }

        if (directive.startsWith('stale-while-revalidate=')) {
          const swr = parseInt(directive.split('=')[1]);
          result.policies.push({ directive: 'stale-while-revalidate', value: `${swr}s`, status: 'good', explanation: 'Serves stale content while revalidating in background — excellent UX' });
          score += 10;
        }
      }
    } else {
      result.policies.push({ directive: 'cache-control', value: 'missing', status: 'bad', explanation: 'No Cache-Control header found' });
      result.recommendations.push('Add Cache-Control headers to all responses. For static assets: "public, max-age=31536000, immutable". For HTML: "no-cache" with ETag validation.');
    }

    // ETag
    if (result.etag) {
      result.policies.push({ directive: 'etag', value: 'present', status: 'good', explanation: 'Enables efficient conditional requests (304 Not Modified)' });
      score += 10;
    } else {
      result.recommendations.push('Enable ETag headers for efficient cache revalidation via conditional requests (If-None-Match).');
    }

    // Last-Modified
    if (result.lastModified) {
      result.policies.push({ directive: 'last-modified', value: 'present', status: 'good', explanation: 'Enables conditional requests via If-Modified-Since' });
      score += 5;
    }

    // CDN Cache
    if (result.cdnCache) {
      result.policies.push({ directive: 'cdn-cache', value: result.cdnCache, status: 'good', explanation: 'CDN caching detected' });
      score += 10;
    }

    // Recommendations
    if (!result.cacheControl && !result.expires) {
      result.recommendations.push('CRITICAL: No caching policy detected. Every visitor downloads all assets on every page load.');
    }

    if (result.pragma === 'no-cache') {
      result.recommendations.push('Remove the Pragma: no-cache header — it is deprecated and replaced by Cache-Control.');
    }

    if (!result.vary || !result.vary.includes('Accept-Encoding')) {
      result.recommendations.push('Add "Vary: Accept-Encoding" to ensure proper caching of compressed/uncompressed variants.');
    }

    result.score = Math.min(100, score);

  } catch (err: any) {
    logger.warn(`Caching analysis failed for ${url}: ${err.message}`);
    result.recommendations.push('Could not analyze caching headers. Ensure the site is accessible.');
  }

  return result;
};
