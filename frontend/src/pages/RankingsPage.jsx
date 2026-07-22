import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import '../styles/rankings.css';

export default function RankingsPage() {
  const { sesion } = useAuth();

  const [simulacros, setSimulacros] = useState([]);
  const [seleccionado, setSeleccionado] = useState(null);
  const [ranking, setRanking] = useState(null);
  const [estudiantes, setEstudiantes] = useState([]);
  const [puntajes, setPuntajes] = useState({});
  const [mensaje, setMensaje] = useState(null);
  const [procesando, setProcesando] = useState(false);

  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevaFecha, setNuevaFecha] = useState('');

  const cargarSimulacros = useCallback(async () => {
    const lista = await api.listarSimulacros();
    setSimulacros(lista);
  }, []);

  useEffect(() => {
    cargarSimulacros();
    if (sesion.rol === 'administrador_sede') {
      api.listarEstudiantes(sesion.sede_id).then(setEstudiantes);
    }
  }, [cargarSimulacros, sesion]);

  async function crearSimulacro(e) {
    e.preventDefault();
    setMensaje(null);
    try {
      await api.crearSimulacro({ nombre: nuevoNombre, fecha: nuevaFecha, tipo: 'general' });
      setNuevoNombre('');
      setNuevaFecha('');
      cargarSimulacros();
      setMensaje({ tipo: 'exito', texto: 'Simulacro creado.' });
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message });
    }
  }

  async function abrirSimulacro(s) {
    setSeleccionado(s);
    setRanking(null);
    setPuntajes({});
    if (s.estado === 'cerrado') {
      const r = await api.rankingGeneral(s.id_simulacro);
      setRanking(r);
    }
  }

  async function guardarResultados() {
    setProcesando(true);
    setMensaje(null);
    try {
      const resultados = Object.entries(puntajes)
        .filter(([, v]) => v !== '' && v !== undefined)
        .map(([estudiante_id, puntaje]) => ({ estudiante_id: Number(estudiante_id), puntaje: Number(puntaje) }));

      if (resultados.length === 0) {
        setMensaje({ tipo: 'error', texto: 'Ingresa al menos un puntaje.' });
        return;
      }

      await api.registrarResultados(seleccionado.id_simulacro, resultados);
      setMensaje({ tipo: 'exito', texto: `${resultados.length} resultados guardados.` });
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message });
    } finally {
      setProcesando(false);
    }
  }

  async function cerrarYPublicar() {
    setProcesando(true);
    setMensaje(null);
    try {
      const r = await api.cerrarSimulacro(seleccionado.id_simulacro);
      setMensaje({
        tipo: 'exito',
        texto: `Ranking publicado (${r.resultadosActualizados} resultados en ${r.duracionMs} ms).`,
      });
      await cargarSimulacros();
      const actualizado = await api.rankingGeneral(seleccionado.id_simulacro);
      setRanking(actualizado);
      setSeleccionado((s) => ({ ...s, estado: 'cerrado' }));
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message });
    } finally {
      setProcesando(false);
    }
  }

  return (
    <div className="rankings">
      <header className="rankings__header">
        <Link to="/panel" className="rankings__volver">← Volver al panel</Link>
        <h1>Simulacros y Rankings</h1>
      </header>

      <div className="rankings__cuerpo">
        <section className="rankings__seccion">
          <h2>Nuevo simulacro</h2>
          <form className="form-simulacro" onSubmit={crearSimulacro}>
            <div className="selector-campo">
              <label>Nombre</label>
              <input
                value={nuevoNombre}
                onChange={(e) => setNuevoNombre(e.target.value)}
                placeholder="Simulacro N.º 02"
                required
              />
            </div>
            <div className="selector-campo">
              <label>Fecha</label>
              <input type="date" value={nuevaFecha} onChange={(e) => setNuevaFecha(e.target.value)} required />
            </div>
            <button className="boton boton--primario">Crear</button>
          </form>
        </section>

        <section className="rankings__seccion">
          <h2>Simulacros</h2>
          <div className="lista-simulacros">
            {simulacros.map((s) => (
              <div
                key={s.id_simulacro}
                className={`simulacro-fila ${seleccionado?.id_simulacro === s.id_simulacro ? 'simulacro-fila--activa' : ''}`}
                onClick={() => abrirSimulacro(s)}
              >
                <div>
                  <div className="simulacro-fila__nombre">{s.nombre}</div>
                  <div className="simulacro-fila__meta">
                    {new Date(s.fecha).toLocaleDateString('es-PE')}
                  </div>
                </div>
                <span className={`etiqueta-estado etiqueta-estado--${s.estado}`}>{s.estado}</span>
              </div>
            ))}
            {simulacros.length === 0 && <p className="rankings__mensaje">Aún no hay simulacros.</p>}
          </div>
        </section>

        {seleccionado && (
          <section className="rankings__seccion">
            <h2>{seleccionado.nombre}</h2>
            <div className="panel-detalle">
              {seleccionado.estado !== 'cerrado' && sesion.rol === 'administrador_sede' && (
                <div className="carga-resultados">
                  <p className="rankings__mensaje">Ingresa el puntaje de tus estudiantes:</p>
                  {estudiantes.map((e) => (
                    <div className="carga-resultados__fila" key={e.id_estudiante}>
                      <label>{e.apellidos}, {e.nombres}</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={puntajes[e.id_estudiante] ?? ''}
                        onChange={(ev) =>
                          setPuntajes((p) => ({ ...p, [e.id_estudiante]: ev.target.value }))
                        }
                      />
                    </div>
                  ))}
                  <button className="boton boton--fantasma" onClick={guardarResultados} disabled={procesando}>
                    Guardar resultados
                  </button>
                </div>
              )}

              {seleccionado.estado !== 'cerrado' && (
                <button className="boton boton--primario" onClick={cerrarYPublicar} disabled={procesando}>
                  {procesando ? 'Procesando…' : 'Cerrar y publicar ranking'}
                </button>
              )}

              {ranking && (
                <table className="tabla-ranking">
                  <thead>
                    <tr>
                      <th>Puesto</th>
                      <th>Estudiante</th>
                      <th>Puntaje</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranking.map((r) => (
                      <tr key={r.id_resultado}>
                        <td>{r.puesto}</td>
                        <td>{r.apellidos}, {r.nombres}</td>
                        <td>{r.puntaje}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        )}

        {mensaje && (
          <p className={`rankings__mensaje rankings__mensaje--${mensaje.tipo}`}>{mensaje.texto}</p>
        )}
      </div>
    </div>
  );
}
