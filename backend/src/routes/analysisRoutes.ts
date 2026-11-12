import express from 'express';
import { analyze, compare, getHistory, getReport } from '../controllers/analysisController';
import { authenticate } from '../middleware/authMiddleware';

import { validateUrl } from '../middleware/validationMiddleware';

const router = express.Router();

router.post('/analyze', authenticate, validateUrl, analyze);
router.post('/compare', authenticate, compare);
router.get('/history', authenticate, getHistory);
router.get('/report/:id', authenticate, getReport);

export default router;
