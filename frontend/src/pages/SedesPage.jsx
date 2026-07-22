import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import '../styles/admin.css';

export default function SedesPage() {
  const { sesion } = useAuth();
  const [sedes, setSedes] = useState([]);
  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [capacidad, setCapacidad] = useState('');
  const [mensaje, setMensaje] = useState(null);
  const [enviando, setEnviando] = useState(false);

  function cargar() {
    api.listarSedes().then(setSedes);
  }

  useEffect(cargar, []);

  async function crear(e) {
    e.preventDefault();
    setMensaje(null);
    setEnviando(true);
    try {
      await api.crearSede({ nombre, direccion, capacidad: capacidad ? Number(capacidad) : null });
      setNombre('');
      setDireccion('');
      setCapacidad('');
      cargar();
      setMensaje({ tipo: 'exito', texto: 'Sede registrada. Las sedes existentes no se ven afectadas.' });
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="admin">
      <header className="admin__header">
        <Link to="/panel" className="admin__volver">← Volver al panel</Link>
        <h1>Sedes</h1>
      </header>

      <div className="admin__cuerpo">
        {sesion.rol === 'direccion' && (
          <section className="admin__seccion">
            <h2>Abrir nueva sede</h2>
            <form className="form-inline" onSubmit={crear}>
              <div className="selector-campo">
                <label>Nombre</label>
                <input value={nombre} onChange={(e) => setNombre(e.target.value)} required />
              </div>
              <div className="selector-campo">
                <label>Dirección</label>
                <input value={direccion} onChange={(e) => setDireccion(e.target.value)} />
              </div>
              <div className="selector-campo" style={{ maxWidth: '110px' }}>
                <label>Capacidad</label>
                <input type="number" min="1" value={capacidad} onChange={(e) => setCapacidad(e.target.value)} />
              </div>
              <button className="boton boton--primario" disabled={enviando}>
                {enviando ? 'Guardando…' : 'Registrar sede'}
              </button>
            </form>
            {mensaje && (
              <p className={`admin__mensaje admin__mensaje--${mensaje.tipo}`}>{mensaje.texto}</p>
            )}
          </section>
        )}

        <section className="admin__seccion">
          <h2>Sedes activas ({sedes.length})</h2>
          <div className="lista-filas">
            {sedes.map((s) => (
              <div className="fila-item" key={s.id_sede}>
                <div>
                  <div className="fila-item__principal">{s.nombre}</div>
                  <div className="fila-item__meta">
                    {s.direccion || 'sin dirección registrada'}
                    {s.capacidad ? ` · capacidad ${s.capacidad}` : ''}
                  </div>
                </div>
              </div>
            ))}
            {sedes.length === 0 && <p className="admin__vacio">No hay sedes registradas aún.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
