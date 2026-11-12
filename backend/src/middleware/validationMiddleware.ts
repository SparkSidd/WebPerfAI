import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import logger from '../utils/logger';

export const validateUrl = [
  body('url')
    .isURL({ require_tld: true, require_protocol: true })
    .withMessage('A valid URL with protocol (http:// or https://) is required'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn(`Validation failed for URL: ${req.body?.url}`);
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

export const validateOptimizationCode = [
  body('code').notEmpty().withMessage('Code to optimize is required'),
  body('type').isIn(['javascript', 'html', 'css']).withMessage('Type must be javascript, html, or css'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];
