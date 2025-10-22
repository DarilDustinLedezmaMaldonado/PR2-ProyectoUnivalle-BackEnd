import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    originalname: { type: String, required: true },
    contentType: { type: String, required: true },
    size: { type: Number, required: true },
    metadata: {
      title: String,
      author: String,
      description: String,
      tags: [String],
      uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
  },
  { timestamps: true }
);

export default mongoose.model('File', fileSchema);
