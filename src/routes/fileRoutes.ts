import express from 'express';
import multer from 'multer';
import { uploadFile, getFilesByRepositoryId } from '../controllers/fileController';
import { verifyToken } from '../middleware/auth';

const router = express.Router();

// Configuración de Multer con almacenamiento temporal
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/upload', verifyToken, upload.single('file'), uploadFile); //✅·Correcto
router.get('/myfiles/:repositoryId', verifyToken, getFilesByRepositoryId); // ✅ Correcto

export default router;
