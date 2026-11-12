import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/authRoutes';
import analysisRoutes from './routes/analysisRoutes';
import researchRoutes from './routes/researchRoutes';
import optimizationRoutes from './routes/optimizationRoutes';
import deepAnalysisRoutes from './routes/deepAnalysisRoutes';
import { errorHandler } from './middleware/errorMiddleware';
import logger from './utils/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Global rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' }
});

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiting to API routes
app.use('/api/', apiLimiter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    version: '2.0.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    dbConnected: mongoose.connection.readyState === 1
  });
});

// Root route
app.get('/', (_req, res) => {
  res.send('<h1>OptiWeb AI Backend is Running</h1><p>Visit <a href="http://localhost:5173">http://localhost:5173</a> for the frontend.</p>');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/research', researchRoutes);
app.use('/api/optimize', optimizationRoutes);
app.use('/api/deep', deepAnalysisRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/web-perf-optimizer';
mongoose.connect(MONGODB_URI)
  .then(() => {
    logger.info('Connected to MongoDB');
    startServer();
  })
  .catch((err) => {
    logger.warn(`MongoDB connection failed: ${err.message}. Starting in offline mode.`);
    startServer();
  });

function startServer() {
  app.listen(PORT, () => {
    logger.info(`🚀 OptiWeb AI Server v2.0.0 running on port ${PORT}`);
    logger.info(`📊 Deep Analysis API: http://localhost:${PORT}/api/deep/full`);
    logger.info(`📄 PDF Reports: http://localhost:${PORT}/api/deep/report/pdf`);
    logger.info(`🔍 Feature Extraction: http://localhost:${PORT}/api/deep/features`);
  });
}
