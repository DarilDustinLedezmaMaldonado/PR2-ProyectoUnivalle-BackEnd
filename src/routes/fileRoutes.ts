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

// Compatibilidad: devolver archivos del repositorio personal
router.get('/personal', verifyToken, (req, res, next) => {
	// Usamos una IIFE async para mantener la firma de RequestHandler (void) y propagar errores con next()
	(async () => {
		try {
			const userId = (req as any).user.id;
			const Repository = (await import('../models/Repository')).default;

			const repos = await Repository.find({ $or: [{ owner: userId }, { members: userId }] })
				.sort({ createdAt: -1 })
				.limit(1);

			if (!repos || repos.length === 0) {
				res.status(200).json([]);
				return;
			}

			const repoId = repos[0]._id;
			const db = (await import('../config/db')).getDb();

			const files = await db.collection('uploads.files').find({ 'metadata.repositoryId': repoId }).toArray();
			res.status(200).json(files);
		} catch (error) {
			console.error('Error al obtener archivos personales:', error);
			next(error);
		}
	})();
});

export default router;
