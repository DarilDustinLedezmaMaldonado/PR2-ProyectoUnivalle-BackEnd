import { Router } from 'express';
import { requestPasswordReset, resetPassword, verifyResetToken } from '../controllers/passwordResetController';

const router = Router();

// Solicitar restablecimiento de contraseña (envía email)
router.post('/request', requestPasswordReset);

// Verificar si un token es válido
router.get('/verify/:token', verifyResetToken);

// Restablecer contraseña con token
router.post('/reset', resetPassword);

export default router;
