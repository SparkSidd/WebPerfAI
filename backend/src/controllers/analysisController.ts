import { Response } from 'express';
import Report from '../models/Report';
import { AuthRequest } from '../middleware/authMiddleware';
import { analyzeUrl } from '../services/lighthouseService';
import logger from '../utils/logger';
import mongoose from 'mongoose';

export const analyze = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { url } = req.body;
    if (!url) {
      res.status(400).json({ message: 'URL is required' });
      return;
    }

    // Call service to get Lighthouse data & AI insights
    const analysisResult = await analyzeUrl(url);

    // Save report to database (without networkRequests to save space)
    const report = new Report({
      userId: req.user?.userId,
      url: analysisResult.url,
      score: analysisResult.score,
      metrics: analysisResult.metrics,
      recommendations: analysisResult.recommendations,
      additionalChecks: analysisResult.additionalChecks
    });
    
    if (mongoose.connection.readyState === 1) {
      await report.save();
      logger.info(`Successfully analyzed URL: ${url} for user: ${req.user?.userId}`);
    } else {
      logger.info(`DB not connected, skipping save for: ${url}`);
    }

    // Return the report along with transient networkRequests data
    res.status(200).json({
      ...report.toObject(),
      networkRequests: analysisResult.networkRequests
    });
  } catch (err: any) {
    logger.error(`Analysis failed for ${req.body.url}: ${err.message}`);
    res.status(500).json({ message: err.message || 'Error analyzing URL' });
  }
};

export const compare = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { url1, url2 } = req.body;
    if (!url1 || !url2) {
      res.status(400).json({ message: 'Two URLs are required for comparison' });
      return;
    }

    logger.info(`Comparing ${url1} vs ${url2}`);
    const [res1, res2] = await Promise.all([analyzeUrl(url1), analyzeUrl(url2)]);

    res.status(200).json({
      site1: res1,
      site2: res2,
      diff: {
        score: res1.score - res2.score,
        lcp: res1.metrics.lcp - res2.metrics.lcp,
        fcp: res1.metrics.fcp - res2.metrics.fcp
      }
    });
  } catch (err: any) {
    logger.error(`Comparison failed: ${err.message}`);
    res.status(500).json({ message: 'Comparison failed' });
  }
};

export const getHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const reports = await Report.find({ userId: req.user?.userId }).sort({ createdAt: -1 });
    res.status(200).json(reports);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const report = await Report.findOne({ _id: req.params.id, userId: req.user?.userId });
    if (!report) {
      res.status(404).json({ message: 'Report not found' });
      return;
    }
    res.status(200).json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
