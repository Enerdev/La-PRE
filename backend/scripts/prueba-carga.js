// Dispara peticiones HTTP concurrentes reales contra tu backend corriendo
// (no simula nada a nivel de código: usa fetch, igual que lo haría un navegador)
// y mide tiempos, para verificar en la práctica los escenarios PR-01 y PR-02
// de tu informe. Requiere Node 18+ (fetch nativo).
//
// Uso:
//   node scripts/prueba-carga.js <id_simulacro>
// El <id_simulacro> es el que te imprime scripts/seed-carga.js al final.
require('dotenv').config();

const BASE_URL = process.env.APP_URL || 'http://localhost:3000';
const USUARIO = process.env.CARGA_USUARIO || 'admin_central';
const CONTRASENA = process.env.CARGA_PASSWORD || 'admin123';

async function login() {
  const res = await fetch(`${BASE_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: USUARIO, password: CONTRASENA }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Login falló (${res.status})`);
  return data.token;
}

function percentil(valores, p) {
  const ordenado = [...valores].sort((a, b) => a - b);
  const indice = Math.max(0, Math.ceil((p / 100) * ordenado.length) - 1);
  return ordenado[indice];
}

async function dispararConcurrencia(url, token, cantidad) {
  const tiempos = [];
  let exitosas = 0;
  let fallidas = 0;

  const inicio = Date.now();

  const tareas = Array.from({ length: cantidad }, async () => {
    const t0 = Date.now();
    try {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      tiempos.push(Date.now() - t0);
      if (res.ok) exitosas += 1;
      else fallidas += 1;
    } catch {
      tiempos.push(Date.now() - t0);
      fallidas += 1;
    }
  });

  await Promise.all(tareas);

  return { totalMs: Date.now() - inicio, exitosas, fallidas, tiempos };
}

function reportar(titulo, resultado, metaPromedioMs) {
  const { totalMs, exitosas, fallidas, tiempos } = resultado;
  const promedio = tiempos.reduce((a, b) => a + b, 0) / (tiempos.length || 1);
  const p95 = percentil(tiempos, 95);
  const p99 = percentil(tiempos, 99);
  const cumple = promedio <= metaPromedioMs;

  console.log(`\n=== ${titulo} ===`);
  console.log(`Peticiones concurrentes: ${exitosas + fallidas}`);
  console.log(`Exitosas: ${exitosas}   Fallidas: ${fallidas}`);
  console.log(`Tiempo total (todas en paralelo): ${totalMs} ms`);
  console.log(`Latencia promedio por petición: ${promedio.toFixed(1)} ms`);
  console.log(`Latencia p95: ${p95} ms   Latencia p99: ${p99} ms`);
  console.log(`Meta (<= ${metaPromedioMs} ms promedio): ${cumple ? 'CUMPLE' : 'NO CUMPLE'}`);
}

async function main() {
  const simulacroId = process.argv[2];
  if (!simulacroId) {
    console.error('Uso: node scripts/prueba-carga.js <id_simulacro>');
    console.error('(el id te lo da scripts/seed-carga.js al terminar)');
    process.exit(1);
  }

  console.log(`Autenticando como ${USUARIO}...`);
  const token = await login();
  console.log('Token obtenido. Iniciando pruebas de carga.\n');

  // PR-01 del informe: "500 estudiantes consultan su ranking al mismo tiempo"
  // Meta: RNF-01, tiempo de respuesta promedio <= 3 segundos.
  const r1 = await dispararConcurrencia(
    `${BASE_URL}/api/simulacros/${simulacroId}/ranking`,
    token,
    500
  );
  reportar('PR-01: 500 consultas simultáneas al ranking', r1, 3000);

  // PR-02 del informe: "Picos de matrícula en periodo de verano" — se aproxima
  // con 500 consultas simultáneas al reporte consolidado de una sede.
  const r2 = await dispararConcurrencia(`${BASE_URL}/api/reportes/sede/1`, token, 500);
  reportar('PR-02 (aproximado): 500 consultas simultáneas al reporte de sede', r2, 3000);
}

main().catch((err) => {
  console.error('Error en la prueba de carga:', err);
  process.exit(1);
});
