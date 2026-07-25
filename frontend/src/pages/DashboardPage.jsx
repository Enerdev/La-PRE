import { useEffect, useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import '../styles/shared.css';

export default function DashboardPage() {
  const { sesion } = useAuth();
  const [reporte, setReporte] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

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
            totalEstudiantes:
              estudiantes.total_estudiantes ?? estudiantes.totalEstudiantes ?? 0,
            asistenciaHoy:
              asistencia.total_marcados ?? asistencia.totalMarcados ?? 0,
            ingresosTotales:
              pagos.total_recaudado ?? pagos.totalRecaudado ?? 0,
            totalSedes: 1,
            porSede: [
              {
                id_sede: sedeReporte.sede_id ?? sesion.sede_id,
                nombre: sedeReporte.sede ?? sedeReporte.nombre ?? 'Mi sede',
                totalEstudiantes:
                  estudiantes.total_estudiantes ?? estudiantes.totalEstudiantes ?? 0,
                ingresosTotales:
                  pagos.total_recaudado ?? pagos.totalRecaudado ?? 0,
                totalMarcados:
                  asistencia.total_marcados ?? asistencia.totalMarcados ?? 0,
              },
            ],
          };
        } else {
          const general = await api.reporteGeneral();
          const rows = Array.isArray(general) ? general : [];
          const totalEstudiantes = rows.reduce(
            (acc, row) => acc + Number(row.total_estudiantes ?? row.totalEstudiantes ?? 0),
            0
          );
          const ingresosTotales = rows.reduce(
            (acc, row) => acc + Number(row.total_recaudado ?? row.totalRecaudado ?? 0),
            0
          );
          const asistenciaHoy = rows.reduce(
            (acc, row) => acc + Number(row.total_marcados ?? row.totalMarcados ?? 0),
            0
          );

          data = {
            totalEstudiantes,
            asistenciaHoy,
            ingresosTotales,
            totalSedes: rows.length,
            porSede: rows.map((row) => ({
              id_sede: row.id_sede,
              nombre: row.sede ?? row.nombre ?? '—',
              totalEstudiantes: row.total_estudiantes ?? row.totalEstudiantes ?? 0,
              ingresosTotales: row.total_recaudado ?? row.totalRecaudado ?? 0,
              totalMarcados: row.total_marcados ?? row.totalMarcados ?? 0,
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

  return (
    <AppLayout titulo="Dashboard" subtitulo="Resumen general de LA PRE PERÚ">
      {error && <div className="login-alerta login-alerta--error">⚠️ {error}</div>}

      <div className="grid-stats">
        <TarjetaStat
          icono="🎓"
          color="rojo"
          etiqueta="Estudiantes activos"
          valor={cargando ? null : reporte?.totalEstudiantes ?? reporte?.total_estudiantes ?? '—'}
        />
        <TarjetaStat
          icono="✅"
          color="verde"
          etiqueta="Asistencia de hoy"
          valor={cargando ? null : reporte?.asistenciaHoy ?? reporte?.asistencia_hoy ?? '—'}
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
              : reporte?.ingresos_totales != null
              ? Number(reporte.ingresos_totales).toFixed(2)
              : '—'
          }
        />
        <TarjetaStat
          icono="🏫"
          color="gris"
          etiqueta="Sedes activas"
          valor={cargando ? null : reporte?.totalSedes ?? reporte?.total_sedes ?? '—'}
        />
      </div>

      <div className="tarjeta">
        <div className="tarjeta__header">
          <h3>Desglose por sede</h3>
        </div>

        {cargando ? (
          <SkeletonTabla />
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
                    <td>{s.totalEstudiantes ?? s.total_estudiantes ?? '—'}</td>
                    <td className="tabla-datos__mono">
                      S/ {Number(s.ingresos ?? s.total_ingresos ?? 0).toFixed(2)}
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

function SkeletonTabla() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="skeleton-linea" style={{ width: '100%', height: '32px' }} />
      ))}
    </div>
  );
}
