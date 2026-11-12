import axios from 'axios';
import logger from '../utils/logger';

export interface CompressionAnalysis {
  gzip: boolean;
  brotli: boolean;
  contentEncoding: string | null;
  transferSize: number | null;
  uncompressedSize: number | null;
  compressionRatio: number | null;
  recommendations: string[];
}

/**
 * Analyzes a URL for Gzip/Brotli compression support
 */
export const analyzeCompression = async (url: string): Promise<CompressionAnalysis> => {
  const result: CompressionAnalysis = {
    gzip: false,
    brotli: false,
    contentEncoding: null,
    transferSize: null,
    uncompressedSize: null,
    compressionRatio: null,
    recommendations: []
  };

  try {
    // Test Brotli support
    const brotliResponse = await axios.get(url, {
      headers: { 'Accept-Encoding': 'br' },
      timeout: 10000,
      decompress: false,
      responseType: 'arraybuffer'
    });
    const brotliEncoding = String(brotliResponse.headers['content-encoding'] || '');
    if (brotliEncoding.includes('br')) {
      result.brotli = true;
      result.contentEncoding = 'br';
      result.transferSize = (brotliResponse.data as Buffer).length;
    }

    // Test Gzip support
    const gzipResponse = await axios.get(url, {
      headers: { 'Accept-Encoding': 'gzip' },
      timeout: 10000,
      decompress: false,
      responseType: 'arraybuffer'
    });
    const gzipEncoding = String(gzipResponse.headers['content-encoding'] || '');
    if (gzipEncoding.includes('gzip')) {
      result.gzip = true;
      if (!result.contentEncoding) {
        result.contentEncoding = 'gzip';
        result.transferSize = (gzipResponse.data as Buffer).length;
      }
    }

    // Get uncompressed size
    const plainResponse = await axios.get(url, {
      headers: { 'Accept-Encoding': 'identity' },
      timeout: 10000,
      decompress: false,
      responseType: 'arraybuffer'
    });
    result.uncompressedSize = (plainResponse.data as Buffer).length;

    if (result.transferSize && result.uncompressedSize) {
      result.compressionRatio = Math.round(((result.uncompressedSize - result.transferSize) / result.uncompressedSize) * 100);
    }

    // Generate recommendations
    if (!result.brotli && !result.gzip) {
      result.recommendations.push('CRITICAL: No compression detected. Enable Gzip or Brotli compression on your server to reduce transfer sizes by 60-80%.');
      result.recommendations.push('For Nginx: add "gzip on; gzip_types text/plain text/css application/json application/javascript;" to your config.');
      result.recommendations.push('For Apache: enable mod_deflate and add appropriate MIME types.');
    } else if (!result.brotli) {
      result.recommendations.push('Brotli compression not detected. Brotli typically achieves 15-25% better compression than Gzip for text-based assets.');
      result.recommendations.push('For Nginx: install ngx_brotli module and add "brotli on; brotli_types text/plain text/css application/json application/javascript;"');
    }

    if (result.compressionRatio !== null && result.compressionRatio < 50) {
      result.recommendations.push(`Current compression ratio is only ${result.compressionRatio}%. Consider increasing compression level or reviewing content types being compressed.`);
    }

  } catch (err: any) {
    logger.warn(`Compression analysis partial failure for ${url}: ${err.message}`);
    result.recommendations.push('Could not fully analyze compression. Ensure the site is accessible.');
  }

  return result;
};
