const rateLimit = require('express-rate-limit');

// Corrige VULN-002 de tu propio reporte OWASP ZAP: "Autenticación débil —
// permite fuerza bruta por ausencia de limitación de intentos".
// Después de 5 intentos fallidos en 15 minutos desde la misma IP, se bloquea
// temporalmente (RNF de seguridad: bloqueo temporal tras múltiples intentos, PS-01).
const limitadorLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  // Clave del arreglo: solo los intentos FALLIDOS cuentan contra el límite.
  // Sin esto, varios usuarios legítimos compartiendo la misma IP de sede
  // (algo normal en una academia) terminan bloqueando a los demás con
  // logins exitosos. El objetivo es frenar fuerza bruta, no gente real.
  skipSuccessfulRequests: true,
  message: { error: 'Demasiados intentos de inicio de sesión. Intenta de nuevo en unos minutos.' },
});

module.exports = { limitadorLogin };
