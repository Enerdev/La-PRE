import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import '../styles/admin.css';

const MODULOS = ['', 'asistencia', 'pagos', 'academico', 'seguridad', 'administracion'];

export default function AuditoriaPage() {
  const [registros, setRegistros] = useState(null);
  const [modulo, setModulo] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    api.listarAuditoria({ modulo: modulo || undefined, limite: 200 })
      .then(setRegistros)
      .catch((err) => setError(err.message));
  }, [modulo]);

  return (
    <div className="admin">
      <header className="admin__header">
        <Link to="/panel" className="admin__volver">← Volver al panel</Link>
        <h1>Bitácora de Auditoría</h1>
      </header>

      <div className="admin__cuerpo">
        <div className="selector-campo" style={{ maxWidth: '260px' }}>
          <label>Filtrar por módulo</label>
          <select value={modulo} onChange={(e) => setModulo(e.target.value)}>
            {MODULOS.map((m) => (
              <option key={m} value={m}>{m === '' ? 'Todos' : m}</option>
            ))}
          </select>
        </div>

        {error && <p className="admin__mensaje admin__mensaje--error">{error}</p>}

        {registros && (
          <div className="tabla-bitacora__scroll">
            <table className="tabla-bitacora">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Usuario</th>
                  <th>Módulo</th>
                  <th>Acción</th>
                  <th>Detalle</th>
                </tr>
              </thead>
              <tbody>
                {registros.map((r) => (
                  <tr key={r.id_auditoria}>
                    <td>{new Date(r.fecha).toLocaleString('es-PE')}</td>
                    <td>{r.username || '—'}</td>
                    <td><span className="etiqueta-modulo">{r.modulo}</span></td>
                    <td>{r.accion}</td>
                    <td>{r.detalle}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {registros.length === 0 && <p className="admin__vacio">Sin registros para este filtro.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
