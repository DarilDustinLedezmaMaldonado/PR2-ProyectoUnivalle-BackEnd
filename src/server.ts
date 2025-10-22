/* eslint-disable prettier/prettier */
// src/server.ts
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import { logger } from './utils/logger';
import mongoose from 'mongoose';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import uploadRoute from './routes/uploadRoute';
//const uploadRoute = require("./routes/uploadRoute");
//const auth = require("./middleware/auth");

import fileRoutes from './routes/fileRoutes';
import repositoryRoutes from './routes/repositoryRoutes';

dotenv.config();

const app = express();
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL || 'https://proyectoo-psi.vercel.app/',
      /^https:\/\/.*\.vercel\.app$/
    ],
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  morgan('combined', {
    stream: {
      write: (message: string) => logger.info(message.trim()),
    },
  }),
);

app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/repositorios', repositoryRoutes);
app.use('/api/users', userRoutes); 
app.use('/api/upload', uploadRoute);

mongoose
  .connect(process.env.MONGODB_URI!)
  .then(() => {
    logger.info('MongoDB conectado');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => logger.info(`Servidor corriendo en puerto ${PORT}`));
  })
  .catch((err) => logger.info('Error al conectar a MongoDB:', err));
