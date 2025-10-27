import { Request, Response } from 'express';
import Folder from '../models/Folder';
import mongoose from 'mongoose';
import { logger } from '../utils/logger';

// Crear carpeta dentro de un repositorio
export const createFolder = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { name, repositoryId, parent } = req.body;

    if (!name || !repositoryId) {
      res.status(400).json({ message: 'name y repositoryId son obligatorios' });
      return;
    }

    const folder = new Folder({
      name,
      repositoryId: new mongoose.Types.ObjectId(repositoryId),
      parent: parent ? new mongoose.Types.ObjectId(parent) : null,
      createdBy: new mongoose.Types.ObjectId(userId),
    });

    await folder.save();
    res.status(201).json({ message: 'Carpeta creada', folder });
  } catch (error) {
    logger.error('Error creando carpeta:', error);
    res.status(500).json({ message: 'Error interno al crear carpeta' });
  }
};

// Listar carpetas de un repositorio o dentro de una carpeta padre
export const listFolders = async (req: Request, res: Response): Promise<void> => {
  try {
    const { repositoryId, parent } = req.query;

    if (!repositoryId) {
      res.status(400).json({ message: 'repositoryId es requerido' });
      return;
    }

    const filter: any = { repositoryId: new mongoose.Types.ObjectId(String(repositoryId)) };
    if (parent) {
      filter.parent = parent === 'null' ? null : new mongoose.Types.ObjectId(String(parent));
    } else {
      // por defecto, listar carpetas de nivel raíz (parent === null)
      filter.parent = null;
    }

    const folders = await Folder.find(filter).sort({ createdAt: 1 });
    res.status(200).json(folders);
  } catch (error) {
    logger.error('Error listando carpetas:', error);
    res.status(500).json({ message: 'Error interno al listar carpetas' });
  }
};

// Obtener una carpeta y su cadena de ancestros (desde la raíz hasta la carpeta solicitada)
export const getFolderAncestors = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ message: 'folder id requerido' });
      return;
    }

    const ancestors: any[] = [];
    let current = await Folder.findById(id);
    if (!current) {
      res.status(404).json({ message: 'Carpeta no encontrada' });
      return;
    }

    // Recolectamos hasta la raíz
    while (current) {
      ancestors.push({ _id: current._id, name: current.name, parent: current.parent });
      if (!current.parent) break;
      current = await Folder.findById(current.parent);
    }

    // ancestors currently: [current, parent, grandparent, ...] -> invertimos
    const chain = ancestors.reverse();
    res.status(200).json(chain);
  } catch (error) {
    logger.error('Error obteniendo ancestros de carpeta:', error);
    res.status(500).json({ message: 'Error interno al obtener ancestros' });
  }
};
