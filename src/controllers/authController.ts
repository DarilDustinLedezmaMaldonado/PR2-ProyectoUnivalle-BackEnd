// src/controllers/authController.ts
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Repository from '../models/Repository';
import { sendVerificationEmail } from '../utils/sendEmail';
import { logger } from '../utils/logger';

export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      res.status(400).json({ message: 'Todos los campos son obligatorios.' });
      return;
    }

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      res.status(400).json({ message: 'El usuario o email ya están en uso.' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    // 👇 Crear el repositorio personal del usuario
    // Crear repositorio personal usando los campos correctos del schema Repository
    const personalRepo = new Repository({
      name: `Repositorio de ${username}`,
      description: 'Repositorio personal del usuario',
      typeRepo: 'simple', // tipo por defecto para repositorio personal
      category: 'personal',
      privacy: 'private',
      owner: newUser._id,
      members: [newUser._id],
      files: [],
    });

    await personalRepo.save();

    // 👇 Vincular el repositorio al usuario
    newUser.repositories.push(personalRepo._id as (typeof newUser.repositories)[0]);
    await newUser.save();

    res.status(201).json({ message: 'Usuario registrado exitosamente.' });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ message: 'Error en el servidor.' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      res.status(400).json({ message: 'Credenciales inválidas.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({ message: 'Credenciales inválidas.' });
    }
    const token = jwt.sign(
      { id: user._id, username: user.username, email: user.email },
      process.env.JWT_SECRET as string,
      { expiresIn: '1d' },
    );

    // Crear código de verificación
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6 dígitos
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 10); // Código válido 10 minutos

    // Guardar en el usuario
    user.verificationCode = verificationCode;
    user.verificationCodeExpires = expires;
    await user.save();

    // Enviar el correo
    logger.info('Enviando correo de verificación...');
    logger.info(`Email: ${user.email}, Código: ${verificationCode}`);
    try {
      await sendVerificationEmail(user.email, verificationCode);
      logger.info('Correo enviado exitosamente');
    } catch (emailError) {
      logger.error('Error al enviar correo:', emailError);
      // Continuar sin fallar el login - el usuario puede ver el código en los logs
    }
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ message: 'Error en el servidorakjshfdkshfa.' });
  }
};

export const verifyCode = async (req: Request, res: Response) => {
  try {
    const { username, code } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      res.status(400).json({ message: 'Usuario no encontrado.' });
    }

    if (user.verificationCode !== code) {
      res.status(400).json({ message: 'Código inválido.' });
    }

    if (user.verificationCodeExpires && user.verificationCodeExpires < new Date()) {
      res.status(400).json({ message: 'El código ha expirado.' });
    }

    // Código correcto → Generamos JWT
    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET as string,
      { expiresIn: '1d' },
    );

    // Limpiar el código de verificación
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ message: 'Error en el servidor.' });
  }
};
