import express from 'express';
import multer from 'multer';
import dotenv from 'dotenv';
dotenv.config();
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

const router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    // Definir formatos permitidos para archivos informáticos
    const allowedFormats = [
      'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', // Imágenes
      'pdf', // PDF
      'doc', 'docx', // Word
      'xls', 'xlsx', // Excel  
      'ppt', 'pptx', // PowerPoint
      'txt', 'md', 'csv', // Texto
      'zip', 'rar', '7z', // Comprimidos
      'mp3', 'wav', 'ogg', // Audio
      'mp4', 'avi', 'mov', 'mkv', 'webm', // Video
      'json', 'xml', 'html', 'css', 'js', 'ts', // Código
    ];

    return {
      public_id: `perfiles/${Date.now()}-${file.originalname}`,
      allowed_formats: allowedFormats,
      resource_type: 'auto', // Permite subir cualquier tipo de archivo
    };
  },
});

const upload = multer({ storage });

// Ruta para subir imagen
router.post('/profile-image', upload.single('image'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'No se envió ninguna imagen' });
    return;
  }
  res.json({ url: req.file.path });
});

export default router;
