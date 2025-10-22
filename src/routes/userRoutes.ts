import express from 'express';
import User from '../models/User';

const router = express.Router();

// Actualizar perfil de usuario
router.put('/:id', async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          nombre: req.body.nombre,
          apellido: req.body.apellido,
          estado: req.body.estado,
          profesion: req.body.profesion,
          institucion: req.body.institucion,
          ciudad: req.body.ciudad,
          contacto: req.body.contacto,
          hobbies: req.body.hobbies,
          profileImage: req.body.profileImage,
        },
      },
      { new: true },
    );

    if (!updatedUser) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({ error: 'Error al actualizar el perfil' });
  }
});
// Obtener perfil de usuario por ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).lean();
    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }
    res.json(user);
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ error: 'Error al obtener el perfil' });
  }
});

export default router;
