import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/shared.css';

const ENLACES_POR_ROL = {
  direccion: [
    { to: '/panel', icono: '📊', texto: 'Dashboard' },
    { to: '/estudiantes', icono: '🎓', texto: 'Estudiantes' },
    { to: '/pagos', icono: '💳', texto: 'Pagos' },
    { to: '/auditoria', icono: '🛡️', texto: 'Auditoría' },
  ],
  administrador_sede: [
    { to: '/panel', icono: '📊', texto: 'Dashboard' },
    { to: '/estudiantes', icono: '🎓', texto: 'Estudiantes' },
    { to: '/pagos', icono: '💳', texto: 'Pagos' },
  ],
  personal_asistencia: [
    { to: '/escaner', icono: '📷', texto: 'Escáner QR' },
    { to: '/estudiantes', icono: '🎓', texto: 'Estudiantes' },
  ],
  estudiante: [
    { to: '/mi-qr', icono: '📱', texto: 'Mi QR' },
    { to: '/mis-resultados', icono: '🏆', texto: 'Mis Resultados' },
    { to: '/mis-pagos', icono: '💳', texto: 'Mis Pagos' },
  ],
};

export default function AppLayout({ titulo, subtitulo, acciones, children }) {
  const { sesion, cerrarSesion } = useAuth();
  const navigate = useNavigate();
  const enlaces = ENLACES_POR_ROL[sesion?.rol] || [];

  function manejarSalir() {
    cerrarSesion();
    navigate('/login', { replace: true });
  }

  return (
    <div className="app-shell">
      <aside className="barra-lateral">
        <div className="barra-lateral__marca">
          <img src="/assets/logo.png" alt="LA PRE PERÚ" />
          <span>LA PRE PERÚ</span>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          {enlaces.map((enlace) => (
            <NavLink
              key={enlace.to}
              to={enlace.to}
              className={({ isActive }) =>
                `enlace-nav ${isActive ? 'enlace-nav--activo' : ''}`
              }
            >
              <span>{enlace.icono}</span>
              <span>{enlace.texto}</span>
            </NavLink>
          ))}
        </nav>

        <div className="barra-lateral__pie">
          <p style={{ margin: 0, color: '#fff', fontWeight: 600 }}>
            {sesion?.nombres || sesion?.username}
          </p>
          <p style={{ margin: '2px 0 10px', textTransform: 'capitalize' }}>
            {(sesion?.rol || '').replace('_', ' ')}
          </p>
          <button className="boton-secundario" style={{ width: '100%' }} onClick={manejarSalir}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="contenido-principal">
        <div className="barra-superior">
          <div className="barra-superior__titulos">
            <h1>{titulo}</h1>
            {subtitulo && <p>{subtitulo}</p>}
          </div>
          {acciones && <div style={{ display: 'flex', gap: '0.6rem' }}>{acciones}</div>}
        </div>

        {children}
      </main>
    </div>
  );
}
