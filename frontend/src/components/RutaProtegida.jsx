import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Nota: esto solo controla qué se muestra en la interfaz.
// El backend siempre vuelve a verificar el rol en cada endpoint (RBAC real).
export default function RutaProtegida({ rolesPermitidos, children }) {
  const { sesion, cargando } = useAuth();

  if (cargando) {
    return <div className="pantalla-cargando">Cargando…</div>;
  }

  if (!sesion) {
    return <Navigate to="/login" replace />;
  }

  if (rolesPermitidos && !rolesPermitidos.includes(sesion.rol)) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
