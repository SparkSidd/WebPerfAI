import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { analyzeCompression } from '../services/compressionService';
import { analyzeCaching } from '../services/cachingService';
import { analyzeCDN } from '../services/cdnService';
import { analyzeRenderBlocking } from '../services/renderBlockingService';
import { extractFeatures } from '../services/featureExtractionService';
import { runOptimizationAlgorithm } from '../services/optimizationAlgorithm';
import { generatePdfReport } from '../services/pdfService';
import logger from '../utils/logger';

/** Full deep analysis — runs all optimization checks */
export const deepAnalyze = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { url } = req.body;
    if (!url) { res.status(400).json({ message: 'URL is required' }); return; }

    logger.info(`Deep analysis started for: ${url}`);
    const result = await runOptimizationAlgorithm(url);
    res.status(200).json(result);
  } catch (err: any) {
    logger.error(`Deep analysis failed: ${err.message}`);
    res.status(500).json({ message: 'Deep analysis failed: ' + err.message });
  }
};

/** Individual service: compression analysis */
export const getCompression = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { url } = req.body;
    if (!url) { res.status(400).json({ message: 'URL is required' }); return; }
    const result = await analyzeCompression(url);
    res.status(200).json(result);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

/** Individual service: caching analysis */
export const getCaching = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { url } = req.body;
    if (!url) { res.status(400).json({ message: 'URL is required' }); return; }
    const result = await analyzeCaching(url);
    res.status(200).json(result);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

/** Individual service: CDN detection */
export const getCDN = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { url } = req.body;
    if (!url) { res.status(400).json({ message: 'URL is required' }); return; }
    const result = await analyzeCDN(url);
    res.status(200).json(result);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

/** Individual service: render-blocking analysis */
export const getRenderBlocking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { url } = req.body;
    if (!url) { res.status(400).json({ message: 'URL is required' }); return; }
    const result = await analyzeRenderBlocking(url);
    res.status(200).json(result);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

/** Individual service: feature extraction */
export const getFeatures = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { url } = req.body;
    if (!url) { res.status(400).json({ message: 'URL is required' }); return; }
    const result = await extractFeatures(url);
    res.status(200).json(result);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

/** Generate PDF report from deep analysis */
export const generateReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { url } = req.body;
    if (!url) { res.status(400).json({ message: 'URL is required' }); return; }

    logger.info(`Generating PDF report for: ${url}`);
    const analysisData = await runOptimizationAlgorithm(url);
    const pdfBuffer = await generatePdfReport(analysisData);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="optiweb-report-${Date.now()}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (err: any) {
    logger.error(`Report generation failed: ${err.message}`);
    res.status(500).json({ message: 'Report generation failed: ' + err.message });
  }
};
