import axios from 'axios';
import logger from '../utils/logger';

export interface RenderBlockingAnalysis {
  blockingScripts: BlockingResource[];
  blockingStylesheets: BlockingResource[];
  totalBlockingResources: number;
  estimatedBlockingTime: number; // ms
  score: number; // 0-100
  recommendations: string[];
}

export interface BlockingResource {
  url: string;
  type: 'script' | 'stylesheet';
  size: string | null;
  isRenderBlocking: boolean;
  hasDefer: boolean;
  hasAsync: boolean;
  isInline: boolean;
  recommendation: string;
}

/**
 * Analyzes a webpage for render-blocking resources
 */
export const analyzeRenderBlocking = async (url: string): Promise<RenderBlockingAnalysis> => {
  const result: RenderBlockingAnalysis = {
    blockingScripts: [],
    blockingStylesheets: [],
    totalBlockingResources: 0,
    estimatedBlockingTime: 0,
    score: 100,
    recommendations: []
  };

  try {
    const response = await axios.get(url, { timeout: 15000 });
    const html: string = response.data;

    // Parse script tags
    const scriptRegex = /<script([^>]*)(?:>([\s\S]*?)<\/script>|\/>)/gi;
    let match;

    while ((match = scriptRegex.exec(html)) !== null) {
      const attrs = match[1] || '';
      const content = match[2] || '';
      
      const hasSrc = /\bsrc\s*=\s*["']([^"']+)["']/i.exec(attrs);
      const hasDefer = /\bdefer\b/i.test(attrs);
      const hasAsync = /\basync\b/i.test(attrs);
      const hasType = /\btype\s*=\s*["']([^"']+)["']/i.exec(attrs);
      const isModule = hasType && hasType[1] === 'module';
      const isInline = !hasSrc;

      // Skip non-JS scripts (like JSON-LD, templates etc.)
      if (hasType && !['text/javascript', 'application/javascript', 'module'].includes(hasType[1])) {
        continue;
      }

      const isBlocking = !hasDefer && !hasAsync && !isModule && hasSrc;

      if (isBlocking) {
        const scriptUrl = hasSrc ? hasSrc[1] : 'inline';
        result.blockingScripts.push({
          url: scriptUrl,
          type: 'script',
          size: null,
          isRenderBlocking: true,
          hasDefer: false,
          hasAsync: false,
          isInline,
          recommendation: `Add "defer" or "async" attribute to <script src="${scriptUrl.substring(0, 60)}...">`
        });
        result.estimatedBlockingTime += 100; // Rough estimate per blocking script
      }
    }

    // Parse stylesheets in <head>
    const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
    const headHtml = headMatch ? headMatch[1] : '';

    const linkRegex = /<link([^>]+)>/gi;
    while ((match = linkRegex.exec(headHtml)) !== null) {
      const attrs = match[1];
      const isStylesheet = /\brel\s*=\s*["']stylesheet["']/i.test(attrs);
      const hrefMatch = /\bhref\s*=\s*["']([^"']+)["']/i.exec(attrs);
      const hasMedia = /\bmedia\s*=\s*["']([^"']+)["']/i.exec(attrs);
      const isPreload = /\brel\s*=\s*["']preload["']/i.test(attrs);

      if (isStylesheet && hrefMatch && !isPreload) {
        // Check if media query limits it (e.g., print stylesheets aren't render-blocking)
        const mediaValue = hasMedia ? hasMedia[1] : 'all';
        const isBlocking = mediaValue === 'all' || mediaValue === 'screen' || !hasMedia;

        if (isBlocking) {
          result.blockingStylesheets.push({
            url: hrefMatch[1],
            type: 'stylesheet',
            size: null,
            isRenderBlocking: true,
            hasDefer: false,
            hasAsync: false,
            isInline: false,
            recommendation: `Consider inlining critical CSS and loading "${hrefMatch[1].substring(0, 60)}" asynchronously with media="print" onload="this.media='all'"`
          });
          result.estimatedBlockingTime += 150; // Rough estimate per blocking CSS
        }
      }
    }

    // Check for inline styles (good pattern — reduces render-blocking)
    const inlineStyleCount = (headHtml.match(/<style[\s\S]*?<\/style>/gi) || []).length;

    result.totalBlockingResources = result.blockingScripts.length + result.blockingStylesheets.length;

    // Scoring
    if (result.totalBlockingResources === 0) {
      result.score = 100;
    } else if (result.totalBlockingResources <= 2) {
      result.score = 75;
    } else if (result.totalBlockingResources <= 5) {
      result.score = 50;
    } else {
      result.score = Math.max(10, 100 - (result.totalBlockingResources * 10));
    }

    // Recommendations
    if (result.blockingScripts.length > 0) {
      result.recommendations.push(`Found ${result.blockingScripts.length} render-blocking script(s). Add "defer" or "async" attributes to non-critical scripts.`);
      result.recommendations.push('Use <script type="module"> for ES modules — they are deferred by default.');
      result.recommendations.push('Move non-critical scripts to the end of <body> or load them dynamically.');
    }

    if (result.blockingStylesheets.length > 0) {
      result.recommendations.push(`Found ${result.blockingStylesheets.length} render-blocking stylesheet(s).`);
      result.recommendations.push('Inline critical CSS directly in <head> and load remaining CSS asynchronously.');
      result.recommendations.push('Use <link rel="preload" as="style"> followed by onload handler to convert to stylesheet.');
    }

    if (inlineStyleCount > 0) {
      result.recommendations.push(`Good: Found ${inlineStyleCount} inline <style> block(s) in <head> — this helps avoid FOUC and reduces render-blocking.`);
    }

    if (result.totalBlockingResources === 0) {
      result.recommendations.push('Excellent! No render-blocking resources detected in the initial HTML.');
    }

  } catch (err: any) {
    logger.warn(`Render-blocking analysis failed for ${url}: ${err.message}`);
    result.recommendations.push('Could not analyze render-blocking resources. Ensure the site is accessible.');
    result.score = 0;
  }

  return result;
};
