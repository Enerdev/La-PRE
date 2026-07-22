import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import '../styles/admin.css';

export default function EstudiantesPage() {
  const { sesion } = useAuth();
  const esDireccion = sesion.rol === 'direccion';

  const [sedes, setSedes] = useState([]);
  const [sedeId, setSedeId] = useState(esDireccion ? '' : sesion.sede_id);
  const [estudiantes, setEstudiantes] = useState([]);

  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [dni, setDni] = useState('');
  const [mensaje, setMensaje] = useState(null);
  const [enviando, setEnviando] = useState(false);

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
      await api.crearEstudiante({ nombres, apellidos, dni, sedeId });
      setNombres('');
      setApellidos('');
      setDni('');
      cargarEstudiantes(sedeId);
      setMensaje({ tipo: 'exito', texto: 'Estudiante registrado.' });
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message });
    } finally {
      setEnviando(false);
    }
  }

  async function inactivar(id) {
    if (!confirm('¿Inactivar a este estudiante? No se elimina, solo deja de aparecer como activo.')) return;
    await api.inactivarEstudiante(id);
    cargarEstudiantes(sedeId);
  }

  return (
    <div className="admin">
      <header className="admin__header">
        <Link to="/panel" className="admin__volver">← Volver al panel</Link>
        <h1>Estudiantes</h1>
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
          <h2>Registrar estudiante</h2>
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
            <button className="boton boton--primario" disabled={enviando}>
              {enviando ? 'Guardando…' : 'Registrar'}
            </button>
          </form>
          {mensaje && (
            <p className={`admin__mensaje admin__mensaje--${mensaje.tipo}`}>{mensaje.texto}</p>
          )}
        </section>

        <section className="admin__seccion">
          <h2>Estudiantes activos ({estudiantes.length})</h2>
          <div className="lista-filas">
            {estudiantes.map((e) => (
              <div className="fila-item" key={e.id_estudiante}>
                <div>
                  <div className="fila-item__principal">{e.apellidos}, {e.nombres}</div>
                  <div className="fila-item__meta">DNI {e.dni || '—'}</div>
                </div>
                <button className="fila-item__accion" onClick={() => inactivar(e.id_estudiante)}>
                  Inactivar
                </button>
              </div>
            ))}
            {estudiantes.length === 0 && <p className="admin__vacio">No hay estudiantes registrados aún.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
