import { Request, Response } from "express";
import Repository from "../models/Repository";
import User, { IUser } from "../models/User";
import { logger } from "../utils/logger";
import mongoose from "mongoose";

// 🧩 Crear un nuevo repositorio
export const createRepository = async (req: Request, res: Response): Promise<void> => {
  try {
    // Logging para depuración de peticiones desde frontend
    const path = req.originalUrl || req.path;
    const authHeader = (req.headers.authorization as string) || '';
    const tokenSnippet = authHeader ? authHeader.slice(0, 15) + '...' : 'no-token';
    // No logueamos datos sensibles: solo nombre y número de miembros
    const { name: logName, memberEmails: logMembers } = req.body as any;
    logger.info('createRepository called', { path, tokenSnippet, name: logName, memberEmailsCount: Array.isArray(logMembers) ? logMembers.length : 0 });

    const ownerId = (req as Request & { user: { id: string } }).user.id;
    const {
      name,
      description,
      typeRepo,
      category,
      privacy,
      interestAreas,
      geoAreas,
      sectors,
      memberEmails,
    } = req.body;

    if (!name || !typeRepo) {
      res.status(400).json({ message: "El nombre y tipo de repositorio son obligatorios" });
      return;
    }

    // Buscar usuarios miembros
    let memberIds: mongoose.Types.ObjectId[] = [];
    if (memberEmails && memberEmails.length > 0) {
      const foundUsers = (await User.find({ email: { $in: memberEmails } })) as IUser[];

      if (foundUsers.length !== memberEmails.length) {
        res.status(400).json({ message: "Uno o más correos no están registrados" });
        return;
      }

  // u._id can be treated as an ObjectId here — cast to satisfy TypeScript
  memberIds = foundUsers.map((u) => u._id as mongoose.Types.ObjectId);
    }

    const ownerObjectId = new mongoose.Types.ObjectId(ownerId);
    if (!memberIds.some((id) => id.equals(ownerObjectId))) {
      memberIds.push(ownerObjectId);
    }

    const newRepo = new Repository({
      name,
      description,
      typeRepo,
      category,
      privacy,
      interestAreas,
      geoAreas,
      sectors,
      owner: ownerObjectId,
      members: memberIds,
    });

    await newRepo.save();
    res.status(201).json({ message: "Repositorio creado con éxito", repository: newRepo });
  } catch (error) {
    logger.error("Error al crear repositorio:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// 🧩 Obtener repositorios del usuario
export const getMyRepositories = async (req: Request, res: Response): Promise<void> => {
  try {
    const path = req.originalUrl || req.path;
    const authHeader = (req.headers.authorization as string) || '';
    const tokenSnippet = authHeader ? authHeader.slice(0, 15) + '...' : 'no-token';
    logger.info('getMyRepositories called', { path, tokenSnippet });

    const userId = (req as Request & { user: { id: string } }).user.id;

    const repos = await Repository.find({
      $or: [{ owner: userId }, { members: userId }],
    })
      .sort({ createdAt: -1 })
      .populate("owner", "username email")
      .populate("members", "username email");

  logger.info('getMyRepositories result count', { count: repos.length });
  res.status(200).json(repos);
  } catch (error) {
    logger.error("Error al obtener repositorios del usuario:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// 🧩 Obtener archivos asociados a un repositorio
export const getFilesByRepository = async (req: Request, res: Response): Promise<void> => {
  const repositoryId = req.params.id;
  const db = mongoose.connection.db;

  try {
    const files = await db
      .collection("uploads.files")
      .find({ "metadata.repositoryId": repositoryId })
      .toArray();

    res.status(200).json(files);
  } catch (error) {
    logger.error("Error al obtener archivos por repositorio:", error);
    res.status(500).json({ message: "Error al obtener archivos" });
  }
};

// 🧩 Eliminar repositorio (solo dueño)
export const deleteRepository = async (req: Request, res: Response): Promise<void> => {
  try {
    const repoId = req.params.id;
    const userId = (req as Request & { user: { id: string } }).user.id;

    const repo = await Repository.findById(repoId);
    if (!repo) {
      res.status(404).json({ message: "Repositorio no encontrado" });
      return;
    }

    if (repo.owner.toString() !== userId) {
      res.status(403).json({ message: "No tienes permisos para eliminarlo" });
      return;
    }

    await Repository.findByIdAndDelete(repoId);
    res.status(200).json({ message: "Repositorio eliminado correctamente" });
  } catch (error) {
    logger.error("Error al eliminar repositorio:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// 🧩 Nuevo: Obtener solo repositorios públicos
export const getPublicRepositories = async (req: Request, res: Response): Promise<void> => {
  try {
    const publicRepos = await Repository.find({ privacy: "public" })
      .sort({ createdAt: -1 })
      .populate("owner", "username email");

    res.status(200).json(publicRepos);
  } catch (error) {
    logger.error("Error al obtener repositorios públicos:", error);
    res.status(500).json({ message: "Error al obtener repositorios públicos" });
  }
};
