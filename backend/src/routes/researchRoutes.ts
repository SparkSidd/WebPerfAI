import { Router } from 'express';
import { queryResearch } from '../controllers/researchController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.post('/query', authenticate, queryResearch);

export default router;
