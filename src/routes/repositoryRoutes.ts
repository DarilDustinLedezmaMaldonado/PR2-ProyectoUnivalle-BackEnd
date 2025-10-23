import express from "express";
import { verifyToken } from "../middleware/auth";
import {
  createRepository,
  getMyRepositories,
  getFilesByRepository,
  deleteRepository,
  getPublicRepositories,
} from "../controllers/repositoryController";

const router = express.Router();

// CRUD básico
router.post("/", verifyToken, createRepository);
router.get("/mis-repositorios", verifyToken, getMyRepositories);
router.get("/repositorio/:id", verifyToken, getFilesByRepository);
router.delete("/:id", verifyToken, deleteRepository);

// Compatibilidad: endpoint usado por el frontend (espera { personalRepoId })
router.get('/personal', verifyToken, async (req, res) => {
  try {
    // Reutilizamos getMyRepositories logic: buscar repos del usuario
    const userId = (req as any).user.id;
    const repos = await (await import('../models/Repository')).default.find({
      $or: [{ owner: userId }, { members: userId }],
    }).sort({ createdAt: -1 });

    const personalRepoId = repos && repos.length > 0 ? repos[0]._id : null;
    res.status(200).json({ personalRepoId });
  } catch (error) {
    res.status(500).json({ message: 'Error interno al obtener repositorio personal' });
  }
});

// Nuevo endpoint público
router.get("/publicos", getPublicRepositories);

export default router;
