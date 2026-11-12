import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import {
  deepAnalyze,
  getCompression,
  getCaching,
  getCDN,
  getRenderBlocking,
  getFeatures,
  generateReport
} from '../controllers/deepAnalysisController';

import { validateUrl } from '../middleware/validationMiddleware';

const router = Router();

// Full deep analysis (runs all checks)
router.post('/full', authenticate, validateUrl, deepAnalyze);

// Individual analysis endpoints
router.post('/compression', authenticate, validateUrl, getCompression);
router.post('/caching', authenticate, validateUrl, getCaching);
router.post('/cdn', authenticate, validateUrl, getCDN);
router.post('/render-blocking', authenticate, validateUrl, getRenderBlocking);
router.post('/features', authenticate, validateUrl, getFeatures);

// PDF report generation
router.post('/report/pdf', authenticate, validateUrl, generateReport);

export default router;
