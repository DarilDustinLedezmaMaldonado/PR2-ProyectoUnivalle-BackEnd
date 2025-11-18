import dotenv from 'dotenv';
dotenv.config();
import { v2 as cloudinary } from 'cloudinary';
import mongoose from 'mongoose';
import Config from '../models/Config';
import path from 'path';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

async function uploadLogo() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log('✅ Conectado a MongoDB');

    // Ruta del logo local (ajusta según la ubicación real)
    const logoPath = path.join(__dirname, '../../assets/logoUnivalleBlanco.png');

    // Subir a Cloudinary
    console.log('📤 Subiendo logo a Cloudinary...');
    const result = await cloudinary.uploader.upload(logoPath, {
      folder: 'config',
      public_id: 'logo-univalle',
    });

    console.log('✅ Logo subido:', result.secure_url);

    // Guardar en BD
    await Config.findOneAndUpdate(
      { key: 'logo-univalle' },
      { 
        value: result.secure_url,
        description: 'Logo de Univalle para pantallas de autenticación'
      },
      { upsert: true, new: true }
    );

    console.log('✅ Logo guardado en la base de datos');
    console.log('🔗 URL:', result.secure_url);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

uploadLogo();
