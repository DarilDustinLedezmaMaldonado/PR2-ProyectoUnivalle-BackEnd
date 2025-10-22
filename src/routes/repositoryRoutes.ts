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

// Nuevo endpoint público
router.get("/publicos", getPublicRepositories);

export default router;
