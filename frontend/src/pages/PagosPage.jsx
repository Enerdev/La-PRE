import { useEffect, useMemo, useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import { api } from '../api/client';
import { SkeletonFilas } from '../components/Skeletons';
import '../styles/shared.css';

export default function PagosPage() {
  const [sedes, setSedes] = useState([]);
  const [sedeActual, setSedeActual] = useState(null);
  const [estudiantes, setEstudiantes] = useState([]);
  const [estudianteId, setEstudianteId] = useState('');
  const [busquedaEstudiante, setBusquedaEstudiante] = useState('');

  const [cuenta, setCuenta] = useState(null); // lo que devuelva api.estadoDeCuenta
  const [cargandoCuenta, setCargandoCuenta] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);

  const [monto, setMonto] = useState('');
  const [metodoPago, setMetodoPago] = useState('efectivo');

  // Cargar sedes y, con la primera, su lista de estudiantes
  useEffect(() => {
    async function init() {
      try {
        const listaSedes = await api.listarSedes();
        setSedes(listaSedes);
        if (listaSedes.length > 0) setSedeActual(listaSedes[0].id_sede);
      } catch (err) {
        setError(err.message || 'No se pudo cargar la lista de sedes.');
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (sedeActual == null) return;
    async function cargarEstudiantes() {
      try {
        const lista = await api.listarEstudiantes(sedeActual);
        setEstudiantes(lista);
        setEstudianteId('');
        setCuenta(null);
      } catch (err) {
        setError(err.message || 'No se pudo cargar los estudiantes de esta sede.');
      }
    }
    cargarEstudiantes();
  }, [sedeActual]);

  async function cargarCuenta(id) {
    setCargandoCuenta(true);
    setError(null);
    try {
      const data = await api.estadoDeCuenta(id);
      setCuenta(data);
    } catch (err) {
      setError(err.message || 'No se pudo cargar el estado de cuenta.');
    } finally {
      setCargandoCuenta(false);
    }
  }

  function seleccionarEstudiante(id) {
    setEstudianteId(id);
    setExito(null);
    if (id) cargarCuenta(id);
    else setCuenta(null);
  }

  async function registrarPago(e) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    setExito(null);
    try {
      await api.registrarPago({
        estudianteId: Number(estudianteId),
        monto: parseFloat(monto),
        metodoPago,
      });
      setExito('Pago registrado. Se envió el comprobante por email al estudiante.');
      setMonto('');
      await cargarCuenta(estudianteId);
    } catch (err) {
      setError(err.message || 'Error al registrar el pago.');
    } finally {
      setEnviando(false);
    }
  }

  const estudiantesFiltrados = useMemo(() => {
    const texto = busquedaEstudiante.trim().toLowerCase();
    if (!texto) return estudiantes;
    return estudiantes.filter((est) =>
      `${est.nombres} ${est.apellidos} ${est.dni}`.toLowerCase().includes(texto)
    );
  }, [estudiantes, busquedaEstudiante]);

  const estudianteSeleccionado = estudiantes.find(
    (e) => e.id_estudiante === Number(estudianteId)
  );

  return (
    <AppLayout titulo="Pagos" subtitulo="Consulta el estado de cuenta y registra pagos por estudiante">
      {error && <div className="login-alerta login-alerta--error">⚠️ {error}</div>}
      {exito && <div className="login-alerta login-alerta--exito">✅ {exito}</div>}

      <div className="tarjeta" style={{ marginBottom: '1.25rem' }}>
        <div className="barra-filtros">
          <select value={sedeActual ?? ''} onChange={(e) => setSedeActual(Number(e.target.value))}>
            {sedes.map((s) => (
              <option key={s.id_sede} value={s.id_sede}>
                {s.nombre}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Buscar estudiante..."
            value={busquedaEstudiante}
            onChange={(e) => setBusquedaEstudiante(e.target.value)}
            style={{ flex: 1, minWidth: '180px' }}
          />
          <select
            value={estudianteId}
            onChange={(e) => seleccionarEstudiante(e.target.value)}
            style={{ flex: 1 }}
          >
            <option value="">Selecciona un estudiante...</option>
            {estudiantesFiltrados.map((est) => (
              <option key={est.id_estudiante} value={est.id_estudiante}>
                {est.nombres} {est.apellidos} — {est.dni}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!estudianteId ? (
        <div className="tarjeta">
          <div className="estado-vacio">
            <div className="estado-vacio__icono">💳</div>
            <p>Selecciona un estudiante para ver su estado de cuenta.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="tarjeta" style={{ marginBottom: '1.25rem' }}>
            <div className="tarjeta__header">
              <h3>
                Registrar pago — {estudianteSeleccionado?.nombres} {estudianteSeleccionado?.apellidos}
              </h3>
            </div>
            <form onSubmit={registrarPago} className="login-form">
              <div className="login-grid-2">
                <div className="campo">
                  <label>Monto (S/)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    required
                  />
                </div>
                <div className="campo">
                  <label>Método de pago</label>
                  <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}>
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="yape_plin">Yape / Plin</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="boton-primario"
                disabled={enviando}
                style={{ alignSelf: 'flex-start' }}
              >
                {enviando ? 'Registrando...' : 'Confirmar pago'}
              </button>
            </form>
          </div>

          <div className="tarjeta">
            <div className="tarjeta__header">
              <h3>Historial de pagos</h3>
            </div>

            {cargandoCuenta ? (
              <SkeletonFilas cantidad={4} />
            ) : Array.isArray(cuenta?.pagos) && cuenta.pagos.length ? (
              <div className="tabla-wrap">
                <table className="tabla-datos">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Concepto / Método</th>
                      <th>Monto</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cuenta.pagos.map((p) => (
                      <tr key={p.id_pago}>
                        <td className="tabla-datos__mono">{p.fecha_pago}</td>
                        <td style={{ textTransform: 'capitalize' }}>
                          {(p.metodo_pago || p.metodo || '').replace('_', ' / ')}
                        </td>
                        <td className="tabla-datos__mono">S/ {Number(p.monto).toFixed(2)}</td>
                        <td>
                          <span className="badge-estado badge-estado--verde">
                            {p.estado || 'confirmado'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="estado-vacio">
                <div className="estado-vacio__icono">📭</div>
                <p>Este estudiante todavía no tiene pagos registrados.</p>
              </div>
            )}
          </div>
        </>
      )}
    </AppLayout>
  );
}

