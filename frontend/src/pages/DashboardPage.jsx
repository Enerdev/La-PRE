import { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import AppLayout from '../components/layout/AppLayout';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { SkeletonTablaFilas } from '../components/Skeletons';
import '../styles/shared.css';

const PERIODOS = ['hoy', 'semana', 'mes'];

export default function DashboardPage() {
  const { sesion } = useAuth();
  const [reporte, setReporte] = useState(null);
  const [tendencias, setTendencias] = useState(null);
  const [periodo, setPeriodo] = useState('semana');
  const [cargando, setCargando] = useState(true);
  const [cargandoTendencias, setCargandoTendencias] = useState(true);
  const [error, setError] = useState(null);

  const asistenciaPercent = reporte?.totalEstudiantes
    ? Math.min((Number(reporte.asistenciaHoy ?? 0) / Number(reporte.totalEstudiantes)) || 0, 1)
    : 0;

  const maxIngresos = reporte?.porSede?.length
    ? Math.max(
        ...reporte.porSede.map((item) => Number(item.ingresosTotales ?? 0)),
        1
      )
    : Math.max(Number(reporte?.ingresosTotales ?? 0), 1);

  const ingresosPercent = reporte?.ingresosTotales
    ? Math.min(Number(reporte.ingresosTotales) / maxIngresos, 1)
    : 0;

  const periodoIndicador = periodo === 'hoy' ? 'Hoy' : periodo === 'semana' ? 'Últimos 7 días' : 'Último mes';

  const tendenciasPorSede = useMemo(() => {
    return (tendencias?.porSede ?? []).map((row) => ({
      id_sede: row.id_sede,
      nombre: row.nombre,
      ingresosTotales: Number(row.ingresosTotales ?? 0),
      asistencias: Number(row.asistencias ?? 0),
    }));
  }, [tendencias]);

  useEffect(() => {
    async function cargar() {
      if (!sesion) return;

      try {
        let data;

        if (sesion.rol === 'administrador_sede' && sesion.sede_id) {
          const sedeReporte = await api.reportePorSede(sesion.sede_id);
          const estudiantes = sedeReporte.estudiantes || {};
          const pagos = sedeReporte.pagos || {};
          const asistencia = sedeReporte.asistencia || {};

          data = {
            totalEstudiantes: estudiantes.totalEstudiantes ?? 0,
            asistenciaHoy: asistencia.totalMarcados ?? 0,
            ingresosTotales: pagos.ingresosTotales ?? 0,
            totalSedes: 1,
            porSede: [
              {
                id_sede: sedeReporte.sede_id ?? sesion.sede_id,
                nombre: sedeReporte.sede ?? sedeReporte.nombre ?? 'Mi sede',
                totalEstudiantes: estudiantes.totalEstudiantes ?? 0,
                ingresosTotales: pagos.ingresosTotales ?? 0,
                totalMarcados: asistencia.totalMarcados ?? 0,
              },
            ],
          };
        } else {
          const general = await api.reporteGeneral();
          const rows = Array.isArray(general) ? general : [];
          const totalEstudiantes = rows.reduce(
            (acc, row) => acc + Number(row.totalEstudiantes ?? 0),
            0
          );
          const ingresosTotales = rows.reduce(
            (acc, row) => acc + Number(row.ingresosTotales ?? 0),
            0
          );
          const asistenciaHoy = rows.reduce(
            (acc, row) => acc + Number(row.totalMarcados ?? 0),
            0
          );

          data = {
            totalEstudiantes,
            asistenciaHoy,
            ingresosTotales,
            totalSedes: rows.length,
            porSede: rows.map((row) => ({
              id_sede: row.id_sede,
              nombre: row.nombre ?? row.sede ?? '—',
              totalEstudiantes: row.totalEstudiantes ?? 0,
              ingresosTotales: row.ingresosTotales ?? 0,
              totalMarcados: row.totalMarcados ?? 0,
            })),
          };
        }

        setReporte(data);
      } catch (err) {
        setError(err.message || 'No se pudo cargar el reporte general.');
      } finally {
        setCargando(false);
      }
    }

    cargar();
  }, [sesion]);

  useEffect(() => {
    async function cargarTendencias() {
      if (!sesion) return;

      setCargandoTendencias(true);
      try {
        const data = await api.reporteTendencias(periodo);
        setTendencias(data);
      } catch (err) {
        setError(err.message || 'No se pudo cargar las tendencias.');
      } finally {
        setCargandoTendencias(false);
      }
    }

    cargarTendencias();
  }, [sesion, periodo]);

  return (
    <AppLayout titulo="Dashboard" subtitulo="Resumen general de LA PRE PERÚ">
      {error && <div className="login-alerta login-alerta--error">⚠️ {error}</div>}

      <div className="grid-stats">
        <TarjetaStat
          icono="🎓"
          color="rojo"
          etiqueta="Estudiantes activos"
          valor={cargando ? null : reporte?.totalEstudiantes ?? '—'}
        />
        <TarjetaStat
          icono="✅"
          color="verde"
          etiqueta="Asistencia de hoy"
          valor={cargando ? null : reporte?.asistenciaHoy ?? '—'}
        />
        <TarjetaStat
          icono="💳"
          color="ambar"
          etiqueta="Ingresos totales (S/)"
          valor={
            cargando
              ? null
              : reporte?.ingresosTotales != null
              ? Number(reporte.ingresosTotales).toFixed(2)
              : '—'
          }
        />
        <TarjetaStat
          icono="🏫"
          color="gris"
          etiqueta="Sedes activas"
          valor={cargando ? null : reporte?.totalSedes ?? '—'}
        />
      </div>

      <div className="filtro-periodo">
        <span className="filtro-periodo__texto">Periodo:</span>
        {PERIODOS.map((opcion) => (
          <button
            key={opcion}
            type="button"
            className={`filtro-periodo__boton ${periodo === opcion ? 'filtro-periodo__boton--activo' : ''}`}
            onClick={() => setPeriodo(opcion)}
          >
            {opcion === 'hoy' ? 'Hoy' : opcion === 'semana' ? 'Semana' : 'Mes'}
          </button>
        ))}
      </div>

      <div className="grid-charts">
        <div className="tarjeta tarjeta-grafica">
          <div className="chart-leyenda">
            <div>
              <div className="chart-leyenda__titulo">Evolución de asistencia</div>
              <div className="chart-leyenda__subtitulo">{periodo === 'hoy' ? 'Hoy' : periodo === 'semana' ? 'Últimos 7 días' : 'Último mes'}</div>
            </div>
          </div>
          <div className="chart-wrap">
            {cargandoTendencias ? (
              <SkeletonTablaFilas columnas={1} filas={5} />
            ) : tendencias?.asistenciaDiaria?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={tendencias.asistenciaDiaria} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                  <XAxis dataKey="fecha" stroke="#bbb" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#bbb" tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                  <Legend wrapperStyle={{ color: '#ccc', fontSize: 12 }} />
                  <Line type="monotone" dataKey="asistencias" stroke="#4fdc8c" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} name="Asistencias" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="estado-vacio">
                <div className="estado-vacio__icono">📈</div>
                <p>No hay datos de asistencia para este periodo.</p>
              </div>
            )}
          </div>
        </div>

        <div className="tarjeta tarjeta-grafica">
          <div className="chart-leyenda">
            <div>
              <div className="chart-leyenda__titulo">Recaudación</div>
              <div className="chart-leyenda__subtitulo">S/ {Number(tendencias?.ingresosTotales ?? 0).toFixed(2)}</div>
            </div>
          </div>
          <div className="chart-wrap">
            {cargandoTendencias ? (
              <SkeletonTablaFilas columnas={1} filas={5} />
            ) : tendencias?.recaudacion?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tendencias.recaudacion} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                  <XAxis dataKey="fecha" stroke="#bbb" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#bbb" tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} formatter={(value) => [`S/ ${Number(value).toFixed(2)}`, 'Ingresos']} />
                  <Legend wrapperStyle={{ color: '#ccc', fontSize: 12 }} />
                  <Bar dataKey="ingresos" fill="#f3c06f" radius={[6, 6, 0, 0]} name="Ingresos" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="estado-vacio">
                <div className="estado-vacio__icono">💰</div>
                <p>No hay datos de recaudación para este periodo.</p>
              </div>
            )}
          </div>
        </div>

        <div className="tarjeta tarjeta-grafica">
          <div className="chart-leyenda">
            <div>
              <div className="chart-leyenda__titulo">Comparación por sede</div>
              <div className="chart-leyenda__subtitulo">Ingresos y asistencia por sede</div>
            </div>
          </div>
          <div className="chart-wrap">
            {cargandoTendencias ? (
              <SkeletonTablaFilas columnas={1} filas={5} />
            ) : tendencias?.porSede?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tendencias.porSede} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                  <XAxis dataKey="nombre" stroke="#bbb" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#bbb" tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} formatter={(value, name) => [name === 'ingresosTotales' ? `S/ ${Number(value).toFixed(2)}` : value, name]} />
                  <Legend wrapperStyle={{ color: '#ccc', fontSize: 12 }} />
                  <Bar dataKey="ingresosTotales" fill="#f3c06f" radius={[6, 6, 0, 0]} name="Ingresos" />
                  <Bar dataKey="asistencias" fill="#4fdc8c" radius={[6, 6, 0, 0]} name="Asistencias" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="estado-vacio">
                <div className="estado-vacio__icono">🏫</div>
                <p>No hay suficiente información por sede para mostrar el gráfico.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="tarjeta">
        <div className="tarjeta__header">
          <h3>Desglose por sede</h3>
        </div>

        {cargando ? (
          <SkeletonTablaFilas columnas={3} filas={4} />
        ) : Array.isArray(reporte?.porSede) && reporte.porSede.length ? (
          <div className="tabla-wrap">
            <table className="tabla-datos">
              <thead>
                <tr>
                  <th>Sede</th>
                  <th>Estudiantes</th>
                  <th>Ingresos (S/)</th>
                </tr>
              </thead>
              <tbody>
                {reporte.porSede.map((s, i) => (
                  <tr key={s.id_sede ?? i}>
                    <td>{s.nombre}</td>
                    <td>{s.totalEstudiantes ?? '—'}</td>
                    <td className="tabla-datos__mono">
                      S/ {Number(s.ingresosTotales ?? 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="estado-vacio">
            <div className="estado-vacio__icono">📊</div>
            <p>
              El reporte general no trae desglose por sede todavía. Puedes usar{' '}
              <code>api.reportePorSede(sedeId)</code> por separado si lo necesitas.
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function TarjetaStat({ icono, color, etiqueta, valor }) {
  return (
    <div className="tarjeta-stat">
      <div className={`tarjeta-stat__icono tarjeta-stat__icono--${color}`}>{icono}</div>
      <div>
        {valor === null ? (
          <div className="skeleton-linea" style={{ width: '60px', marginBottom: '6px' }} />
        ) : (
          <div className="tarjeta-stat__valor">{valor}</div>
        )}
        <div className="tarjeta-stat__etiqueta">{etiqueta}</div>
      </div>
    </div>
  );
}

function TarjetaGrafica({ titulo, valor, detalle, porcentaje, color }) {
  return (
    <div className="tarjeta-grafica">
      <div className="tarjeta-grafica__header">
        <h3>{titulo}</h3>
        <span className="tarjeta-grafica__valor">{valor}</span>
      </div>
      <div className="grafica-barra">
        <div
          className={`grafica-barra__relleno grafica-barra__relleno--${color}`}
          style={{ width: `${Math.round(porcentaje * 100)}%` }}
        />
      </div>
      <p className="tarjeta-grafica__detalle">{detalle}</p>
    </div>
  );
}

