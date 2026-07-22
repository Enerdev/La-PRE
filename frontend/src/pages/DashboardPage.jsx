import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import '../styles/panel.css';

function formatearSoles(monto) {
  const numero = Number(monto || 0);
  return `S/ ${numero.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
}

// Vista para administrador_sede: los indicadores de UNA sede (la propia).
function VistaSede({ sedeId }) {
  const [reporte, setReporte] = useState(null);
  const [error, setError] = useState(null);
  const [exportando, setExportando] = useState(null);

  useEffect(() => {
    api.reportePorSede(sedeId).then(setReporte).catch((err) => setError(err.message));
  }, [sedeId]);

  async function exportar(formato) {
    setExportando(formato);
    try {
      if (formato === 'pdf') await api.exportarReporteSedePdf(sedeId);
      else await api.exportarReporteSedeExcel(sedeId);
    } catch (err) {
      setError(err.message);
    } finally {
      setExportando(null);
    }
  }

  if (error) return <p className="panel__estado">No se pudo cargar el reporte: {error}</p>;
  if (!reporte) return <p className="panel__estado">Cargando indicadores…</p>;

  return (
    <>
      <div className="tarjetas">
        <div className="tarjeta">
          <span className="tarjeta__etiqueta">Estudiantes activos</span>
          <div className="tarjeta__valor">{reporte.estudiantes.total_estudiantes}</div>
        </div>
        <div className="tarjeta">
          <span className="tarjeta__etiqueta">Total recaudado</span>
          <div className="tarjeta__valor">{formatearSoles(reporte.pagos.total_recaudado)}</div>
          <div className="tarjeta__subvalor">{reporte.pagos.cantidad_pagos} pagos registrados</div>
        </div>
        <div className="tarjeta">
          <span className="tarjeta__etiqueta">Asistencias registradas</span>
          <div className="tarjeta__valor">{reporte.asistencia.total_marcados}</div>
          <div className="tarjeta__subvalor">
            {reporte.asistencia.estudiantes_distintos} estudiantes distintos
          </div>
        </div>
      </div>

      <div className="exportar-reporte">
        <button className="boton boton--fantasma" onClick={() => exportar('pdf')} disabled={exportando}>
          {exportando === 'pdf' ? 'Generando…' : 'Exportar PDF'}
        </button>
        <button className="boton boton--fantasma" onClick={() => exportar('excel')} disabled={exportando}>
          {exportando === 'excel' ? 'Generando…' : 'Exportar Excel'}
        </button>
      </div>
    </>
  );
}

// Vista para dirección: un consolidado por cada sede activa.
function VistaGeneral() {
  const [sedes, setSedes] = useState(null);
  const [error, setError] = useState(null);
  const [exportando, setExportando] = useState(null);

  useEffect(() => {
    api.reporteGeneral().then(setSedes).catch((err) => setError(err.message));
  }, []);

  async function exportar(sedeId, formato) {
    setExportando(`${sedeId}-${formato}`);
    try {
      if (formato === 'pdf') await api.exportarReporteSedePdf(sedeId);
      else await api.exportarReporteSedeExcel(sedeId);
    } catch (err) {
      setError(err.message);
    } finally {
      setExportando(null);
    }
  }

  if (error) return <p className="panel__estado">No se pudo cargar el reporte: {error}</p>;
  if (!sedes) return <p className="panel__estado">Cargando indicadores…</p>;

  if (sedes.length === 0) {
    return <p className="panel__estado">Todavía no hay sedes registradas.</p>;
  }

  return (
    <div className="tarjetas">
      {sedes.map((s) => (
        <div className="tarjeta" key={s.id_sede}>
          <span className="tarjeta__etiqueta">{s.sede}</span>
          <div className="tarjeta__valor">{s.total_estudiantes}</div>
          <div className="tarjeta__subvalor">
            {formatearSoles(s.total_recaudado)} · {s.total_marcados} asistencias
          </div>
          <div className="exportar-reporte exportar-reporte--tarjeta">
            <button
              className="boton boton--fantasma"
              onClick={() => exportar(s.id_sede, 'pdf')}
              disabled={exportando}
            >
              {exportando === `${s.id_sede}-pdf` ? '…' : 'PDF'}
            </button>
            <button
              className="boton boton--fantasma"
              onClick={() => exportar(s.id_sede, 'excel')}
              disabled={exportando}
            >
              {exportando === `${s.id_sede}-excel` ? '…' : 'Excel'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { sesion, cerrarSesion } = useAuth();
  const navigate = useNavigate();

  function salir() {
    cerrarSesion();
    navigate('/login');
  }

  const esDireccion = sesion.rol === 'direccion';

  return (
    <div className="panel">
      <header className="panel__header">
        <div className="panel__header-titulo">
          <span className="eyebrow">
            {esDireccion ? 'Dirección · Todas las sedes' : `Administrador · Sede #${sesion.sede_id}`}
          </span>
          <h1>Panel de gestión</h1>
        </div>
        <button className="boton boton--fantasma" onClick={salir}>
          Salir
        </button>
      </header>

      <div className="panel__cuerpo">
        <section className="panel__seccion">
          <h2>Indicadores{esDireccion ? ' generales' : ' de tu sede'}</h2>
          {esDireccion ? <VistaGeneral /> : <VistaSede sedeId={sesion.sede_id} />}
        </section>

        <section className="panel__seccion">
          <h2>Accesos rápidos</h2>
          <div className="accesos">
            <Link to="/escaner" className="acceso">
              <span className="acceso__titulo">Control de Asistencia</span>
              <span className="acceso__detalle">Escanear QR de estudiantes</span>
            </Link>

            <Link to="/estudiantes" className="acceso">
              <span className="acceso__titulo">Estudiantes</span>
              <span className="acceso__detalle">Registrar y consultar estudiantes</span>
            </Link>

            <Link to="/pagos" className="acceso">
              <span className="acceso__titulo">Pagos</span>
              <span className="acceso__detalle">Registrar y consultar estados de cuenta</span>
            </Link>

            <Link to="/rankings" className="acceso">
              <span className="acceso__titulo">Simulacros y Rankings</span>
              <span className="acceso__detalle">Cargar resultados, cerrar y publicar</span>
            </Link>

            <Link to="/sedes" className="acceso">
              <span className="acceso__titulo">Sedes</span>
              <span className="acceso__detalle">
                {esDireccion ? 'Ver y abrir nuevas sedes' : 'Ver sedes de la institución'}
              </span>
            </Link>

            {esDireccion && (
              <Link to="/auditoria" className="acceso">
                <span className="acceso__titulo">Auditoría</span>
                <span className="acceso__detalle">Bitácora completa del sistema</span>
              </Link>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
