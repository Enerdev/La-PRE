import { useEffect, useMemo, useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import { api } from '../api/client';
import { SkeletonFilas } from '../components/Skeletons';
import '../styles/shared.css';

const ICONO_MODULO = {
  asistencia: '📷',
  pago: '💳',
  estudiante: '🎓',
  usuario: '🔑',
  sede: '🏫',
};

export default function AuditoriaPage() {
  const [registros, setRegistros] = useState([]);
  const [filtroModulo, setFiltroModulo] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function cargar() {
      setCargando(true);
      setError(null);
      try {
        // api.listarAuditoria({ modulo, limite }) -> filtro de módulo va al servidor
        const data = await api.listarAuditoria({ modulo: filtroModulo || undefined, limite: 200 });
        setRegistros(data);
      } catch (err) {
        setError(err.message || 'No se pudo cargar la bitácora de auditoría.');
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, [filtroModulo]);

  const registrosFiltrados = useMemo(() => {
    const texto = busqueda.toLowerCase();
    return registros.filter((r) =>
      `${r.usuario_username || ''} ${r.accion || ''}`.toLowerCase().includes(texto)
    );
  }, [registros, busqueda]);

  return (
    <AppLayout
      titulo="Auditoría"
      subtitulo="Registro trazable de toda acción crítica del sistema (asistencia, pagos, cambios administrativos)"
    >
      {error && <div className="login-alerta login-alerta--error">⚠️ {error}</div>}

      <div className="tarjeta">
        <div className="barra-filtros">
          <div className="campo-busqueda">
            <span className="campo-busqueda__icono">🔎</span>
            <input
              type="text"
              placeholder="Buscar por usuario o acción..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <select value={filtroModulo} onChange={(e) => setFiltroModulo(e.target.value)}>
            <option value="">Todos los módulos</option>
            <option value="asistencia">Asistencia</option>
            <option value="pago">Pagos</option>
            <option value="estudiante">Estudiantes</option>
            <option value="usuario">Usuarios</option>
            <option value="sede">Sedes</option>
          </select>
        </div>

        {cargando ? (
          <SkeletonFilas cantidad={6} />
        ) : registrosFiltrados.length ? (
          <div className="tabla-wrap">
            <table className="tabla-datos">
              <thead>
                <tr>
                  <th>Fecha y hora</th>
                  <th>Usuario</th>
                  <th>Módulo</th>
                  <th>Acción</th>
                  <th>Resultado</th>
                </tr>
              </thead>
              <tbody>
                {registrosFiltrados.map((r) => (
                  <tr key={r.id_auditoria}>
                    <td className="tabla-datos__mono">{r.fecha_hora}</td>
                    <td>{r.usuario_username || `#${r.usuario_id}`}</td>
                    <td>
                      {ICONO_MODULO[r.modulo] || '📄'} {r.modulo}
                    </td>
                    <td>{r.accion}</td>
                    <td>
                      <span
                        className={`badge-estado ${
                          r.resultado === 'exito' ? 'badge-estado--verde' : 'badge-estado--rojo'
                        }`}
                      >
                        {r.resultado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="estado-vacio">
            <div className="estado-vacio__icono">🛡️</div>
            <p>No hay registros de auditoría con esos filtros.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

