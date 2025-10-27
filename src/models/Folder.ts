import mongoose from 'mongoose';

export interface IFolder extends mongoose.Document {
  name: string;
  repositoryId: mongoose.Types.ObjectId;
  parent?: mongoose.Types.ObjectId | null;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const FolderSchema = new mongoose.Schema<IFolder>({
  name: { type: String, required: true },
  repositoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Repository', required: true },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IFolder>('Folder', FolderSchema);
