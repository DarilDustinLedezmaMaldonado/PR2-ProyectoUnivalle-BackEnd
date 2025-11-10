import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  user: mongoose.Types.ObjectId;
  type: string;
  title: string;
  message: string;
  read: boolean;
  meta?: any;
  createdAt: Date;
}

const NotificationSchema: Schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { 
    type: String, 
    required: true,
    enum: ['invitation', 'invitationAccepted', 'invitationRejected', 'memberRemoved', 'roleUpdated', 'general']
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  meta: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<INotification>('Notification', NotificationSchema);
