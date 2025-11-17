// ✅ src/models/User.ts
import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  fullname?: string;
  repositories: mongoose.Types.ObjectId[];
  createdAt: Date;
  verificationCode: string;
  verificationCodeExpires: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;

  nombre: string;
  apellido: string;
  estado: string;
  profesion: string;
  institucion: string;
  ciudad: string;
  contacto: string;
  hobbies: string[];
  profileImage: string; // URL de la imagen de perfil
  theme?: string; // Tema de la interfaz
}

const UserSchema: Schema = new Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullname: { type: String },
  repositories: [{ type: Schema.Types.ObjectId, ref: 'Repository' }],
  createdAt: { type: Date, default: Date.now },
  verificationCode: { type: String },
  verificationCodeExpires: { type: Date },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },

  nombre: { type: String },
  apellido: { type: String },
  estado: { type: String },
  profesion: { type: String },
  institucion: { type: String },
  ciudad: { type: String },
  contacto: { type: String },
  hobbies: [{ type: String }],
  profileImage: { type: String },
  theme: { type: String, default: 'azul-morado' },
});

// Hash password before saving
UserSchema.pre('save', async function (next) {
  // Solo hashear si la contraseña fue modificada o es nueva
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password as string, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

export default mongoose.model<IUser>('User', UserSchema);
