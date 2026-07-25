import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
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

  // Estado de Pestaña: 'login' | 'registro'
  const [pestana, setPestana] = useState('login');

  // Campos Login
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);

  // Campos Registro Estudiante
  const [regDni, setRegDni] = useState('');
  const [regNombres, setRegNombres] = useState('');
  const [regApellidos, setRegApellidos] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regSedeId, setRegSedeId] = useState('1');
  const [sedes, setSedes] = useState([]);

  // Feedback y Carga
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);
  const [cargando, setCargando] = useState(false);

  // Cargar sedes para la selección en registro
  useEffect(() => {
    async function cargarSedes() {
      try {
        const listaSedes = await api.listarSedes();
        setSedes(listaSedes);
        if (listaSedes.length > 0) {
          setRegSedeId(listaSedes[0].id_sede.toString());
        }
      } catch (err) {
        console.error('Error al listar sedes:', err);
      }
    }
    cargarSedes();
  }, []);

  async function manejarLogin(e) {
    e.preventDefault();
    setError(null);
    setExito(null);
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

  async function manejarRegistro(e) {
    e.preventDefault();
    setError(null);
    setExito(null);
    setCargando(true);
    try {
      const res = await api.registroEstudiante({
        dni: regDni,
        nombres: regNombres,
        apellidos: regApellidos,
        email: regEmail,
        username: regUsername,
        password: regPassword,
        sedeId: parseInt(regSedeId, 10),
      });

      setExito(res.mensaje || '¡Cuenta de estudiante registrada con éxito!');
      // Rellenar automáticamente el formulario de login con las credenciales creadas
      setUsername(regUsername);
      setPassword(regPassword);
      // Limpiar campos de registro
      setRegDni('');
      setRegNombres('');
      setRegApellidos('');
      setRegEmail('');
      setRegUsername('');
      setRegPassword('');
      // Cambiar a la pestaña de login tras 1.5s
      setTimeout(() => {
        setPestana('login');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Error al registrar la cuenta de estudiante.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="login-escena-split">
      {/* LADO IZQUIERDO: HERO BANNER & BRANDING INSTITUCIONAL */}
      <div className="login-hero">
        <div
          className="login-hero__bg"
          style={{ backgroundImage: `url(/assets/banner.jpg)` }}
        />
        <div className="login-hero__overlay" />

        <div className="login-hero__contenido">
          <div className="login-hero__brand">
            <img
              src="/assets/logo.png"
              alt="Logo LA PRE PERÚ"
              className="login-hero__logo"
            />
            <div className="login-hero__titulos">
              <span className="login-hero__badge">CICLO VERANO & ADMISIÓN 2026</span>
              <h1 className="login-hero__nombre">LA PRE PERÚ</h1>
              <span className="login-hero__subbrand">INSTITUTO PREUNIVERSITARIO DE EXCELENCIA</span>
            </div>
          </div>

          <div className="login-hero__eslogan">
            <h2>«¡Nosotros te exigimos más!»</h2>
            <p>
              Portal Oficial de Gestión Estudiantil, Control Biométrico / QR de Asistencia,
              Reportes Académicos y Rankings por Simulacro.
            </p>
          </div>

          <div className="login-hero__caracteristicas">
            <div className="tarjeta-feature">
              <div className="tarjeta-feature__icono">📱</div>
              <div>
                <strong>Asistencia por QR</strong>
                <p>Ingreso seguro y registro instantáneo</p>
              </div>
            </div>
            <div className="tarjeta-feature">
              <div className="tarjeta-feature__icono">📊</div>
              <div>
                <strong>Rankings Oficiales</strong>
                <p>Revisa tus puntajes y puestos en simulacros</p>
              </div>
            </div>
            <div className="tarjeta-feature">
              <div className="tarjeta-feature__icono">💳</div>
              <div>
                <strong>Estado de Cuenta</strong>
                <p>Gestión transparente de pensiones y pagos</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* LADO DERECHO: FORMULARIO INTERACTIVO (LOGIN / REGISTRO) */}
      <div className="login-formulario-wrapper">
        <div className="login-tarjeta">
          {/* LOGO MÓVIL (Visible solo en dispositivos móviles) */}
          <div className="login-movil-brand">
            <img src="/assets/logo.png" alt="Logo LA PRE" className="login-movil-logo" />
            <h2 className="login-movil-titulo">LA PRE PERÚ</h2>
          </div>

          {/* PESTAÑAS DE NAVEGACIÓN */}
          <div className="login-pestanas">
            <button
              type="button"
              className={`login-pestana ${pestana === 'login' ? 'login-pestana--activa' : ''}`}
              onClick={() => {
                setPestana('login');
                setError(null);
                setExito(null);
              }}
            >
              🔑 Iniciar Sesión
            </button>
            <button
              type="button"
              className={`login-pestana ${pestana === 'registro' ? 'login-pestana--activa' : ''}`}
              onClick={() => {
                setPestana('registro');
                setError(null);
                setExito(null);
              }}
            >
              ✨ Crear Cuenta Estudiante
            </button>
          </div>

          {/* MENSAJES DE ERROR O ÉXITO */}
          {error && <div className="login-alerta login-alerta--error">⚠️ {error}</div>}
          {exito && <div className="login-alerta login-alerta--exito">✅ {exito}</div>}

          {/* FORMULARIO 1: INICIAR SESIÓN */}
          {pestana === 'login' ? (
            <form className="login-form" onSubmit={manejarLogin}>
              <div className="login-form__encabezado">
                <h3>Acceso al Sistema</h3>
                <p>Ingresa tus credenciales institucionales para continuar</p>
              </div>

              <div className="campo">
                <label htmlFor="username">Usuario o DNI</label>
                <div className="input-con-icono">
                  <span className="input-icono">👤</span>
                  <input
                    id="username"
                    type="text"
                    placeholder="Ej. 74839201 o jperez"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="campo">
                <label htmlFor="password">Contraseña</label>
                <div className="input-con-icono">
                  <span className="input-icono">🔒</span>
                  <input
                    id="password"
                    type={mostrarPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="boton-ojo"
                    onClick={() => setMostrarPassword(!mostrarPassword)}
                    title={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {mostrarPassword ? '👁️' : '🙈'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="boton-primario-glow"
                disabled={cargando}
              >
                {cargando ? 'Verificando datos...' : 'Ingresar al Portal →'}
              </button>

              <div className="login-ayuda">
                <p>¿Eres estudiante y no tienes cuenta?</p>
                <button
                  type="button"
                  className="enlace-accion"
                  onClick={() => setPestana('registro')}
                >
                  Registra tu cuenta aquí
                </button>
              </div>
            </form>
          ) : (
            /* FORMULARIO 2: CREAR CUENTA DE ESTUDIANTE */
            <form className="login-form" onSubmit={manejarRegistro}>
              <div className="login-form__encabezado">
                <h3>Registro de Estudiante</h3>
                <p>Crea tu cuenta institucional completando tus datos personales</p>
              </div>

              <div className="login-grid-2">
                <div className="campo">
                  <label htmlFor="regDni">DNI o Documento</label>
                  <input
                    id="regDni"
                    type="text"
                    placeholder="Ej. 74839201"
                    maxLength={15}
                    value={regDni}
                    onChange={(e) => setRegDni(e.target.value)}
                    required
                  />
                </div>

                <div className="campo">
                  <label htmlFor="regSede">Sede de Estudio</label>
                  <select
                    id="regSede"
                    value={regSedeId}
                    onChange={(e) => setRegSedeId(e.target.value)}
                    required
                  >
                    {sedes.length > 0 ? (
                      sedes.map((s) => (
                        <option key={s.id_sede} value={s.id_sede}>
                          {s.nombre}
                        </option>
                      ))
                    ) : (
                      <option value="1">Sede Central</option>
                    )}
                  </select>
                </div>
              </div>

              <div className="login-grid-2">
                <div className="campo">
                  <label htmlFor="regNombres">Nombres</label>
                  <input
                    id="regNombres"
                    type="text"
                    placeholder="Ej. Juan Carlos"
                    value={regNombres}
                    onChange={(e) => setRegNombres(e.target.value)}
                    required
                  />
                </div>

                <div className="campo">
                  <label htmlFor="regApellidos">Apellidos</label>
                  <input
                    id="regApellidos"
                    type="text"
                    placeholder="Ej. Pérez Gómez"
                    value={regApellidos}
                    onChange={(e) => setRegApellidos(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="campo">
                <label htmlFor="regEmail">Correo Electrónico (Opcional)</label>
                <input
                  id="regEmail"
                  type="email"
                  placeholder="estudiante@ejemplo.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                />
              </div>

              <div className="login-grid-2">
                <div className="campo">
                  <label htmlFor="regUsername">Usuario Elegido</label>
                  <input
                    id="regUsername"
                    type="text"
                    placeholder="Ej. jperez2026"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    required
                  />
                </div>

                <div className="campo">
                  <label htmlFor="regPassword">Contraseña</label>
                  <input
                    id="regPassword"
                    type="password"
                    placeholder="Mín. 8 caracteres"
                    minLength={8}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="boton-primario-glow"
                disabled={cargando}
              >
                {cargando ? 'Creando cuenta...' : 'Completar Registro ✓'}
              </button>
            </form>
          )}

          <div className="login-pie-creditos">
            <p>Sistema de Gestión Académica · LA PRE PERÚ © 2026</p>
          </div>
        </div>
      </div>
    </div>
  );
}
