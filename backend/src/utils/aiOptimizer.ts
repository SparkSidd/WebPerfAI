import { GoogleGenAI } from '@google/genai';
import { IRecommendation } from '../models/Report';

export interface AdvancedRecommendation extends IRecommendation {
  explanation: string;
  codeSnippet?: string;
  impactScore: number; // 0-100
  predictedImprovement: number; // estimated score increase
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const generateAdvancedRecommendations = async (failedAudits: any[], url: string): Promise<AdvancedRecommendation[]> => {
  try {
    const prompt = `You are an expert web performance optimization engineer.
I ran a Lighthouse audit on ${url} and found the following failed audits:
${JSON.stringify(failedAudits.map(a => ({ id: a.id, title: a.title, description: a.description, displayValue: a.displayValue })), null, 2)}

Please provide a JSON array of specific, highly actionable recommendations to fix these issues. 
Each recommendation MUST follow this JSON schema exactly:
[{
  "issue": "Brief title of the issue",
  "impact": "High" | "Medium" | "Low",
  "recommendation": "Short, actionable step",
  "explanation": "Detailed explanation of why this matters and how to solve it",
  "impactScore": <number between 1 and 100>,
  "predictedImprovement": <estimated lighthouse score increase, e.g., 5>,
  "codeSnippet": "Exact code snippet showing how to implement the fix (optional but highly recommended)"
}]

Respond ONLY with the JSON array. Do not include markdown formatting or backticks.`;

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
    });

    let text = response.text || "[]";
    // Strip markdown formatting if any
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(text) as AdvancedRecommendation[];
  } catch (error) {
    console.error("Gemini API error:", error);
    // Fallback if AI fails
    return [{
      issue: 'General performance optimizations',
      impact: 'Medium',
      recommendation: 'Review overall architecture.',
      explanation: 'Your site is doing well, but there is always room for micro-optimizations in resource delivery.',
      impactScore: 30,
      predictedImprovement: 2
    }];
  }
};
