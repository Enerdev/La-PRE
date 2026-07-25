import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, UserPlus, UserX, Users, ClipboardX, ArrowLeft, Search, Key, CheckCircle, Copy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../api/client';
import '../styles/admin.css';

function iniciales(nombres, apellidos) {
  return `${(nombres || '?')[0]}${(apellidos || '?')[0]}`.toUpperCase();
}

export default function EstudiantesPage() {
  const { sesion } = useAuth();
  const { mostrarToast } = useToast();
  const esDireccion = sesion.rol === 'direccion';

  const [sedes, setSedes] = useState([]);
  const [sedeId, setSedeId] = useState(esDireccion ? '' : sesion.sede_id);
  const [estudiantes, setEstudiantes] = useState([]);
  const [usuarios, setUsuarios] = useState([]);

  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [dni, setDni] = useState('');
  const [email, setEmail] = useState('');
  const [crearCuentaAuto, setCrearCuentaAuto] = useState(true);
  const [mensaje, setMensaje] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  // Modal para mostrar credenciales generadas
  const [credencialGenerada, setCredencialGenerada] = useState(null);

  const estudiantesFiltrados = estudiantes.filter((e) => {
    const texto = `${e.nombres} ${e.apellidos} ${e.dni || ''}`.toLowerCase();
    return texto.includes(busqueda.toLowerCase());
  });

  // Mapa de estudiante_id -> usuario object para rápido acceso
  const usuariosPorEstudiante = {};
  usuarios.forEach((u) => {
    if (u.estudiante_id) {
      usuariosPorEstudiante[u.estudiante_id] = u;
    }
  });

  const cargarDatos = useCallback((id) => {
    if (!id) return;
    Promise.all([
      api.listarEstudiantes(id),
      api.listarUsuarios(id).catch(() => []),
    ]).then(([listaEst, listaUsu]) => {
      setEstudiantes(listaEst);
      setUsuarios(listaUsu);
    });
  }, []);

  useEffect(() => {
    if (esDireccion) {
      api.listarSedes().then((lista) => {
        setSedes(lista);
        if (lista.length > 0) setSedeId(lista[0].id_sede);
      });
    } else {
      cargarDatos(sesion.sede_id);
    }
  }, [esDireccion, sesion, cargarDatos]);

  useEffect(() => {
    if (esDireccion && sedeId) cargarDatos(sedeId);
  }, [esDireccion, sedeId, cargarDatos]);

  async function registrar(e) {
    e.preventDefault();
    setMensaje(null);
    setEnviando(true);
    try {
      const nuevoEst = await api.crearEstudiante({ nombres, apellidos, dni, email, sedeId });
      
      let infoCredencial = null;
      if (crearCuentaAuto && dni && dni.trim().length >= 5) {
        try {
          const uUsername = dni.trim();
          const uPassword = `PRE${dni.trim()}`;
          await api.crearUsuario({
            username: uUsername,
            password: uPassword,
            rol: 'estudiante',
            sedeId,
            estudianteId: nuevoEst.id_estudiante,
          });
          infoCredencial = {
            estudiante: `${apellidos}, ${nombres}`,
            username: uUsername,
            password: uPassword,
          };
        } catch (errUser) {
          console.warn('Estudiante creado, pero no se pudo generar cuenta auto:', errUser.message);
        }
      }

      setNombres('');
      setApellidos('');
      setDni('');
      setEmail('');
      cargarDatos(sedeId);

      if (infoCredencial) {
        setCredencialGenerada(infoCredencial);
        setMensaje({ tipo: 'exito', texto: `Estudiante y cuenta creados con éxito.` });
        mostrarToast({ tipo: 'exito', texto: 'Estudiante y credenciales de acceso creados.' });
      } else {
        setMensaje({ tipo: 'exito', texto: 'Estudiante registrado.' });
        mostrarToast({ tipo: 'exito', texto: 'Estudiante registrado.' });
      }
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message });
      mostrarToast({ tipo: 'error', texto: err.message });
    } finally {
      setEnviando(false);
    }
  }

  async function generarCredencialesManual(est) {
    if (!est.dni) {
      alert('El estudiante no tiene DNI registrado. Edita o asigna un DNI para generar sus credenciales.');
      return;
    }

    const uUsername = est.dni.trim();
    const uPassword = `PRE${est.dni.trim()}`;

    try {
      await api.crearUsuario({
        username: uUsername,
        password: uPassword,
        rol: 'estudiante',
        sedeId: est.sede_id || sedeId,
        estudianteId: est.id_estudiante,
      });

      setCredencialGenerada({
        estudiante: `${est.apellidos}, ${est.nombres}`,
        username: uUsername,
        password: uPassword,
      });

      mostrarToast({ tipo: 'exito', texto: 'Credenciales generadas con éxito.' });
      cargarDatos(sedeId);
    } catch (err) {
      mostrarToast({ tipo: 'error', texto: err.message });
    }
  }

  async function inactivar(id) {
    if (!confirm('¿Inactivar a este estudiante? No se elimina, solo deja de aparecer como activo.')) return;
    await api.inactivarEstudiante(id);
    mostrarToast({ tipo: 'exito', texto: 'Estudiante inactivado.' });
    cargarDatos(sedeId);
  }

  function copiarCredenciales() {
    if (!credencialGenerada) return;
    const texto = `🎓 ACADEMIA LA PRE PERÚ - CREDENCIALES DE ACCESO\nEstudiante: ${credencialGenerada.estudiante}\nUsuario: ${credencialGenerada.username}\nContraseña: ${credencialGenerada.password}\nPortal: http://localhost:5173/login`;
    navigator.clipboard.writeText(texto);
    mostrarToast({ tipo: 'exito', texto: 'Credenciales copiadas al portapapeles' });
  }

  return (
    <div className="admin animar-entrada">
      <header className="admin__header">
        <Link to="/panel" className="admin__volver"><ArrowLeft size={13} /> Volver al panel</Link>
        <h1><GraduationCap size={20} /> Estudiantes y Credenciales</h1>
      </header>

      <div className="admin__cuerpo">
        {/* TARJETA MODAL / NOTIFICACIÓN DE CREDECIAL GENERADA */}
        {credencialGenerada && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(200,30,46,0.15), rgba(30,30,30,0.95))',
            border: '1px solid var(--rojo-pre)',
            borderRadius: '12px',
            padding: '1.25rem',
            marginBottom: '1.5rem',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, color: '#e3a542', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}>
                <Key size={18} /> Credencial de Acceso Generada
              </h3>
              <button
                onClick={() => setCredencialGenerada(null)}
                style={{ background: 'transparent', border: 'none', color: '#aaa', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            <p style={{ margin: '0 0 0.5rem 0', color: '#fff', fontSize: '0.9rem' }}>
              Entrega esta información al alumno <strong>{credencialGenerada.estudiante}</strong>:
            </p>
            <div style={{ background: '#141414', padding: '0.85rem', borderRadius: '8px', fontFamily: 'monospace', fontSize: '0.9rem', marginBottom: '0.75rem', color: '#52c41a' }}>
              <div><strong>USUARIO:</strong> {credencialGenerada.username}</div>
              <div><strong>CONTRASEÑA:</strong> {credencialGenerada.password}</div>
            </div>
            <button
              onClick={copiarCredenciales}
              className="boton boton--primario"
              style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}
            >
              <Copy size={14} /> Copiar datos para enviar por WhatsApp / Correo
            </button>
          </div>
        )}

        {esDireccion && (
          <div className="selector-campo">
            <label>Sede</label>
            <select value={sedeId} onChange={(e) => setSedeId(Number(e.target.value))}>
              {sedes.map((s) => (
                <option key={s.id_sede} value={s.id_sede}>{s.nombre}</option>
              ))}
            </select>
          </div>
        )}

        <section className="admin__seccion">
          <h2><UserPlus size={17} /> Registrar estudiante</h2>
          <form className="form-inline" onSubmit={registrar}>
            <div className="selector-campo">
              <label>Nombres</label>
              <input value={nombres} onChange={(e) => setNombres(e.target.value)} required />
            </div>
            <div className="selector-campo">
              <label>Apellidos</label>
              <input value={apellidos} onChange={(e) => setApellidos(e.target.value)} required />
            </div>
            <div className="selector-campo">
              <label>DNI</label>
              <input value={dni} onChange={(e) => setDni(e.target.value)} required placeholder="Ej. 74839201" />
            </div>
            <div className="selector-campo">
              <label>Correo (opcional)</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div className="selector-campo" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '1.2rem' }}>
              <input
                type="checkbox"
                id="crearAcceso"
                checked={crearCuentaAuto}
                onChange={(e) => setCrearCuentaAuto(e.target.checked)}
                style={{ width: 'auto', margin: 0 }}
              />
              <label htmlFor="crearAcceso" style={{ cursor: 'pointer', margin: 0, fontSize: '0.82rem' }}>
                Crear cuenta de acceso (Usuario: DNI, Clave: PRE + DNI)
              </label>
            </div>

            <button className="boton boton--primario" disabled={enviando} style={{ marginTop: '1.2rem' }}>
              <UserPlus size={16} /> {enviando ? 'Guardando…' : 'Registrar'}
            </button>
          </form>
          {mensaje && (
            <p className={`admin__mensaje admin__mensaje--${mensaje.tipo}`}>{mensaje.texto}</p>
          )}
        </section>

        <section className="admin__seccion">
          <h2><Users size={17} /> Estudiantes activos ({estudiantesFiltrados.length}{busqueda ? ` de ${estudiantes.length}` : ''})</h2>

          <div className="buscador" style={{ marginBottom: '0.9rem' }}>
            <Search size={16} />
            <input
              type="text"
              placeholder="Buscar por nombre, apellido o DNI…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <div className="lista-filas">
            {estudiantesFiltrados.map((e) => {
              const tieneUsuario = !!usuariosPorEstudiante[e.id_estudiante];
              const usuarioData = usuariosPorEstudiante[e.id_estudiante];

              return (
                <div className="fila-item" key={e.id_estudiante}>
                  <div className="fila-item__persona">
                    <span className="avatar-iniciales">{iniciales(e.nombres, e.apellidos)}</span>
                    <div className="fila-item__texto">
                      <div className="fila-item__principal">{e.apellidos}, {e.nombres}</div>
                      <div className="fila-item__meta" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <span>DNI {e.dni || '—'}</span>
                        {tieneUsuario ? (
                          <span style={{ color: '#2e9e5b', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle size={12} /> Cuenta Activa ({usuarioData.username})
                          </span>
                        ) : (
                          <span style={{ color: '#e3a542', fontSize: '0.78rem' }}>Sin cuenta de acceso</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    {!tieneUsuario && (
                      <button
                        className="boton boton--secundario"
                        style={{ fontSize: '0.78rem', padding: '0.35rem 0.6rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                        onClick={() => generarCredencialesManual(e)}
                        title="Crear usuario y clave para el alumno"
                      >
                        <Key size={13} /> Generar Credencial
                      </button>
                    )}

                    <button className="fila-item__accion" onClick={() => inactivar(e.id_estudiante)}>
                      <UserX size={14} /> <span>Inactivar</span>
                    </button>
                  </div>
                </div>
              );
            })}
            {estudiantes.length === 0 && (
              <p className="admin__vacio"><ClipboardX size={16} /> No hay estudiantes registrados aún.</p>
            )}
            {estudiantes.length > 0 && estudiantesFiltrados.length === 0 && (
              <p className="admin__vacio"><Search size={16} /> Ningún estudiante coincide con "{busqueda}".</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
