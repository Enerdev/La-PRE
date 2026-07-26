import { useState } from 'react';
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

  // Campos Registro/Activación Estudiante
  const [regDni, setRegDni] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regErrors, setRegErrors] = useState({ regDni: '', regUsername: '', regPassword: '' });

  // Feedback y Carga
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);
  const [cargando, setCargando] = useState(false);

  function normalizarIdentificador(valor) {
    return valor?.trim();
  }

  function validarCampoRegistro(campo, valor) {
    if (campo === 'regDni') {
      if (!valor) return 'El DNI es obligatorio.';
      if (!/^[0-9]+$/.test(valor)) return 'El DNI debe tener solo números.';
      if (valor.length < 8 || valor.length > 15) return 'El DNI debe tener entre 8 y 15 dígitos.';
      return '';
    }

    if (campo === 'regUsername') {
      if (!valor) return 'El usuario es obligatorio.';
      if (valor.length < 5) return 'El usuario debe tener al menos 5 caracteres.';
      return '';
    }

    if (campo === 'regPassword') {
      if (!valor) return 'La contraseña es obligatoria.';
      if (valor.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
      return '';
    }

    return '';
  }

  function actualizarErrorRegistro(campo, valor) {
    setRegErrors((prev) => ({ ...prev, [campo]: validarCampoRegistro(campo, valor) }));
  }

  function validarRegistro() {
    const nuevoError = {
      regDni: validarCampoRegistro('regDni', regDni),
      regUsername: validarCampoRegistro('regUsername', regUsername),
      regPassword: validarCampoRegistro('regPassword', regPassword),
    };

    setRegErrors(nuevoError);
    return !Object.values(nuevoError).some(Boolean);
  }

  function manejarRegDniChange(e) {
    const valor = e.target.value.replace(/\D/g, '');
    setRegDni(valor);
    actualizarErrorRegistro('regDni', valor);
  }

  function manejarRegUsernameChange(e) {
    const valor = e.target.value.trimStart();
    setRegUsername(valor);
    actualizarErrorRegistro('regUsername', valor);
  }

  function manejarRegPasswordChange(e) {
    const valor = e.target.value;
    setRegPassword(valor);
    actualizarErrorRegistro('regPassword', valor);
  }

  async function manejarLogin(e) {
    e.preventDefault();
    setError(null);
    setExito(null);
    setCargando(true);
    try {
      const sesion = await iniciarSesion(normalizarIdentificador(username), password);
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

    if (!validarRegistro()) {
      setError('Corrige los campos marcados para activar la cuenta.');
      setCargando(false);
      return;
    }

    try {
      const res = await api.registroEstudiante({
        dni: regDni,
        username: regUsername.trim(),
        password: regPassword,
      });

      setExito(res.mensaje || '¡Cuenta de estudiante activada con éxito! Ya puedes iniciar sesión.');
      setUsername(regUsername);
      setPassword(regPassword);
      setRegDni('');
      setRegUsername('');
      setRegPassword('');
      setRegErrors({ regDni: '', regUsername: '', regPassword: '' });
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
          <div className="login-pestanas" role="tablist" aria-label="Opciones de acceso">
            <button
              type="button"
              role="tab"
              id="tab-login"
              aria-controls="panel-login"
              aria-selected={pestana === 'login'}
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
              role="tab"
              id="tab-registro"
              aria-controls="panel-registro"
              aria-selected={pestana === 'registro'}
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
                <p>Ingresa tu usuario o DNI institucional y tu contraseña para continuar</p>
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
            /* FORMULARIO 2: ACTIVACIÓN DE CUENTA ESTUDIANTIL */
            <form className="login-form" role="tabpanel" aria-labelledby="tab-registro" id="panel-registro" onSubmit={manejarRegistro}>
              <div className="login-form__encabezado">
                <h3>Activación de Cuenta</h3>
                <p>
                  Para activar tu acceso se requiere que el estudiante ya exista en la base de datos.
                  Completa el DNI, tu usuario elegido y la contraseña para crear la cuenta.
                </p>
                <ul className="login-instrucciones">
                  <li>El estudiante debe existir previamente en el sistema.</li>
                  <li>La activación se realiza con DNI numérico + usuario + contraseña.</li>
                  <li>Si no aparece el DNI correcto, consulta con tu sede.</li>
                </ul>
              </div>

              <div className="campo">
                <label htmlFor="regDni">DNI o Documento</label>
                <input
                  id="regDni"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="Ej. 74839201"
                  maxLength={15}
                  value={regDni}
                  onChange={manejarRegDniChange}
                  aria-required="true"
                  aria-invalid={Boolean(regErrors.regDni)}
                  aria-describedby="regDniError"
                  required
                />
                <span id="regDniError" className="campo__mensaje-error" aria-live="polite">
                  {regErrors.regDni}
                </span>
              </div>

              <div className="campo">
                <label htmlFor="regUsername">Usuario Elegido</label>
                <input
                  id="regUsername"
                  type="text"
                  placeholder="Ej. jperez2026"
                  value={regUsername}
                  onChange={manejarRegUsernameChange}
                  aria-required="true"
                  aria-invalid={Boolean(regErrors.regUsername)}
                  aria-describedby="regUsernameError"
                  required
                />
                <span id="regUsernameError" className="campo__mensaje-error" aria-live="polite">
                  {regErrors.regUsername}
                </span>
              </div>

              <div className="campo">
                <label htmlFor="regPassword">Contraseña</label>
                <input
                  id="regPassword"
                  type="password"
                  placeholder="Mín. 8 caracteres"
                  minLength={8}
                  value={regPassword}
                  onChange={manejarRegPasswordChange}
                  aria-required="true"
                  aria-invalid={Boolean(regErrors.regPassword)}
                  aria-describedby="regPasswordError"
                  required
                />
                <span id="regPasswordError" className="campo__mensaje-error" aria-live="polite">
                  {regErrors.regPassword}
                </span>
              </div>

              <button
                type="submit"
                className="boton-primario-glow"
                disabled={cargando}
              >
                {cargando ? 'Activando cuenta...' : 'Activar cuenta'}
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
