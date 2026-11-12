import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { GoogleGenAI } from '@google/genai';
import logger from '../utils/logger';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const queryResearch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { query } = req.body;
    if (!query) {
      res.status(400).json({ message: 'Query is required' });
      return;
    }

    const prompt = `You are an elite web performance researcher.
User Query: "${query}"

Please provide a deep, expert-level analysis of this topic.
Focus on:
1. Modern standards (HTTP/3, Web Vitals, etc.)
2. Practical implementation tips.
3. Industry benchmarks.

Format your response as a JSON object with these fields:
{
  "answer": "A detailed multi-paragraph explanation (300-500 words)",
  "takeaways": ["List of 3-5 key technical takeaways"],
  "nextSteps": ["List of 3-5 actionable next steps for a developer"]
}

Respond ONLY with the JSON object. Do not include markdown formatting or backticks.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    let text = response.text || "{}";
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const researchData = JSON.parse(text);
    res.status(200).json(researchData);
  } catch (err: any) {
    logger.error(`Research failed for ${req.body.query}: ${err.message}`);
    res.status(500).json({ message: 'Research consultation failed' });
  }
};
