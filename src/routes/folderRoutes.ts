import express from 'express';
import { verifyToken } from '../middleware/auth';
import { createFolder, listFolders } from '../controllers/folderController';

const router = express.Router();

// Crear carpeta
router.post('/', verifyToken, createFolder);

// Listar carpetas: /api/folders?repositoryId=...&parent=... (parent puede ser 'null')
router.get('/', verifyToken, listFolders);

// Obtener ancestros / info de una carpeta: GET /api/folders/:id
router.get('/:id', verifyToken, async (req, res, next) => {
	try {
		const controller = await import('../controllers/folderController');
		return controller.getFolderAncestors(req, res);
	} catch (err) {
		next(err);
	}
});

export default router;
