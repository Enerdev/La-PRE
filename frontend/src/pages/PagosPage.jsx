import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import '../styles/pagos.css';

function formatearSoles(monto) {
  return `S/ ${Number(monto || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
}

export default function PagosPage() {
  const { sesion } = useAuth();
  const esDireccion = sesion.rol === 'direccion';

  const [sedes, setSedes] = useState([]);
  const [sedeId, setSedeId] = useState(esDireccion ? '' : sesion.sede_id);

  const [estudiantes, setEstudiantes] = useState([]);
  const [estudianteId, setEstudianteId] = useState('');

  const [cuenta, setCuenta] = useState(null);
  const [cargandoCuenta, setCargandoCuenta] = useState(false);

  const [monto, setMonto] = useState('');
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [mensaje, setMensaje] = useState(null);
  const [enviando, setEnviando] = useState(false);

  // Dirección elige la sede primero; administrador_sede ya tiene la suya fija.
  useEffect(() => {
    if (esDireccion) {
      api.listarSedes().then((lista) => {
        setSedes(lista);
        if (lista.length > 0) setSedeId(lista[0].id_sede);
      });
    }
  }, [esDireccion]);

  useEffect(() => {
    if (!sedeId) return;
    setEstudianteId('');
    setCuenta(null);
    api.listarEstudiantes(sedeId).then(setEstudiantes);
  }, [sedeId]);

  const cargarCuenta = useCallback(async (id) => {
    if (!id) return;
    setCargandoCuenta(true);
    try {
      const data = await api.estadoDeCuenta(id);
      setCuenta(data);
    } finally {
      setCargandoCuenta(false);
    }
  }, []);

  useEffect(() => {
    if (estudianteId) cargarCuenta(estudianteId);
  }, [estudianteId, cargarCuenta]);

  async function registrar(e) {
    e.preventDefault();
    setMensaje(null);
    setEnviando(true);
    try {
      await api.registrarPago({ estudianteId, monto: parseFloat(monto), metodoPago });
      setMensaje({ tipo: 'exito', texto: 'Pago registrado correctamente.' });
      setMonto('');
      await cargarCuenta(estudianteId);
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="pagos">
      <header className="pagos__header">
        <div>
          <Link to="/panel" className="pagos__volver">← Volver al panel</Link>
          <h1>Pagos</h1>
        </div>
      </header>

      <div className="pagos__cuerpo">
        {esDireccion && (
          <div className="selector-campo">
            <label htmlFor="sede">Sede</label>
            <select id="sede" value={sedeId} onChange={(e) => setSedeId(Number(e.target.value))}>
              {sedes.map((s) => (
                <option key={s.id_sede} value={s.id_sede}>{s.nombre}</option>
              ))}
            </select>
          </div>
        )}

        <div className="selector-campo">
          <label htmlFor="estudiante">Estudiante</label>
          <select
            id="estudiante"
            value={estudianteId}
            onChange={(e) => setEstudianteId(Number(e.target.value))}
            disabled={estudiantes.length === 0}
          >
            <option value="">Selecciona un estudiante…</option>
            {estudiantes.map((e) => (
              <option key={e.id_estudiante} value={e.id_estudiante}>
                {e.apellidos}, {e.nombres}
              </option>
            ))}
          </select>
        </div>

        {estudianteId && (
          <div className="estado-cuenta">
            {cargandoCuenta && <p>Cargando estado de cuenta…</p>}

            {cuenta && !cargandoCuenta && (
              <>
                <div className="estado-cuenta__resumen">
                  <span className="estado-cuenta__total">
                    {formatearSoles(cuenta.resumen.total_pagado)}
                  </span>
                  <span className="estado-cuenta__cantidad">
                    {cuenta.resumen.cantidad_pagos} pagos registrados
                  </span>
                </div>

                <div className="historial">
                  {cuenta.historial.length === 0 && (
                    <span className="historial__vacio">Aún no hay pagos registrados.</span>
                  )}
                  {cuenta.historial.map((p) => (
                    <div className="historial__fila" key={p.id_pago}>
                      <span>{new Date(p.fecha).toLocaleDateString('es-PE')} · {p.metodo_pago || '—'}</span>
                      <span>{formatearSoles(p.monto)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {estudianteId && (
          <form className="form-pago" onSubmit={registrar}>
            <div className="selector-campo">
              <label htmlFor="monto">Monto (S/)</label>
              <input
                id="monto"
                type="number"
                min="0.01"
                step="0.01"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                required
              />
            </div>

            <div className="selector-campo">
              <label htmlFor="metodo">Método</label>
              <select id="metodo" value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}>
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
                <option value="tarjeta">Tarjeta</option>
              </select>
            </div>

            <button className="boton boton--primario" disabled={enviando}>
              {enviando ? 'Registrando…' : 'Registrar pago'}
            </button>
          </form>
        )}

        {mensaje && (
          <p className={`pagos__mensaje pagos__mensaje--${mensaje.tipo}`}>{mensaje.texto}</p>
        )}
      </div>
    </div>
  );
}
