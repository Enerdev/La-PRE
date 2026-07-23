import { Link, useLocation, useNavigate } from 'react-router-dom';
import { QrCode, Trophy, Wallet, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/navEstudiante.css';

const ENLACES = [
  { ruta: '/mi-qr', etiqueta: 'Mi QR', Icono: QrCode },
  { ruta: '/mis-resultados', etiqueta: 'Mis Resultados', Icono: Trophy },
  { ruta: '/mis-pagos', etiqueta: 'Mis Pagos', Icono: Wallet },
];

export default function NavEstudiante() {
  const { cerrarSesion } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  function salir() {
    cerrarSesion();
    navigate('/login');
  }

  return (
    <nav className="nav-estudiante">
      <div className="nav-estudiante__enlaces">
        {ENLACES.map(({ ruta, etiqueta, Icono }) => (
          <Link
            key={ruta}
            to={ruta}
            aria-label={etiqueta}
            className={`nav-estudiante__enlace ${pathname === ruta ? 'nav-estudiante__enlace--activo' : ''}`}
          >
            <Icono size={15} /> <span className="nav-estudiante__texto">{etiqueta}</span>
          </Link>
        ))}
      </div>
      <button className="boton boton--fantasma" onClick={salir} aria-label="Salir">
        <LogOut size={15} /> <span className="nav-estudiante__texto">Salir</span>
      </button>
    </nav>
  );
}
