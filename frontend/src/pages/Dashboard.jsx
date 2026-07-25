import { useEffect, useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import { api } from '../api/client';
import '../styles/shared.css';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function cargar() {
      try {
        // Ajusta el nombre del método al que ya tengas en api/client.js
        // (ej. api.obtenerDashboard(), api.dashboardResumen(), etc.)
        const data = await api.obtenerDashboard();
        setStats(data);
      } catch (err) {
        setError(err.message || 'No se pudo cargar el dashboard.');
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, []);

  return (
    <AppLayout
      titulo="Dashboard"
      subtitulo="Resumen general de LA PRE PERÚ en tiempo real"
    >
      {error && <div className="login-alerta login-alerta--error">⚠️ {error}</div>}

      <div className="grid-stats">
        <TarjetaStat
          icono="🎓"
          color="rojo"
          etiqueta="Estudiantes activos"
          valor={cargando ? null : stats?.totalEstudiantes ?? 0}
        />
        <TarjetaStat
          icono="✅"
          color="verde"
          etiqueta="Asistencia de hoy"
          valor={cargando ? null : stats?.asistenciaHoy ?? 0}
        />
        <TarjetaStat
          icono="💳"
          color="ambar"
          etiqueta="Ingresos del mes (S/)"
          valor={cargando ? null : (stats?.ingresosMes ?? 0).toFixed(2)}
        />
        <TarjetaStat
          icono="🏫"
          color="gris"
          etiqueta="Sedes activas"
          valor={cargando ? null : stats?.totalSedes ?? 0}
        />
      </div>

      <div className="tarjeta">
        <div className="tarjeta__header">
          <h3>Últimos simulacros publicados</h3>
        </div>

        {cargando ? (
          <SkeletonTabla filas={4} />
        ) : stats?.ultimosSimulacros?.length ? (
          <div className="tabla-wrap">
            <table className="tabla-datos">
              <thead>
                <tr>
                  <th>Simulacro</th>
                  <th>Fecha</th>
                  <th>Área</th>
                  <th>Estado</th>
                  <th>Participantes</th>
                </tr>
              </thead>
              <tbody>
                {stats.ultimosSimulacros.map((s) => (
                  <tr key={s.id_simulacro}>
                    <td>{s.nombre}</td>
                    <td className="tabla-datos__mono">{s.fecha}</td>
                    <td>{s.area}</td>
                    <td>
                      <span
                        className={`badge-estado ${
                          s.estado === 'publicado' ? 'badge-estado--verde' : 'badge-estado--ambar'
                        }`}
                      >
                        {s.estado}
                      </span>
                    </td>
                    <td>{s.participantes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="estado-vacio">
            <div className="estado-vacio__icono">📭</div>
            <p>Aún no hay simulacros publicados.</p>
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

function SkeletonTabla({ filas = 3 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {Array.from({ length: filas }).map((_, i) => (
        <div key={i} className="skeleton-linea" style={{ width: '100%', height: '32px' }} />
      ))}
    </div>
  );
}
