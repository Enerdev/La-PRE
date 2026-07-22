const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

function getToken() {
  return localStorage.getItem('la_pre_token');
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // respuesta sin cuerpo (poco común, pero no debe romper el flujo)
  }

  if (!res.ok) {
    const mensaje = (data && (data.error || data.mensaje)) || `Error ${res.status}`;
    const error = new Error(mensaje);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  login: (username, password) =>
    request('/login', { method: 'POST', body: { username, password }, auth: false }),

  generarQR: (estudianteId) => request(`/asistencia/qr/${estudianteId}`),

  marcarAsistencia: (token) =>
    request('/asistencia', { method: 'POST', body: { token } }),

  listarSedes: () => request('/sedes'),

  reportePorSede: (sedeId) => request(`/reportes/sede/${sedeId}`),
  reporteGeneral: () => request('/reportes/general'),

  listarEstudiantes: (sedeId) => request(`/estudiantes?sede_id=${sedeId}`),
  estadoDeCuenta: (estudianteId) => request(`/pagos/estudiante/${estudianteId}`),
  registrarPago: ({ estudianteId, monto, metodoPago, comprobante }) =>
    request('/pagos', {
      method: 'POST',
      body: { estudiante_id: estudianteId, monto, metodo_pago: metodoPago, comprobante },
    }),

  listarSimulacros: () => request('/simulacros'),
  crearSimulacro: ({ nombre, fecha, tipo }) =>
    request('/simulacros', { method: 'POST', body: { nombre, fecha, tipo } }),
  registrarResultados: (simulacroId, resultados) =>
    request(`/simulacros/${simulacroId}/resultados`, { method: 'POST', body: { resultados } }),
  cerrarSimulacro: (simulacroId) =>
    request(`/simulacros/${simulacroId}/cerrar`, { method: 'POST' }),
  rankingGeneral: (simulacroId) => request(`/simulacros/${simulacroId}/ranking`),

  crearEstudiante: ({ nombres, apellidos, dni, sedeId }) =>
    request('/estudiantes', {
      method: 'POST',
      body: { nombres, apellidos, dni, sede_id: sedeId },
    }),
  inactivarEstudiante: (estudianteId) =>
    request(`/estudiantes/${estudianteId}/inactivar`, { method: 'PATCH' }),

  crearSede: ({ nombre, direccion, capacidad }) =>
    request('/sedes', { method: 'POST', body: { nombre, direccion, capacidad } }),

  listarAuditoria: ({ modulo, limite } = {}) => {
    const params = new URLSearchParams();
    if (modulo) params.set('modulo', modulo);
    if (limite) params.set('limite', limite);
    const query = params.toString();
    return request(`/auditoria${query ? `?${query}` : ''}`);
  },
};

export { getToken };
