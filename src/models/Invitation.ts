import mongoose, { Schema, Document } from 'mongoose';

export interface IInvitation extends Document {
  repository: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  recipient?: mongoose.Types.ObjectId;
  recipientEmail: string;
  role: string;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

const InvitationSchema: Schema = new Schema({
  repository: { type: Schema.Types.ObjectId, ref: 'Repository', required: true },
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: { type: Schema.Types.ObjectId, ref: 'User' },
  recipientEmail: { type: String, required: true },
  role: { type: String, default: 'Miembro' },
  message: { type: String },
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'rejected', 'cancelled'], 
    default: 'pending' 
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Update the updatedAt timestamp before saving
InvitationSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model<IInvitation>('Invitation', InvitationSchema);
