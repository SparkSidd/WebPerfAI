import axios from 'axios';
import { URL } from 'url';

export interface FeatureExtraction {
  url: string;
  meta: { title: string|null; description: string|null; canonical: string|null; viewport: string|null; robots: string|null; generator: string|null; language: string|null; charset: string|null; };
  performance: { htmlSize: number; responseTime: number; serverSoftware: string|null; redirectCount: number; domElements: number; };
  resources: { totalScripts: number; totalStylesheets: number; totalImages: number; inlineScripts: number; inlineStyles: number; thirdPartyDomains: string[]; };
  technology: { frameworks: string[]; libraries: string[]; analytics: string[]; cms: string|null; server: string|null; };
  accessibility: { imagesWithoutAlt: number; totalImages: number; hasLangAttribute: boolean; ariaLandmarks: number; };
  mobile: { hasViewport: boolean; viewportContent: string|null; hasManifest: boolean; };
}

export const extractFeatures = async (url: string): Promise<FeatureExtraction> => {
  const start = Date.now();
  const resp = await axios.get(url, { timeout: 15000, maxRedirects: 5, headers: { 'User-Agent': 'OptiWebBot/1.0' } });
  const html: string = resp.data;
  const headers = resp.headers;
  const urlObj = new URL(url);

  const extractMeta = (name: string, attr='name'): string|null => {
    const r1 = new RegExp(`<meta[^>]+${attr}\\s*=\\s*["']${name}["'][^>]+content\\s*=\\s*["']([^"']+)["']`, 'i');
    const r2 = new RegExp(`<meta[^>]+content\\s*=\\s*["']([^"']+)["'][^>]+${attr}\\s*=\\s*["']${name}["']`, 'i');
    const m = r1.exec(html) || r2.exec(html);
    return m ? m[1].trim() : null;
  };

  const titleMatch = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  const meta = {
    title: titleMatch ? titleMatch[1].trim() : null,
    description: extractMeta('description'),
    canonical: null as string|null,
    viewport: extractMeta('viewport'),
    robots: extractMeta('robots'),
    generator: extractMeta('generator'),
    language: (/<html[^>]+lang\s*=\s*["']([^"']+)/i.exec(html) || [])[1] || null,
    charset: (/<meta[^>]+charset\s*=\s*["']?([^"'\s>]+)/i.exec(html) || [])[1] || 'UTF-8',
  };

  const scripts = html.match(/<script[^>]*>/gi) || [];
  const stylesheets = html.match(/<link[^>]+stylesheet[^>]*>/gi) || [];
  const images = html.match(/<img[^>]*>/gi) || [];
  const inlineScripts = scripts.filter(s => !/\bsrc\s*=/i.test(s));
  const inlineStyles = html.match(/<style[\s\S]*?<\/style>/gi) || [];

  // third-party domains
  const srcRe = /(?:src|href)\s*=\s*["'](https?:\/\/[^"'\s]+)["']/gi;
  const tpDomains = new Set<string>();
  let sm;
  while ((sm = srcRe.exec(html)) !== null) {
    try { const d = new URL(sm[1]).hostname; if (d !== urlObj.hostname) tpDomains.add(d); } catch {}
  }

  // Technology
  const tech = { frameworks: [] as string[], libraries: [] as string[], analytics: [] as string[], cms: null as string|null, server: headers['server'] ? String(headers['server']) : null };
  if (/data-reactroot|__NEXT_DATA__|_next\/static/i.test(html)) { tech.frameworks.push('React'); if (/__NEXT_DATA__/i.test(html)) tech.frameworks.push('Next.js'); }
  if (/ng-version|ng-app/i.test(html)) tech.frameworks.push('Angular');
  if (/data-v-|__vue|_nuxt/i.test(html)) { tech.frameworks.push('Vue.js'); if (/_nuxt/i.test(html)) tech.frameworks.push('Nuxt.js'); }
  if (/jquery/i.test(html)) tech.libraries.push('jQuery');
  if (/bootstrap/i.test(html)) tech.libraries.push('Bootstrap');
  if (/tailwind/i.test(html)) tech.libraries.push('Tailwind CSS');
  if (/gtag|google-analytics/i.test(html)) tech.analytics.push('Google Analytics');
  if (/googletagmanager/i.test(html)) tech.analytics.push('GTM');
  if (/wp-content/i.test(html)) tech.cms = 'WordPress';
  else if (/cdn\.shopify/i.test(html)) tech.cms = 'Shopify';

  // Accessibility
  const imgsWithAlt = images.filter(img => /\balt\s*=/i.test(img));
  const ariaLandmarks = (html.match(/\brole\s*=\s*["'](banner|navigation|main|contentinfo|complementary|search)["']/gi) || []).length;

  return {
    url,
    meta,
    performance: { htmlSize: Buffer.byteLength(html), responseTime: Date.now() - start, serverSoftware: headers['server'] ? String(headers['server']) : null, redirectCount: 0, domElements: (html.match(/<[a-zA-Z][^>]*>/g) || []).length },
    resources: { totalScripts: scripts.length, totalStylesheets: stylesheets.length + inlineStyles.length, totalImages: images.length, inlineScripts: inlineScripts.length, inlineStyles: inlineStyles.length, thirdPartyDomains: Array.from(tpDomains) },
    technology: tech,
    accessibility: { imagesWithoutAlt: images.length - imgsWithAlt.length, totalImages: images.length, hasLangAttribute: !!meta.language, ariaLandmarks },
    mobile: { hasViewport: !!meta.viewport, viewportContent: meta.viewport, hasManifest: !!html.match(/<link[^>]+rel\s*=\s*["']manifest["']/i) }
  };
};
