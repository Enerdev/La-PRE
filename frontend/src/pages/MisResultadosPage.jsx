import { useEffect, useState } from 'react';
import { Trophy, Medal, ClipboardX, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import NavEstudiante from '../components/NavEstudiante';
import '../styles/misResultados.css';

export default function MisResultadosPage() {
  const { sesion } = useAuth();
  const [simulacros, setSimulacros] = useState([]);
  const [seleccionado, setSeleccionado] = useState(null);
  const [ranking, setRanking] = useState(null);
  const [propio, setPropio] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.listarSimulacros().then(setSimulacros).catch((err) => setError(err.message));
  }, []);

  async function abrir(s) {
    setSeleccionado(s);
    setRanking(null);
    setPropio(null);
    if (s.estado !== 'cerrado') return;

    const r = await api.rankingGeneral(s.id_simulacro);
    setRanking(r);
    setPropio(r.find((fila) => fila.id_estudiante === sesion.estudiante_id) || null);
  }

  return (
    <>
      <NavEstudiante />
      <div className="mis-resultados animar-entrada">
        <div className="mis-resultados__cuerpo">
          <h1 className="mis-resultados__titulo"><Trophy size={20} /> Mis Resultados</h1>

          {error && (
            <p className="mr-vacio" style={{ color: 'var(--rojo-pre)' }}>
              <AlertCircle size={16} /> {error}
            </p>
          )}

          <div className="mr-lista">
            {simulacros.map((s) => (
              <div
                key={s.id_simulacro}
                className={`mr-fila ${seleccionado?.id_simulacro === s.id_simulacro ? 'mr-fila--activa' : ''}`}
                onClick={() => abrir(s)}
              >
                <div>
                  <div className="mr-fila__nombre">{s.nombre}</div>
                  <div className="mr-fila__meta">{new Date(s.fecha).toLocaleDateString('es-PE')}</div>
                </div>
                <span className={`etiqueta-estado etiqueta-estado--${s.estado}`}>{s.estado}</span>
              </div>
            ))}
            {simulacros.length === 0 && (
              <p className="mr-vacio"><ClipboardX size={16} /> Aún no hay simulacros registrados.</p>
            )}
          </div>

          {seleccionado && seleccionado.estado !== 'cerrado' && (
            <p className="mr-vacio">El ranking de este simulacro todavía no se ha publicado.</p>
          )}

          {ranking && (
            <div className="mr-resumen">
              {propio ? (
                <>
                  <div className="mr-resumen__puesto">
                    {propio.puesto <= 3 && <Medal size={26} className={`medalla medalla--${propio.puesto}`} />}
                    Puesto {propio.puesto}
                  </div>
                  <div className="mr-resumen__detalle">Puntaje: {propio.puntaje}</div>
                </>
              ) : (
                <p>Todavía no tienes un resultado registrado en este simulacro.</p>
              )}

              <div className="mr-tabla-scroll">
              <table className="mr-tabla">
                <thead>
                  <tr>
                    <th>Puesto</th>
                    <th>Estudiante</th>
                    <th>Puntaje</th>
                  </tr>
                </thead>
                <tbody>
                  {ranking.map((r) => (
                    <tr
                      key={r.id_resultado}
                      className={[
                        r.id_estudiante === sesion.estudiante_id ? 'mr-tabla__propia' : '',
                        r.puesto <= 3 ? `mr-podio--${r.puesto}` : '',
                      ].join(' ')}
                    >
                      <td>
                        <span className="puesto-celda">
                          {r.puesto <= 3 && <Medal size={14} className={`medalla medalla--${r.puesto}`} />}
                          {r.puesto}
                        </span>
                      </td>
                      <td>{r.apellidos}, {r.nombres}</td>
                      <td>{r.puntaje}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
