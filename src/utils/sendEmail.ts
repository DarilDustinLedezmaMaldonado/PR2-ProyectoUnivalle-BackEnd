import nodemailer from 'nodemailer';

export const sendVerificationEmail = async (to: string, code: string) => {
  console.log('📧 Configurando envío de correo...');
  console.log('📧 EMAIL_USER configurado:', !!process.env.EMAIL_USER);
  console.log('📧 EMAIL_PASS configurado:', !!process.env.EMAIL_PASS);

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('EMAIL_USER y EMAIL_PASS deben estar configurados');
  }

  console.log('📧 Creando transporter...');
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    logger: true,   // agrega logs
    debug: true,    // más detalles de la conexión SMTP
  });


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

    // Crear una promesa con timeout
    const sendPromise = transporter.sendMail(mailOptions);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout al enviar correo')), 50000)
    );

    const result = await Promise.race([sendPromise, timeoutPromise]);
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
