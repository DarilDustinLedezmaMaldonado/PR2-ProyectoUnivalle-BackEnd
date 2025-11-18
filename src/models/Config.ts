import mongoose, { Schema, Document } from 'mongoose';

export interface IConfig extends Document {
  key: string;
  value: string;
  description?: string;
}

const ConfigSchema: Schema = new Schema({
  key: { type: String, required: true, unique: true },
  value: { type: String, required: true },
  description: { type: String },
});

export default mongoose.model<IConfig>('Config', ConfigSchema);
