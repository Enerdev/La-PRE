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
};

export { getToken };
