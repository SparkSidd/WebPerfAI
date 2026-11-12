import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';
import logger from '../utils/logger';

interface ReportData {
  url: string;
  score?: number;
  overall?: number;
  categories?: any[];
  prioritizedActions?: any[];
  summary?: string;
  metrics?: any;
  recommendations?: any[];
  details?: any;
}

/**
 * Generates a professional PDF report from optimization data
 */
export const generatePdfReport = async (data: ReportData): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true });
      const buffers: Buffer[] = [];
      const stream = new PassThrough();

      stream.on('data', (chunk) => buffers.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(buffers)));
      stream.on('error', reject);
      doc.pipe(stream);

      const colors = { primary: '#00f3ff', purple: '#bc13fe', bg: '#09090b', card: '#18181b', green: '#22c55e', yellow: '#eab308', red: '#ef4444', white: '#ffffff', gray: '#9ca3af' };

      // === COVER PAGE ===
      doc.rect(0, 0, doc.page.width, doc.page.height).fill(colors.bg);
      doc.fillColor(colors.primary).fontSize(36).font('Helvetica-Bold').text('OptiWeb AI', 50, 120);
      doc.fillColor(colors.gray).fontSize(14).font('Helvetica').text('Web Performance & Optimization Report', 50, 165);
      doc.moveDown(2);
      doc.fillColor(colors.white).fontSize(16).text(`URL: ${data.url}`, 50, 220);
      doc.fillColor(colors.gray).fontSize(11).text(`Generated: ${new Date().toLocaleString()}`, 50, 250);

      // Score circle
      const score = data.overall || data.score || 0;
      const scoreColor = score > 80 ? colors.green : score > 50 ? colors.yellow : colors.red;
      doc.circle(doc.page.width / 2, 420, 70).lineWidth(6).strokeColor(scoreColor).stroke();
      doc.fillColor(scoreColor).fontSize(48).font('Helvetica-Bold').text(`${score}`, doc.page.width / 2 - 35, 400, { width: 70, align: 'center' });
      doc.fillColor(colors.gray).fontSize(10).font('Helvetica').text('OVERALL SCORE', doc.page.width / 2 - 50, 470, { width: 100, align: 'center' });

      if (data.summary) {
        doc.fillColor(colors.white).fontSize(12).font('Helvetica').text(data.summary, 80, 530, { width: doc.page.width - 160, align: 'center' });
      }

      // === CATEGORY SCORES ===
      if (data.categories && data.categories.length > 0) {
        doc.addPage();
        doc.rect(0, 0, doc.page.width, doc.page.height).fill(colors.bg);
        doc.fillColor(colors.primary).fontSize(22).font('Helvetica-Bold').text('Category Breakdown', 50, 50);
        doc.moveTo(50, 80).lineTo(doc.page.width - 50, 80).strokeColor('#27272a').lineWidth(1).stroke();

        let y = 100;
        for (const cat of data.categories) {
          const catColor = cat.score > 80 ? colors.green : cat.score > 50 ? colors.yellow : colors.red;

          doc.fillColor(colors.white).fontSize(14).font('Helvetica-Bold').text(cat.name, 50, y);
          doc.fillColor(catColor).fontSize(20).font('Helvetica-Bold').text(`${cat.score}`, doc.page.width - 120, y, { width: 70, align: 'right' });
          doc.fillColor(colors.gray).fontSize(10).font('Helvetica').text(cat.details, 50, y + 20);

          // Progress bar
          const barWidth = 300;
          const barX = 50;
          const barY = y + 38;
          doc.rect(barX, barY, barWidth, 6).fill('#27272a');
          doc.rect(barX, barY, barWidth * (cat.score / 100), 6).fill(catColor);

          y += 65;
          if (y > 700) { doc.addPage(); doc.rect(0, 0, doc.page.width, doc.page.height).fill(colors.bg); y = 50; }
        }
      }

      // === PRIORITIZED ACTIONS ===
      if (data.prioritizedActions && data.prioritizedActions.length > 0) {
        doc.addPage();
        doc.rect(0, 0, doc.page.width, doc.page.height).fill(colors.bg);
        doc.fillColor(colors.primary).fontSize(22).font('Helvetica-Bold').text('Prioritized Action Plan', 50, 50);
        doc.moveTo(50, 80).lineTo(doc.page.width - 50, 80).strokeColor('#27272a').lineWidth(1).stroke();

        let y = 100;
        for (const action of data.prioritizedActions) {
          const impactColor = action.impact === 'critical' ? colors.red : action.impact === 'high' ? colors.yellow : colors.green;

          doc.fillColor(colors.primary).fontSize(16).font('Helvetica-Bold').text(`#${action.priority}`, 50, y);
          doc.fillColor(impactColor).fontSize(9).font('Helvetica-Bold').text(action.impact.toUpperCase(), 90, y + 2);
          doc.fillColor(colors.white).fontSize(12).font('Helvetica-Bold').text(action.action, 50, y + 20, { width: doc.page.width - 100 });
          doc.fillColor(colors.gray).fontSize(10).font('Helvetica').text(`Category: ${action.category} | Effort: ${action.effort} | Estimated gain: ${action.estimatedGain}`, 50, y + 40, { width: doc.page.width - 100 });

          y += 70;
          if (y > 700) { doc.addPage(); doc.rect(0, 0, doc.page.width, doc.page.height).fill(colors.bg); y = 50; }
        }
      }

      // === AI RECOMMENDATIONS ===
      if (data.recommendations && data.recommendations.length > 0) {
        doc.addPage();
        doc.rect(0, 0, doc.page.width, doc.page.height).fill(colors.bg);
        doc.fillColor(colors.primary).fontSize(22).font('Helvetica-Bold').text('AI-Powered Recommendations', 50, 50);
        doc.moveTo(50, 80).lineTo(doc.page.width - 50, 80).strokeColor('#27272a').lineWidth(1).stroke();

        let y = 100;
        for (const rec of data.recommendations) {
          const impactColor = rec.impact === 'High' ? colors.red : rec.impact === 'Medium' ? colors.yellow : colors.green;
          doc.fillColor(impactColor).fontSize(9).font('Helvetica-Bold').text(`${rec.impact?.toUpperCase()} IMPACT`, 50, y);
          doc.fillColor(colors.white).fontSize(12).font('Helvetica-Bold').text(rec.issue || rec.action || 'Recommendation', 50, y + 15);
          doc.fillColor(colors.gray).fontSize(10).font('Helvetica').text(rec.recommendation || rec.explanation || '', 50, y + 32, { width: doc.page.width - 100 });

          y += 70;
          if (y > 700) { doc.addPage(); doc.rect(0, 0, doc.page.width, doc.page.height).fill(colors.bg); y = 50; }
        }
      }

      // Footer on all pages
      const pages = doc.bufferedPageRange();
      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        doc.fillColor(colors.gray).fontSize(8).font('Helvetica')
          .text(`OptiWeb AI — Performance Report — Page ${i + 1} of ${pages.count}`, 50, doc.page.height - 30, { width: doc.page.width - 100, align: 'center' });
      }

      doc.end();
    } catch (err: any) {
      logger.error(`PDF generation failed: ${err.message}`);
      reject(err);
    }
  });
};
