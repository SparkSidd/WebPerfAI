import { Response, Request } from 'express';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { minify } from 'html-minifier-terser';
import { minify as minifyJs } from 'terser';
const CleanCSS = require('clean-css');
import logger from '../utils/logger';

const UPLOADS_DIR = path.join(__dirname, '../../uploads');
const OPTIMIZED_DIR = path.join(__dirname, '../../optimized');

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(OPTIMIZED_DIR)) fs.mkdirSync(OPTIMIZED_DIR, { recursive: true });

export const optimizeImage = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No image file uploaded' });
      return;
    }

    const inputPath = req.file.path;
    const format = (req.body.format || 'webp').toLowerCase();
    const quality = parseInt(req.body.quality) || 80;
    const width = req.body.width ? parseInt(req.body.width) : undefined;
    const height = req.body.height ? parseInt(req.body.height) : undefined;

    let pipeline = sharp(inputPath);

    // Resize if dimensions provided
    if (width || height) {
      pipeline = pipeline.resize(width, height, { fit: 'inside', withoutEnlargement: true });
    }

    let outputFilename: string;
    let outputFormat: string;

    if (format === 'avif') {
      outputFilename = `${Date.now()}-${req.file.originalname.split('.')[0]}.avif`;
      pipeline = pipeline.avif({ quality, effort: 4 });
      outputFormat = 'avif';
    } else if (format === 'png') {
      outputFilename = `${Date.now()}-${req.file.originalname.split('.')[0]}.png`;
      pipeline = pipeline.png({ quality, compressionLevel: 9 });
      outputFormat = 'png';
    } else if (format === 'jpeg' || format === 'jpg') {
      outputFilename = `${Date.now()}-${req.file.originalname.split('.')[0]}.jpg`;
      pipeline = pipeline.jpeg({ quality, mozjpeg: true });
      outputFormat = 'jpeg';
    } else {
      outputFilename = `${Date.now()}-${req.file.originalname.split('.')[0]}.webp`;
      pipeline = pipeline.webp({ quality, effort: 4 });
      outputFormat = 'webp';
    }

    const outputPath = path.join(OPTIMIZED_DIR, outputFilename);
    const stats = await pipeline.toFile(outputPath);

    const originalSize = req.file.size;
    const newSize = stats.size;
    const savings = Math.round(((originalSize - newSize) / originalSize) * 100);

    // Clean up upload
    try { fs.unlinkSync(inputPath); } catch {}

    res.status(200).json({
      filename: outputFilename,
      oldSize: originalSize,
      newSize: newSize,
      savings,
      format: outputFormat,
      dimensions: { width: stats.width, height: stats.height }
    });
  } catch (err: any) {
    logger.error(`Image optimization failed: ${err.message}`);
    res.status(500).json({ message: 'Image optimization failed: ' + err.message });
  }
};

export const downloadOptimized = async (req: Request, res: Response): Promise<void> => {
  try {
    const filename = req.params.filename as string;
    // Prevent path traversal
    const safeName = path.basename(filename);
    const filePath = path.join(OPTIMIZED_DIR, safeName);
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ message: 'File not found' });
      return;
    }
    res.download(filePath);
  } catch (err) {
    res.status(500).json({ message: 'Download failed' });
  }
};

export const optimizeCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, type } = req.body;
    if (!code || !type) {
      res.status(400).json({ message: 'Code and type are required' });
      return;
    }

    const startTime = Date.now();
    let optimizedCode = '';
    let warnings: string[] = [];

    if (type === 'javascript') {
      const result = await minifyJs(code, {
        compress: {
          dead_code: true,
          drop_console: false,
          drop_debugger: true,
          passes: 2
        },
        mangle: true,
        format: { comments: false }
      });
      optimizedCode = result.code || code;
    } else if (type === 'html') {
      optimizedCode = await minify(code, {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeEmptyAttributes: true,
        removeOptionalTags: true,
        minifyJS: true,
        minifyCSS: true,
        sortAttributes: true,
        sortClassName: true,
        useShortDoctype: true
      });
    } else if (type === 'css') {
      const cleanCss = new CleanCSS({
        level: {
          1: { all: true },
          2: {
            mergeAdjacentRules: true,
            mergeIntoShorthands: true,
            mergeMedia: true,
            mergeNonAdjacentRules: true,
            mergeSemantically: false,
            overrideProperties: true,
            removeEmpty: true,
            reduceNonAdjacentRules: true,
            removeDuplicateFontRules: true,
            removeDuplicateMediaBlocks: true,
            removeDuplicateRules: true,
            removeUnusedAtRules: false
          }
        }
      });
      const result = cleanCss.minify(code);
      optimizedCode = result.styles;
      if (result.warnings) warnings = result.warnings;
    }

    const endTime = Date.now();
    res.status(200).json({
      optimizedCode,
      stats: {
        originalSize: Buffer.byteLength(code),
        optimizedSize: Buffer.byteLength(optimizedCode),
        reduction: Math.round(((Buffer.byteLength(code) - Buffer.byteLength(optimizedCode)) / Buffer.byteLength(code)) * 100),
        time: endTime - startTime
      },
      warnings
    });
  } catch (err: any) {
    logger.error(`Code optimization failed: ${err.message}`);
    res.status(500).json({ message: 'Code optimization failed: ' + err.message });
  }
};
