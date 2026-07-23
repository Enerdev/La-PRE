import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, UserPlus, UserX, Users, ClipboardX, ArrowLeft, Search } from 'lucide-react';
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

  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [dni, setDni] = useState('');
  const [email, setEmail] = useState('');
  const [mensaje, setMensaje] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  const estudiantesFiltrados = estudiantes.filter((e) => {
    const texto = `${e.nombres} ${e.apellidos} ${e.dni || ''}`.toLowerCase();
    return texto.includes(busqueda.toLowerCase());
  });

  const cargarEstudiantes = useCallback((id) => {
    if (!id) return;
    api.listarEstudiantes(id).then(setEstudiantes);
  }, []);

  useEffect(() => {
    if (esDireccion) {
      api.listarSedes().then((lista) => {
        setSedes(lista);
        if (lista.length > 0) setSedeId(lista[0].id_sede);
      });
    } else {
      cargarEstudiantes(sesion.sede_id);
    }
  }, [esDireccion, sesion, cargarEstudiantes]);

  useEffect(() => {
    if (esDireccion && sedeId) cargarEstudiantes(sedeId);
  }, [esDireccion, sedeId, cargarEstudiantes]);

  async function registrar(e) {
    e.preventDefault();
    setMensaje(null);
    setEnviando(true);
    try {
      await api.crearEstudiante({ nombres, apellidos, dni, email, sedeId });
      setNombres('');
      setApellidos('');
      setDni('');
      setEmail('');
      cargarEstudiantes(sedeId);
      setMensaje({ tipo: 'exito', texto: 'Estudiante registrado.' });
      mostrarToast({ tipo: 'exito', texto: 'Estudiante registrado.' });
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message });
      mostrarToast({ tipo: 'error', texto: err.message });
    } finally {
      setEnviando(false);
    }
  }

  async function inactivar(id) {
    if (!confirm('¿Inactivar a este estudiante? No se elimina, solo deja de aparecer como activo.')) return;
    await api.inactivarEstudiante(id);
    mostrarToast({ tipo: 'exito', texto: 'Estudiante inactivado.' });
    cargarEstudiantes(sedeId);
  }

  return (
    <div className="admin animar-entrada">
      <header className="admin__header">
        <Link to="/panel" className="admin__volver"><ArrowLeft size={13} /> Volver al panel</Link>
        <h1><GraduationCap size={20} /> Estudiantes</h1>
      </header>

      <div className="admin__cuerpo">
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
              <input value={dni} onChange={(e) => setDni(e.target.value)} />
            </div>
            <div className="selector-campo">
              <label>Correo (opcional, para notificaciones)</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <button className="boton boton--primario" disabled={enviando}>
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
            {estudiantesFiltrados.map((e) => (
              <div className="fila-item" key={e.id_estudiante}>
                <div className="fila-item__persona">
                  <span className="avatar-iniciales">{iniciales(e.nombres, e.apellidos)}</span>
                  <div className="fila-item__texto">
                    <div className="fila-item__principal">{e.apellidos}, {e.nombres}</div>
                    <div className="fila-item__meta">DNI {e.dni || '—'}</div>
                  </div>
                </div>
                <button className="fila-item__accion" onClick={() => inactivar(e.id_estudiante)}>
                  <UserX size={14} /> <span>Inactivar</span>
                </button>
              </div>
            ))}
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
