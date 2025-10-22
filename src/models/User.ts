// ✅ src/models/User.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  repositories: mongoose.Types.ObjectId[];
  createdAt: Date;
  verificationCode: string;
  verificationCodeExpires: Date;

  nombre: string;
  apellido: string;
  estado: string;
  profesion: string;
  institucion: string;
  ciudad: string;
  contacto: string;
  hobbies: string[];
  profileImage: string; // URL de la imagen de perfil
}

const UserSchema: Schema = new Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  repositories: [{ type: Schema.Types.ObjectId, ref: 'Repository' }],
  createdAt: { type: Date, default: Date.now },
  verificationCode: { type: String },
  verificationCodeExpires: { type: Date },

  nombre: { type: String },
  apellido: { type: String },
  estado: { type: String },
  profesion: { type: String },
  institucion: { type: String },
  ciudad: { type: String },
  contacto: { type: String },
  hobbies: [{ type: String }],
  profileImage: { type: String },
});

export default mongoose.model<IUser>('User', UserSchema);
