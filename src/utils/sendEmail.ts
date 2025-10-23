import * as SibApiV3Sdk from '@sendinblue/client';

export const sendVerificationEmail = async (to: string, code: string) => {
  console.log('📧 Configurando envío de correo con Brevo...');
  
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.error('❌ Error: BREVO_API_KEY no está configurado en las variables de entorno');
    throw new Error('BREVO_API_KEY debe estar configurado');
  }

  console.log('🔑 Configurando API key de Brevo...');
  const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
  
  try {
    apiInstance.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, apiKey);
    console.log('✅ API key configurada correctamente');
  } catch (error) {
    console.error('❌ Error al configurar API key:', error);
    throw error;
  }


  const mailOptions = {
    from: `"Hansa Sistema" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Código de verificación - Hansa',
    text: `Tu código de verificación es: ${code}\n\nEste código expira en 10 minutos.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #9D0045;">Código de verificación</h2>
        <p>Tu código de verificación es:</p>
        <div style="background-color: #f8dee8; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #9D0045; font-size: 32px; margin: 0;">${code}</h1>
        </div>
        <p><strong>Este código expira en 10 minutos.</strong></p>
        <p>Si no solicitaste este código, puedes ignorar este correo.</p>
      </div>
    `,
  };

  console.log('📧 Enviando correo...');
  console.log('📧 Destinatario:', to);
  console.log('📧 Código:', code);
  console.log('📧 Opciones de correo:', {
    from: mailOptions.from,
    to: mailOptions.to,
    subject: mailOptions.subject
  });

  try {
    console.log('📧 Intentando enviar correo...');

    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    
    sendSmtpEmail.to = [{ email: to }];
    sendSmtpEmail.sender = { 
      email: process.env.BREVO_FROM_EMAIL || 'tu-email-verificado@dominio.com',
      name: 'Hansa Sistema'
    };
    sendSmtpEmail.subject = 'Código de verificación - Hansa';
    sendSmtpEmail.textContent = `Tu código de verificación es: ${code}\n\nEste código expira en 10 minutos.`;
    sendSmtpEmail.htmlContent = mailOptions.html;

    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('📧 Correo enviado exitosamente:');
    console.log('📧 Respuesta completa:', result);
    return result;
  } catch (error: any) {
    console.error('📧 Error al enviar correo:', error);
    console.error('📧 Detalles del error:', {
      message: error?.message || 'Error desconocido',
      code: error?.code || 'Sin código',
      response: error?.response || 'Sin respuesta'
    });
    throw error;
  }
};
