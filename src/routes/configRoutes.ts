import express from 'express';
import Config from '../models/Config';

const router = express.Router();

// Obtener configuración por key
router.get('/:key', async (req, res) => {
  try {
    const config = await Config.findOne({ key: req.params.key });
    if (!config) {
      res.status(404).json({ error: 'Configuración no encontrada' });
      return;
    }
    res.json({ value: config.value });
  } catch (error) {
    console.error('Error al obtener configuración:', error);
    res.status(500).json({ error: 'Error al obtener configuración' });
  }
});

// Actualizar o crear configuración (solo admin)
router.post('/:key', async (req, res) => {
  try {
    const { value, description } = req.body;
    
    const config = await Config.findOneAndUpdate(
      { key: req.params.key },
      { value, description },
      { new: true, upsert: true }
    );
    
    res.json(config);
  } catch (error) {
    console.error('Error al actualizar configuración:', error);
    res.status(500).json({ error: 'Error al actualizar configuración' });
  }
});

export default router;
