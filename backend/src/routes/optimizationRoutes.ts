import { Router } from 'express';
import multer from 'multer';
import { optimizeImage, downloadOptimized, optimizeCode } from '../controllers/optimizationController';
import { authenticate } from '../middleware/authMiddleware';
import path from 'path';

import { validateOptimizationCode } from '../middleware/validationMiddleware';

const router = Router();
const upload = multer({ dest: path.join(__dirname, '../../uploads/') });

router.post('/image', authenticate, upload.single('image'), optimizeImage);
router.get('/download/:filename', downloadOptimized);
router.post('/code', authenticate, validateOptimizationCode, optimizeCode);

export default router;
