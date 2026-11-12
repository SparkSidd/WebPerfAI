import mongoose, { Document, Schema } from 'mongoose';

export interface IMonitor extends Document {
  userId: mongoose.Types.ObjectId;
  url: string;
  frequency: 'daily' | 'weekly';
  isActive: boolean;
  lastRun?: Date;
  nextRun: Date;
  createdAt: Date;
}

const monitorSchema = new Schema<IMonitor>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  url: { type: String, required: true },
  frequency: { type: String, enum: ['daily', 'weekly'], default: 'daily' },
  isActive: { type: Boolean, default: true },
  lastRun: { type: Date },
  nextRun: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IMonitor>('Monitor', monitorSchema);
