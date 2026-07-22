import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/login.css';

const RUTA_POR_ROL = {
  personal_asistencia: '/escaner',
  estudiante: '/mi-qr',
  administrador_sede: '/panel',
  direccion: '/panel',
};

export default function LoginPage() {
  const { iniciarSesion } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);

  async function manejarEnvio(e) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      const sesion = await iniciarSesion(username, password);
      navigate(RUTA_POR_ROL[sesion.rol] || '/panel');
    } catch (err) {
      setError(err.message || 'Usuario o contraseña incorrectos.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="login-escena">
      <div className="login-marca">
        <span className="eyebrow">Academia Preuniversitaria</span>
        <span className="login-marca__titulo">LA PRE PERÚ</span>
      </div>

      <div>
        <form className="login-ficha" onSubmit={manejarEnvio}>
          <div className="login-ficha__encabezado">
            <span className="login-ficha__serie">FICHA DE ACCESO · CICLO VERANO 2026</span>
            <h1 className="login-ficha__titulo">Ingresar al sistema</h1>
            <p className="login-ficha__subtitulo">
              ¡Nosotros te exigimos más! — Asistencia, pagos y rankings
            </p>
          </div>

          <div className="login-ficha__cuerpo">
            {error && <div className="login-error">{error}</div>}

            <div className="campo">
              <label htmlFor="username">Usuario</label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="campo">
              <label htmlFor="password">Contraseña</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="boton boton--primario login-ficha__boton"
              disabled={cargando}
            >
              {cargando ? 'Verificando…' : 'Ingresar →'}
            </button>
          </div>
        </form>

        <p className="login-pie">Sistema de Gestión Estudiantil · LA PRE PERÚ</p>
      </div>
    </div>
  );
}
