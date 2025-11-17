import { Request, Response } from 'express';
import User from '../models/User';
import crypto from 'crypto';
import { sendEmail } from '../utils/sendEmail';

// Solicitar restablecimiento de contraseña
export const requestPasswordReset = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ message: 'El email es requerido' });
      return;
    }

    // Buscar usuario por email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Por seguridad, no revelamos si el usuario existe
      res.status(200).json({ 
        message: 'Si el correo existe, recibirás instrucciones para restablecer tu contraseña' 
      });
      return;
    }

    // Generar token de restablecimiento
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Guardar token y expiración (1 hora)
    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hora
    await user.save();

    // URL del frontend
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174';
    const resetUrl = `${frontendUrl}/account/reset-password?token=${resetToken}`;

    // Enviar email
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #be185d;">Recuperación de contraseña</h2>
        <p>Hola ${user.fullname},</p>
        <p>Recibimos una solicitud para restablecer tu contraseña. Si no fuiste tú, ignora este correo.</p>
        <p>Para restablecer tu contraseña, haz clic en el siguiente enlace:</p>
        <a href="${resetUrl}" 
           style="display: inline-block; padding: 12px 24px; background-color: #be185d; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
          Restablecer contraseña
        </a>
        <p style="color: #666; font-size: 12px;">Este enlace expira en 1 hora.</p>
        <p style="color: #666; font-size: 12px;">Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
        <p style="color: #666; font-size: 12px; word-break: break-all;">${resetUrl}</p>
      </div>
    `;

    try {
      await sendEmail(
        user.email,
        'Recuperación de contraseña - HANSA',
        emailHtml
      );

      console.log(`Email de recuperación enviado a ${user.email}`);
      res.status(200).json({ 
        message: 'Si el correo existe, recibirás instrucciones para restablecer tu contraseña' 
      });
    } catch (emailError) {
      console.error('Error enviando email:', emailError);
      // Limpiar tokens si falla el envío
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      res.status(500).json({ 
        message: 'Error al enviar el correo. Por favor intenta más tarde.' 
      });
    }

  } catch (error: any) {
    console.error('Error en requestPasswordReset:', error);
    res.status(500).json({ message: 'Error del servidor al procesar la solicitud' });
  }
};

// Restablecer contraseña con token
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      res.status(400).json({ message: 'Token y nueva contraseña son requeridos' });
      return;
    }

    // Validar longitud de contraseña
    if (newPassword.length < 8) {
      res.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres' });
      return;
    }

    // Hash del token para comparar
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Buscar usuario con token válido y no expirado
    const user = await User.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      res.status(400).json({ 
        message: 'Token inválido o expirado. Solicita un nuevo enlace de recuperación.' 
      });
      return;
    }

    // Actualizar contraseña
    user.password = newPassword; // El modelo se encarga del hash con el pre-save hook
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    console.log(`Contraseña restablecida para usuario: ${user.email}`);

    res.status(200).json({ 
      message: 'Contraseña actualizada exitosamente. Ya puedes iniciar sesión.' 
    });

  } catch (error: any) {
    console.error('Error en resetPassword:', error);
    res.status(500).json({ message: 'Error del servidor al restablecer la contraseña' });
  }
};

// Verificar validez de token (opcional, para UI)
export const verifyResetToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;

    if (!token) {
      res.status(400).json({ message: 'Token es requerido' });
      return;
    }

    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      res.status(400).json({ 
        valid: false,
        message: 'Token inválido o expirado' 
      });
      return;
    }

    res.status(200).json({ 
      valid: true,
      message: 'Token válido',
      email: user.email
    });

  } catch (error: any) {
    console.error('Error en verifyResetToken:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};
