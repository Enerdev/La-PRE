import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PanelPage() {
  const { sesion, cerrarSesion } = useAuth();
  const navigate = useNavigate();

  function salir() {
    cerrarSesion();
    navigate('/login');
  }

  return (
    <div className="pantalla-cargando" style={{ flexDirection: 'column', gap: '1rem' }}>
      <p>Panel de {sesion?.rol?.replace('_', ' ')} — en construcción.</p>
      <button className="boton boton--fantasma" onClick={salir}>
        Salir
      </button>
    </div>
  );
}
