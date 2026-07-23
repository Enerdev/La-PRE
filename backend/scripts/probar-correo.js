// Prueba rápida y aislada del servicio de notificaciones, sin pasar por la API.
// Uso: node scripts/probar-correo.js
require('dotenv').config();
const { enviarConfirmacionPago, enviarNotificacionRanking } = require('../src/services/notificacion.service');

async function main() {
  console.log('--- Probando confirmación de pago ---');
  const r1 = await enviarConfirmacionPago({
    correoEstudiante: 'jose.ramos@ejemplo.com',
    nombreEstudiante: 'José Ramos',
    monto: 200,
    fecha: new Date(),
  });
  console.log('Resultado:', r1, '\n');

  console.log('--- Probando notificación de ranking publicado ---');
  const r2 = await enviarNotificacionRanking({
    correoEstudiante: 'ana.quispe@ejemplo.com',
    nombreEstudiante: 'Ana Quispe',
    nombreSimulacro: 'Simulacro N°01',
    puesto: 1,
    puntaje: 95,
  });
  console.log('Resultado:', r2, '\n');

  console.log('Si ves "enviado: true" arriba, copia el link de vista previa (Ethereal) que');
  console.log('apareció más arriba en la consola y ábrelo en tu navegador para ver el correo.');
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
