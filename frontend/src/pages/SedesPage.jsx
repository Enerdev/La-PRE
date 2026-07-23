import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, MapPinPlus, ClipboardX, ArrowLeft, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../api/client';
import '../styles/admin.css';

export default function SedesPage() {
  const { sesion } = useAuth();
  const { mostrarToast } = useToast();
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
      mostrarToast({ tipo: 'exito', texto: 'Sede registrada correctamente.' });
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message });
      mostrarToast({ tipo: 'error', texto: err.message });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="admin animar-entrada">
      <header className="admin__header">
        <Link to="/panel" className="admin__volver"><ArrowLeft size={13} /> Volver al panel</Link>
        <h1><Building2 size={20} /> Sedes</h1>
      </header>

      <div className="admin__cuerpo">
        {sesion.rol === 'direccion' && (
          <section className="admin__seccion">
            <h2><MapPinPlus size={17} /> Abrir nueva sede</h2>
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
                <MapPinPlus size={16} /> {enviando ? 'Guardando…' : 'Registrar sede'}
              </button>
            </form>
            {mensaje && (
              <p className={`admin__mensaje admin__mensaje--${mensaje.tipo}`}>{mensaje.texto}</p>
            )}
          </section>
        )}

        <section className="admin__seccion">
          <h2><Building2 size={17} /> Sedes activas ({sedes.length})</h2>
          <div className="lista-filas">
            {sedes.map((s) => (
              <div className="fila-item" key={s.id_sede}>
                <div className="fila-item__persona">
                  <span className="avatar-iniciales avatar-iniciales--sede"><MapPin size={16} /></span>
                  <div className="fila-item__texto">
                    <div className="fila-item__principal">{s.nombre}</div>
                    <div className="fila-item__meta">
                      {s.direccion || 'sin dirección registrada'}
                      {s.capacidad ? ` · capacidad ${s.capacidad}` : ''}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {sedes.length === 0 && (
              <p className="admin__vacio"><ClipboardX size={16} /> No hay sedes registradas aún.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
