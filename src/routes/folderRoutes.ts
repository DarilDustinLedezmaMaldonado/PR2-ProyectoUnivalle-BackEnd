import express from 'express';
import { verifyToken } from '../middleware/auth';
import { createFolder, listFolders } from '../controllers/folderController';

const router = express.Router();

// Crear carpeta
router.post('/', verifyToken, createFolder);

// Listar carpetas: /api/folders?repositoryId=...&parent=... (parent puede ser 'null')
router.get('/', verifyToken, listFolders);

export default router;
