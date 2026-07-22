import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

// Decodifica el payload del JWT SOLO para saber qué mostrar en la interfaz
// (rol, sede, estudiante_id). Esto no es una verificación de seguridad —
// esa la hace siempre el backend en cada petición.
function decodificarPayload(token) {
  try {
    const base64 = token.split('.')[1];
    const json = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('la_pre_token');
    if (token) {
      const payload = decodificarPayload(token);
      if (payload && payload.exp * 1000 > Date.now()) {
        setSesion({ token, ...payload });
      } else {
        localStorage.removeItem('la_pre_token');
      }
    }
    setCargando(false);
  }, []);

  async function iniciarSesion(username, password) {
    const { token, rol } = await api.login(username, password);
    localStorage.setItem('la_pre_token', token);
    const payload = decodificarPayload(token);
    const nuevaSesion = { token, rol, ...payload };
    setSesion(nuevaSesion);
    return nuevaSesion;
  }

  function cerrarSesion() {
    localStorage.removeItem('la_pre_token');
    setSesion(null);
  }

  return (
    <AuthContext.Provider value={{ sesion, cargando, iniciarSesion, cerrarSesion }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
