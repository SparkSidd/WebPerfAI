import mongoose, { Document, Schema } from 'mongoose';

export interface IRecommendation {
  issue: string;
  impact: 'High' | 'Medium' | 'Low';
  recommendation: string;
  explanation?: string;
  codeSnippet?: string;
  impactScore?: number;
  predictedImprovement?: number;
}

export interface IReport extends Document {
  userId: mongoose.Types.ObjectId;
  url: string;
  score: number;
  metrics: {
    lcp: number; // Largest Contentful Paint (ms)
    fcp: number; // First Contentful Paint (ms)
    cls: number; // Cumulative Layout Shift
    ttfb: number; // Time to First Byte (ms)
  };
  recommendations: IRecommendation[];
  additionalChecks?: {
    security: {
      csp: boolean;
      hsts: boolean;
      xframe: boolean;
      nosniff: boolean;
    };
    seo: {
      hasTitle: boolean;
      hasMetaDesc: boolean;
      hasH1: boolean;
    };
  };
  createdAt: Date;
}

const recommendationSchema = new Schema<IRecommendation>({
  issue: { type: String, required: true },
  impact: { type: String, enum: ['High', 'Medium', 'Low'], required: true },
  recommendation: { type: String, required: true },
  explanation: { type: String },
  codeSnippet: { type: String },
  impactScore: { type: Number },
  predictedImprovement: { type: Number }
});

const reportSchema = new Schema<IReport>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  url: { type: String, required: true },
  score: { type: Number, required: true },
  metrics: {
    lcp: { type: Number, required: true },
    fcp: { type: Number, required: true },
    cls: { type: Number, required: true },
    ttfb: { type: Number, required: true }
  },
  recommendations: [recommendationSchema],
  additionalChecks: {
    security: {
      csp: { type: Boolean },
      hsts: { type: Boolean },
      xframe: { type: Boolean },
      nosniff: { type: Boolean }
    },
    seo: {
      hasTitle: { type: Boolean },
      hasMetaDesc: { type: Boolean },
      hasH1: { type: Boolean }
    }
  },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IReport>('Report', reportSchema);
