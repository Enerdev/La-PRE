import { useEffect, useMemo, useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import { api } from '../api/client';
import { SkeletonFilas } from '../components/Skeletons';
import '../styles/shared.css';

export default function EstudiantesPage() {
  const [sedes, setSedes] = useState([]);
  const [sedeActual, setSedeActual] = useState(null);
  const [estudiantes, setEstudiantes] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargandoSedes, setCargandoSedes] = useState(true);
  const [cargandoEstudiantes, setCargandoEstudiantes] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);

  const [form, setForm] = useState({ nombres: '', apellidos: '', dni: '', email: '' });
  const [enviando, setEnviando] = useState(false);

  // 1. Cargar sedes al montar, y seleccionar la primera por defecto
  useEffect(() => {
    async function cargarSedes() {
      try {
        const lista = await api.listarSedes();
        setSedes(lista);
        if (lista.length > 0) setSedeActual(lista[0].id_sede);
      } catch (err) {
        setError(err.message || 'No se pudo cargar la lista de sedes.');
      } finally {
        setCargandoSedes(false);
      }
    }
    cargarSedes();
  }, []);

  // 2. Cada vez que cambia la sede seleccionada, recargar sus estudiantes
  useEffect(() => {
    if (sedeActual == null) return;
    async function cargarEstudiantes() {
      setCargandoEstudiantes(true);
      setError(null);
      try {
        const lista = await api.listarEstudiantes(sedeActual);
        setEstudiantes(lista);
      } catch (err) {
        setError(err.message || 'No se pudo cargar la lista de estudiantes.');
      } finally {
        setCargandoEstudiantes(false);
      }
    }
    cargarEstudiantes();
  }, [sedeActual]);

  const estudiantesFiltrados = useMemo(() => {
    const texto = busqueda.toLowerCase();
    return estudiantes.filter((est) =>
      `${est.nombres} ${est.apellidos} ${est.dni}`.toLowerCase().includes(texto)
    );
  }, [estudiantes, busqueda]);

  async function crearEstudiante(e) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    setExito(null);
    try {
      const nuevo = await api.crearEstudiante({
        nombres: form.nombres,
        apellidos: form.apellidos,
        dni: form.dni,
        email: form.email || undefined,
        sedeId: sedeActual,
      });
      setEstudiantes((prev) => [nuevo, ...prev]);
      setExito('Estudiante registrado correctamente.');
      setForm({ nombres: '', apellidos: '', dni: '', email: '' });
      setMostrarFormulario(false);
    } catch (err) {
      setError(err.message || 'Error al crear el estudiante.');
    } finally {
      setEnviando(false);
    }
  }

  async function inactivar(estudianteId) {
    if (!confirm('¿Inactivar a este estudiante? No se elimina, solo pasa a estado inactivo.')) return;
    try {
      await api.inactivarEstudiante(estudianteId);
      setEstudiantes((prev) =>
        prev.map((e) => (e.id_estudiante === estudianteId ? { ...e, estado: 'inactivo' } : e))
      );
    } catch (err) {
      setError(err.message || 'No se pudo inactivar al estudiante.');
    }
  }

  return (
    <AppLayout
      titulo="Estudiantes"
      subtitulo={`${estudiantes.length} estudiantes en ${
        sedes.find((s) => s.id_sede === sedeActual)?.nombre || 'la sede seleccionada'
      }`}
      acciones={
        <button className="boton-primario" onClick={() => setMostrarFormulario((v) => !v)}>
          <span>➕</span> Nuevo estudiante
        </button>
      }
    >
      {error && <div className="login-alerta login-alerta--error">⚠️ {error}</div>}
      {exito && <div className="login-alerta login-alerta--exito">✅ {exito}</div>}

      {mostrarFormulario && (
        <div className="tarjeta" style={{ marginBottom: '1.25rem' }}>
          <div className="tarjeta__header">
            <h3>Nuevo estudiante</h3>
          </div>
          <form onSubmit={crearEstudiante} className="login-form">
            <div className="login-grid-2">
              <div className="campo">
                <label>Nombres</label>
                <input
                  type="text"
                  value={form.nombres}
                  onChange={(e) => setForm({ ...form, nombres: e.target.value })}
                  required
                />
              </div>
              <div className="campo">
                <label>Apellidos</label>
                <input
                  type="text"
                  value={form.apellidos}
                  onChange={(e) => setForm({ ...form, apellidos: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="login-grid-2">
              <div className="campo">
                <label>DNI</label>
                <input
                  type="text"
                  maxLength={15}
                  value={form.dni}
                  onChange={(e) => setForm({ ...form, dni: e.target.value })}
                  required
                />
              </div>
              <div className="campo">
                <label>Email (opcional)</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>
            <button type="submit" className="boton-primario" disabled={enviando} style={{ alignSelf: 'flex-start' }}>
              {enviando ? 'Guardando...' : 'Registrar estudiante'}
            </button>
          </form>
        </div>
      )}

      <div className="tarjeta">
        <div className="barra-filtros">
          <div className="campo-busqueda">
            <span className="campo-busqueda__icono">🔎</span>
            <input
              type="text"
              placeholder="Buscar por nombre, apellido o DNI..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <select
            value={sedeActual ?? ''}
            onChange={(e) => setSedeActual(Number(e.target.value))}
            disabled={cargandoSedes}
          >
            {sedes.map((s) => (
              <option key={s.id_sede} value={s.id_sede}>
                {s.nombre}
              </option>
            ))}
          </select>
        </div>

        {cargandoEstudiantes ? (
          <SkeletonFilas cantidad={5} />
        ) : estudiantesFiltrados.length ? (
          <div className="tabla-wrap">
            <table className="tabla-datos">
              <thead>
                <tr>
                  <th>Estudiante</th>
                  <th>DNI</th>
                  <th>Email</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {estudiantesFiltrados.map((est) => (
                  <tr key={est.id_estudiante}>
                    <td>
                      <strong style={{ color: '#fff' }}>
                        {est.nombres} {est.apellidos}
                      </strong>
                    </td>
                    <td className="tabla-datos__mono">{est.dni}</td>
                    <td>{est.email || '—'}</td>
                    <td>
                      <span
                        className={`badge-estado ${
                          est.estado === 'activo' ? 'badge-estado--verde' : 'badge-estado--gris'
                        }`}
                      >
                        {est.estado}
                      </span>
                    </td>
                    <td>
                      {est.estado === 'activo' && (
                        <button
                          className="boton-icono"
                          title="Inactivar estudiante"
                          onClick={() => inactivar(est.id_estudiante)}
                        >
                          🗑️
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="estado-vacio">
            <div className="estado-vacio__icono">🎓</div>
            <p>No hay estudiantes en esta sede con esos filtros.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

