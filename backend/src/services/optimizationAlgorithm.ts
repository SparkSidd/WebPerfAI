import { analyzeCompression } from './compressionService';
import { analyzeCaching } from './cachingService';
import { analyzeCDN } from './cdnService';
import { analyzeRenderBlocking } from './renderBlockingService';
import { extractFeatures } from './featureExtractionService';
import logger from '../utils/logger';

export interface OptimizationScore {
  overall: number;
  categories: CategoryScore[];
  prioritizedActions: PrioritizedAction[];
  summary: string;
}

export interface CategoryScore {
  name: string;
  score: number;
  weight: number;
  details: string;
}

export interface PrioritizedAction {
  priority: number;
  category: string;
  action: string;
  impact: 'critical' | 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  estimatedGain: string;
}

/**
 * Runs the full optimization analysis and returns a prioritized, scored report
 */
export const runOptimizationAlgorithm = async (url: string) => {
  logger.info(`Running full optimization algorithm for: ${url}`);

  const [compression, caching, cdn, renderBlocking, features] = await Promise.allSettled([
    analyzeCompression(url),
    analyzeCaching(url),
    analyzeCDN(url),
    analyzeRenderBlocking(url),
    extractFeatures(url)
  ]);

  const comp = compression.status === 'fulfilled' ? compression.value : null;
  const cache = caching.status === 'fulfilled' ? caching.value : null;
  const cdnResult = cdn.status === 'fulfilled' ? cdn.value : null;
  const rb = renderBlocking.status === 'fulfilled' ? renderBlocking.value : null;
  const feat = features.status === 'fulfilled' ? features.value : null;

  // Category scores
  const categories: CategoryScore[] = [
    { name: 'Compression', score: comp ? (comp.gzip || comp.brotli ? (comp.brotli ? 95 : 70) : 10) : 0, weight: 0.2, details: comp?.brotli ? 'Brotli enabled' : comp?.gzip ? 'Gzip only' : 'No compression' },
    { name: 'Caching', score: cache?.score || 0, weight: 0.2, details: `${cache?.policies?.length || 0} cache policies detected` },
    { name: 'CDN', score: cdnResult?.score || 0, weight: 0.2, details: cdnResult?.detected ? `${cdnResult.provider} detected` : 'No CDN' },
    { name: 'Render Blocking', score: rb?.score || 0, weight: 0.2, details: `${rb?.totalBlockingResources || '?'} blocking resources` },
    { name: 'Resource Efficiency', score: feat ? Math.min(100, Math.max(0, 100 - (feat.resources.totalScripts * 3) - (feat.resources.thirdPartyDomains.length * 5))) : 50, weight: 0.2, details: feat ? `${feat.resources.totalScripts} scripts, ${feat.resources.thirdPartyDomains.length} 3rd-party domains` : 'N/A' }
  ];

  const overall = Math.round(categories.reduce((sum, c) => sum + c.score * c.weight, 0));

  // Build prioritized actions
  const actions: PrioritizedAction[] = [];
  let p = 1;

  if (comp && !comp.brotli && !comp.gzip) {
    actions.push({ priority: p++, category: 'Compression', action: 'Enable Gzip or Brotli compression on your server', impact: 'critical', effort: 'low', estimatedGain: '60-80% transfer size reduction' });
  } else if (comp && !comp.brotli) {
    actions.push({ priority: p++, category: 'Compression', action: 'Upgrade from Gzip to Brotli for better compression', impact: 'medium', effort: 'low', estimatedGain: '15-25% additional size reduction' });
  }

  if (rb && rb.blockingScripts.length > 0) {
    actions.push({ priority: p++, category: 'Render Blocking', action: `Defer/async ${rb.blockingScripts.length} render-blocking scripts`, impact: 'high', effort: 'medium', estimatedGain: `~${rb.estimatedBlockingTime}ms faster render` });
  }
  if (rb && rb.blockingStylesheets.length > 0) {
    actions.push({ priority: p++, category: 'Render Blocking', action: `Inline critical CSS and async-load ${rb.blockingStylesheets.length} stylesheets`, impact: 'high', effort: 'high', estimatedGain: `~${rb.blockingStylesheets.length * 150}ms faster FCP` });
  }

  if (cache && cache.score < 50) {
    actions.push({ priority: p++, category: 'Caching', action: 'Implement proper Cache-Control headers with max-age and immutable for static assets', impact: 'high', effort: 'low', estimatedGain: 'Eliminate repeat downloads for returning visitors' });
  }
  if (cache && !cache.etag) {
    actions.push({ priority: p++, category: 'Caching', action: 'Enable ETag headers for conditional caching', impact: 'medium', effort: 'low', estimatedGain: 'Efficient revalidation with 304 responses' });
  }

  if (cdnResult && !cdnResult.detected) {
    actions.push({ priority: p++, category: 'CDN', action: 'Deploy assets behind a CDN (Cloudflare, CloudFront, etc.)', impact: 'high', effort: 'medium', estimatedGain: '50-70% latency reduction for global users' });
  }

  if (feat && feat.resources.thirdPartyDomains.length > 5) {
    actions.push({ priority: p++, category: 'Resources', action: `Reduce third-party dependencies (${feat.resources.thirdPartyDomains.length} domains detected)`, impact: 'medium', effort: 'high', estimatedGain: 'Reduced DNS lookups and connection overhead' });
  }
  if (feat && feat.resources.totalScripts > 15) {
    actions.push({ priority: p++, category: 'Resources', action: `Bundle or reduce ${feat.resources.totalScripts} script files`, impact: 'medium', effort: 'medium', estimatedGain: 'Fewer HTTP requests and faster parsing' });
  }

  const summary = overall >= 80 ? 'Excellent optimization level. Minor tweaks recommended.' :
                   overall >= 60 ? 'Good foundation but several optimization opportunities exist.' :
                   overall >= 40 ? 'Moderate optimization. Multiple high-impact improvements available.' :
                   'Poor optimization. Critical improvements needed for competitive performance.';

  return {
    url,
    overall,
    categories,
    prioritizedActions: actions,
    summary,
    details: { compression: comp, caching: cache, cdn: cdnResult, renderBlocking: rb, features: feat }
  };
};
