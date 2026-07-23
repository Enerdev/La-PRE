import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Wallet,
  CheckCircle2,
  QrCode,
  Users,
  Trophy,
  Building2,
  ShieldCheck,
  Gauge,
  Rocket,
  FileDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../api/client';
import { SkeletonTarjetas } from '../components/Skeletons';
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
  const { mostrarToast } = useToast();

  useEffect(() => {
    api.reportePorSede(sedeId).then(setReporte).catch((err) => setError(err.message));
  }, [sedeId]);

  async function exportar(formato) {
    setExportando(formato);
    try {
      if (formato === 'pdf') await api.exportarReporteSedePdf(sedeId);
      else await api.exportarReporteSedeExcel(sedeId);
      mostrarToast({ tipo: 'exito', texto: `Reporte ${formato.toUpperCase()} descargado.` });
    } catch (err) {
      mostrarToast({ tipo: 'error', texto: err.message });
    } finally {
      setExportando(null);
    }
  }

  if (error) return <p className="panel__estado">No se pudo cargar el reporte: {error}</p>;
  if (!reporte) return <SkeletonTarjetas cantidad={3} />;

  return (
    <>
      <div className="tarjetas">
        <div className="tarjeta">
          <div className="tarjeta__encabezado">
            <span className="tarjeta__icono"><GraduationCap size={17} /></span>
            <span className="tarjeta__etiqueta">Estudiantes activos</span>
          </div>
          <div className="tarjeta__valor">{reporte.estudiantes.total_estudiantes}</div>
        </div>
        <div className="tarjeta">
          <div className="tarjeta__encabezado">
            <span className="tarjeta__icono"><Wallet size={17} /></span>
            <span className="tarjeta__etiqueta">Total recaudado</span>
          </div>
          <div className="tarjeta__valor">{formatearSoles(reporte.pagos.total_recaudado)}</div>
          <div className="tarjeta__subvalor">{reporte.pagos.cantidad_pagos} pagos registrados</div>
        </div>
        <div className="tarjeta">
          <div className="tarjeta__encabezado">
            <span className="tarjeta__icono"><CheckCircle2 size={17} /></span>
            <span className="tarjeta__etiqueta">Asistencias registradas</span>
          </div>
          <div className="tarjeta__valor">{reporte.asistencia.total_marcados}</div>
          <div className="tarjeta__subvalor">
            {reporte.asistencia.estudiantes_distintos} estudiantes distintos
          </div>
        </div>
      </div>

      <div className="exportar-reporte">
        <button className="boton boton--fantasma" onClick={() => exportar('pdf')} disabled={exportando}>
          <FileDown size={15} /> {exportando === 'pdf' ? 'Generando…' : 'Exportar PDF'}
        </button>
        <button className="boton boton--fantasma" onClick={() => exportar('excel')} disabled={exportando}>
          <FileDown size={15} /> {exportando === 'excel' ? 'Generando…' : 'Exportar Excel'}
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
  const { mostrarToast } = useToast();

  useEffect(() => {
    api.reporteGeneral().then(setSedes).catch((err) => setError(err.message));
  }, []);

  async function exportar(sedeId, formato) {
    setExportando(`${sedeId}-${formato}`);
    try {
      if (formato === 'pdf') await api.exportarReporteSedePdf(sedeId);
      else await api.exportarReporteSedeExcel(sedeId);
      mostrarToast({ tipo: 'exito', texto: `Reporte ${formato.toUpperCase()} descargado.` });
    } catch (err) {
      mostrarToast({ tipo: 'error', texto: err.message });
    } finally {
      setExportando(null);
    }
  }

  if (error) return <p className="panel__estado">No se pudo cargar el reporte: {error}</p>;
  if (!sedes) return <SkeletonTarjetas cantidad={3} />;

  if (sedes.length === 0) {
    return <p className="panel__estado">Todavía no hay sedes registradas.</p>;
  }

  return (
    <div className="tarjetas">
      {sedes.map((s) => (
        <div className="tarjeta" key={s.id_sede}>
          <div className="tarjeta__encabezado">
            <span className="tarjeta__icono"><Building2 size={17} /></span>
            <span className="tarjeta__etiqueta">{s.sede}</span>
          </div>
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
    <div className="panel animar-entrada">
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
          <h2><Gauge /> Indicadores{esDireccion ? ' generales' : ' de tu sede'}</h2>
          {esDireccion ? <VistaGeneral /> : <VistaSede sedeId={sesion.sede_id} />}
        </section>

        <section className="panel__seccion">
          <h2><Rocket /> Accesos rápidos</h2>
          <div className="accesos">
            <Link to="/escaner" className="acceso">
              <span className="acceso__icono"><QrCode size={19} /></span>
              <span className="acceso__texto">
                <span className="acceso__titulo">Control de Asistencia</span>
                <span className="acceso__detalle">Escanear QR de estudiantes</span>
              </span>
            </Link>

            <Link to="/estudiantes" className="acceso">
              <span className="acceso__icono"><Users size={19} /></span>
              <span className="acceso__texto">
                <span className="acceso__titulo">Estudiantes</span>
                <span className="acceso__detalle">Registrar y consultar estudiantes</span>
              </span>
            </Link>

            <Link to="/pagos" className="acceso">
              <span className="acceso__icono"><Wallet size={19} /></span>
              <span className="acceso__texto">
                <span className="acceso__titulo">Pagos</span>
                <span className="acceso__detalle">Registrar y consultar estados de cuenta</span>
              </span>
            </Link>

            <Link to="/rankings" className="acceso">
              <span className="acceso__icono"><Trophy size={19} /></span>
              <span className="acceso__texto">
                <span className="acceso__titulo">Simulacros y Rankings</span>
                <span className="acceso__detalle">Cargar resultados, cerrar y publicar</span>
              </span>
            </Link>

            <Link to="/sedes" className="acceso">
              <span className="acceso__icono"><Building2 size={19} /></span>
              <span className="acceso__texto">
                <span className="acceso__titulo">Sedes</span>
                <span className="acceso__detalle">
                  {esDireccion ? 'Ver y abrir nuevas sedes' : 'Ver sedes de la institución'}
                </span>
              </span>
            </Link>

            {esDireccion && (
              <Link to="/auditoria" className="acceso">
                <span className="acceso__icono"><ShieldCheck size={19} /></span>
                <span className="acceso__texto">
                  <span className="acceso__titulo">Auditoría</span>
                  <span className="acceso__detalle">Bitácora completa del sistema</span>
                </span>
              </Link>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
