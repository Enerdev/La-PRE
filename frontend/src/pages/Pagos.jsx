import { useEffect, useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import { api } from '../api/client';
import { SkeletonFilas } from '../components/Skeletons';
import '../styles/shared.css';

export default function PagosPage() {
  const [pagos, setPagos] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);

  const [form, setForm] = useState({
    estudianteId: '',
    monto: '',
    concepto: 'Pensión mensual',
    metodo: 'efectivo',
  });

  useEffect(() => {
    async function cargar() {
      try {
        const [listaPagos, listaEstudiantes] = await Promise.all([
          api.listarPagos(),
          api.listarEstudiantes(),
        ]);
        setPagos(listaPagos);
        setEstudiantes(listaEstudiantes);
      } catch (err) {
        setError(err.message || 'No se pudo cargar la lista de pagos.');
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, []);

  async function registrarPago(e) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    setExito(null);
    try {
      const nuevoPago = await api.registrarPago({
        estudianteId: Number(form.estudianteId),
        monto: Number(form.monto),
        concepto: form.concepto,
        metodo: form.metodo,
      });
      setPagos((prev) => [nuevoPago, ...prev]);
      setExito('Pago registrado. Se envió el comprobante por email al estudiante.');
      setForm({ estudianteId: '', monto: '', concepto: 'Pensión mensual', metodo: 'efectivo' });
      setMostrarFormulario(false);
    } catch (err) {
      setError(err.message || 'Error al registrar el pago.');
    } finally {
      setEnviando(false);
    }
  }

  const totalMes = pagos.reduce((acc, p) => acc + Number(p.monto || 0), 0);

  return (
    <AppLayout
      titulo="Pagos"
      subtitulo={`S/ ${totalMes.toFixed(2)} registrados`}
      acciones={
        <button className="boton-primario" onClick={() => setMostrarFormulario((v) => !v)}>
          <span>➕</span> Registrar pago
        </button>
      }
    >
      {error && <div className="login-alerta login-alerta--error">⚠️ {error}</div>}
      {exito && <div className="login-alerta login-alerta--exito">✅ {exito}</div>}

      {mostrarFormulario && (
        <div className="tarjeta" style={{ marginBottom: '1.25rem' }}>
          <div className="tarjeta__header">
            <h3>Nuevo pago</h3>
          </div>
          <form onSubmit={registrarPago} className="login-form">
            <div className="login-grid-2">
              <div className="campo">
                <label>Estudiante</label>
                <select
                  value={form.estudianteId}
                  onChange={(e) => setForm({ ...form, estudianteId: e.target.value })}
                  required
                >
                  <option value="">Selecciona un estudiante</option>
                  {estudiantes.map((est) => (
                    <option key={est.id_estudiante} value={est.id_estudiante}>
                      {est.nombres} {est.apellidos} — {est.dni}
                    </option>
                  ))}
                </select>
              </div>
              <div className="campo">
                <label>Monto (S/)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.monto}
                  onChange={(e) => setForm({ ...form, monto: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="login-grid-2">
              <div className="campo">
                <label>Concepto</label>
                <input
                  type="text"
                  value={form.concepto}
                  onChange={(e) => setForm({ ...form, concepto: e.target.value })}
                  required
                />
              </div>
              <div className="campo">
                <label>Método de pago</label>
                <select
                  value={form.metodo}
                  onChange={(e) => setForm({ ...form, metodo: e.target.value })}
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="yape_plin">Yape / Plin</option>
                </select>
              </div>
            </div>
            <button type="submit" className="boton-primario" disabled={enviando} style={{ alignSelf: 'flex-start' }}>
              {enviando ? 'Registrando...' : 'Confirmar pago'}
            </button>
          </form>
        </div>
      )}

      <div className="tarjeta">
        <div className="tarjeta__header">
          <h3>Historial de pagos</h3>
        </div>

        {cargando ? (
          <SkeletonFilas cantidad={5} />
        ) : pagos.length ? (
          <div className="tabla-wrap">
            <table className="tabla-datos">
              <thead>
                <tr>
                  <th>Estudiante</th>
                  <th>Concepto</th>
                  <th>Método</th>
                  <th>Fecha</th>
                  <th>Monto</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {pagos.map((p) => (
                  <tr key={p.id_pago}>
                    <td>{p.estudiante_nombre || `#${p.estudiante_id}`}</td>
                    <td>{p.concepto}</td>
                    <td style={{ textTransform: 'capitalize' }}>{(p.metodo || '').replace('_', ' / ')}</td>
                    <td className="tabla-datos__mono">{p.fecha_pago}</td>
                    <td className="tabla-datos__mono">S/ {Number(p.monto).toFixed(2)}</td>
                    <td>
                      <span
                        className={`badge-estado ${
                          p.estado === 'confirmado' ? 'badge-estado--verde' : 'badge-estado--ambar'
                        }`}
                      >
                        {p.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="estado-vacio">
            <div className="estado-vacio__icono">💳</div>
            <p>Todavía no hay pagos registrados.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function SkeletonFilas() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="skeleton-linea" style={{ width: '100%', height: '38px' }} />
      ))}
    </div>
  );
}
