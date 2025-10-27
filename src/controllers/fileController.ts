import { RequestHandler } from 'express';
import mongoose from 'mongoose';
import { GridFSBucket, ObjectId } from 'mongodb';
import File from '../models/File';
import { getDb } from '../config/db';

let gfsBucket: GridFSBucket;

mongoose.connection.once('open', () => {
  gfsBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: 'uploads',
  });
});

export const uploadFile: RequestHandler = async (req, res) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const file = (req as any).file;
    if (!file) {
      res.status(400).json({ message: 'No se subió ningún archivo' });
      return;
    }

  const { title, author, description, tags, repositoryId, importance, privacy, folderId } = req.body;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const metadata: any = {
      title,
      author,
      description,
      tags: tags?.split(',') || [],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      uploadedBy: (req as any).user.id,
      importance,
      privacy,
    };

    if (repositoryId) {
      metadata.repositoryId = new mongoose.Types.ObjectId(repositoryId);
    }
    // Si se envía folderId, lo guardamos en metadata (para filtrar después)
    if (folderId) {
      try {
        metadata.folderId = new mongoose.Types.ObjectId(folderId);
      } catch (err) {
        // Si folderId no es un ObjectId válido, lo ignoramos (validación puede hacerse en frontend/backend adicional)
      }
    }

    const uploadStream = gfsBucket.openUploadStream(file.originalname, {
      contentType: file.mimetype,
      metadata,
    });

    const gridFsId: ObjectId = uploadStream.id as ObjectId;

    uploadStream.end(file.buffer);

    uploadStream.on('finish', async () => {
      // Consulta para obtener el archivo de GridFS con ese ID
      const storedFile = await gfsBucket.find({ _id: gridFsId }).toArray();

      if (!storedFile || storedFile.length === 0) {
        return res.status(404).json({ message: 'No se pudo recuperar el archivo de GridFS' });
      }

      const newFile = new File({
        filename: storedFile[0].filename,
        originalname: file.originalname,
        contentType: file.mimetype,
        size: file.size,
        metadata: {
          ...metadata,
          gridFsId: storedFile[0]._id,
        },
      });

      await newFile.save();

      res.status(201).json({ message: 'Archivo subido con éxito', file: newFile });
    });

    uploadStream.on('error', (error) => {
      console.error('Error subiendo a GridFS:', error);
      res.status(500).json({ message: 'Error al guardar archivo en GridFS', error });
    });
  } catch (error) {
    console.error('Error al subir archivo:', error);
    res.status(500).json({ message: 'Error al subir el archivo', error });
  }
};

export const getFilesByRepositoryId: RequestHandler = async (req, res) => {
  try {
    const { repositoryId } = req.params;
    const { folderId } = req.query;
    const db = getDb();

    const baseFilter: any = { 'metadata.repositoryId': new ObjectId(repositoryId) };

    // Si folderId está presente en la query, filtramos por ese folder
    if (folderId) {
      try {
        baseFilter['metadata.folderId'] = new ObjectId(String(folderId));
      } catch (err) {
        // si folderId no es válido, devolvemos 400
        res.status(400).json({ message: 'folderId inválido' });
        return;
      }
    } else {
      // Si no se especifica folderId, mostramos solo archivos que NO tienen folderId (raíz)
      baseFilter['$or'] = [
        { 'metadata.folderId': { $exists: false } },
        { 'metadata.folderId': null },
      ];
    }

    const files = await db.collection('uploads.files').find(baseFilter).toArray();
    if (!files || files.length === 0) {
      console.log('No se encontraron archivos para este repositorio');
    }

    res.status(200).json(files);
  } catch (error) {
    console.error('Error al buscar archivos:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};
