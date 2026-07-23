const nodemailer = require('nodemailer');

// Si configuras SMTP_HOST en tu .env, se usa un servidor de correo real
// (Gmail con contraseña de aplicación, SendGrid, Resend, etc.).
// Si no lo configuras, se crea automáticamente una cuenta de prueba en Ethereal
// (https://ethereal.email) — los correos no llegan a nadie de verdad, pero se
// pueden ver con un link de vista previa que queda impreso en la consola del
// servidor. Así puedes probar todo el flujo sin necesitar una cuenta real.
let transporterPromise = null;
let esCuentaDePrueba = false;

async function obtenerTransporter() {
  if (transporterPromise) return transporterPromise;

  transporterPromise = (async () => {
    if (process.env.SMTP_HOST) {
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_PORT === '465',
        auth: process.env.SMTP_USER
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
      });
    }

    esCuentaDePrueba = true;
    const cuentaPrueba = await nodemailer.createTestAccount();
    console.log('\n[notificaciones] No hay SMTP_HOST configurado: usando una cuenta de prueba Ethereal.');
    console.log('[notificaciones] Los correos no llegan a nadie real; revisa el link de vista previa en cada envío.\n');

    return nodemailer.createTransport({
      host: cuentaPrueba.smtp.host,
      port: cuentaPrueba.smtp.port,
      secure: cuentaPrueba.smtp.secure,
      auth: { user: cuentaPrueba.user, pass: cuentaPrueba.pass },
    });
  })();

  return transporterPromise;
}

// Nunca debe tumbar el flujo principal (registrar un pago, publicar un ranking)
// si el correo falla — por eso siempre atrapa el error internamente.
async function enviar({ para, asunto, html }) {
  if (!para) {
    console.log('[notificaciones] Estudiante sin correo registrado; se omite el envío.');
    return { enviado: false, motivo: 'sin_correo' };
  }

  try {
    const transporter = await obtenerTransporter();
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"LA PRE PERÚ" <no-responder@lapre.pe>',
      to: para,
      subject: asunto,
      html,
    });

    if (esCuentaDePrueba) {
      console.log(`[notificaciones] Vista previa del correo: ${nodemailer.getTestMessageUrl(info)}`);
    }

    return { enviado: true };
  } catch (err) {
    console.error('[notificaciones] Error al enviar correo:', err.message);
    return { enviado: false, motivo: err.message };
  }
}

async function enviarConfirmacionPago({ correoEstudiante, nombreEstudiante, monto, fecha }) {
  return enviar({
    para: correoEstudiante,
    asunto: 'LA PRE PERÚ — Confirmación de pago recibido',
    html: `
      <div style="font-family: sans-serif; max-width: 480px;">
        <h2 style="color:#c81e2e;">Pago confirmado</h2>
        <p>Hola ${nombreEstudiante},</p>
        <p>Registramos un pago de <strong>S/ ${Number(monto).toFixed(2)}</strong> el
        ${new Date(fecha).toLocaleDateString('es-PE')}.</p>
        <p>Este correo es una confirmación automática del Sistema de Gestión Estudiantil.</p>
      </div>
    `,
  });
}

async function enviarNotificacionRanking({ correoEstudiante, nombreEstudiante, nombreSimulacro, puesto, puntaje }) {
  return enviar({
    para: correoEstudiante,
    asunto: `LA PRE PERÚ — Resultados de ${nombreSimulacro} publicados`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px;">
        <h2 style="color:#c81e2e;">¡Resultados publicados!</h2>
        <p>Hola ${nombreEstudiante},</p>
        <p>Los resultados de <strong>${nombreSimulacro}</strong> ya están disponibles.</p>
        <p>Obtuviste el <strong>puesto ${puesto}</strong> con un puntaje de <strong>${puntaje}</strong>.</p>
        <p>Ingresa al sistema para ver el ranking completo.</p>
      </div>
    `,
  });
}

module.exports = { enviarConfirmacionPago, enviarNotificacionRanking };
