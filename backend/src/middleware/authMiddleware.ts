import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: { userId: string };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.header('Authorization');
  const token = authHeader?.split(' ')[1];

  console.log(`[Auth] Received Token: "${token}" from header: "${authHeader}"`);

  if (!token) {
    res.status(401).json({ message: 'No token, authorization denied' });
    return;
  }

  // Allow CLI or Developer mock tokens for testing
  if (token === 'CLI_MOCK_TOKEN' || token === 'developer-token') {
    req.user = { userId: 'dev-user-id' };
    next();
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as { userId: string };
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};
