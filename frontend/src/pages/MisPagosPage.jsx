import { useEffect, useState } from 'react';
import { Wallet, Banknote, ArrowLeftRight, CreditCard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import NavEstudiante from '../components/NavEstudiante';
import '../styles/pagos.css';

function formatearSoles(monto) {
  return `S/ ${Number(monto || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
}

function iconoMetodo(metodo) {
  if (metodo === 'transferencia') return <ArrowLeftRight size={14} />;
  if (metodo === 'tarjeta') return <CreditCard size={14} />;
  return <Banknote size={14} />;
}

export default function MisPagosPage() {
  const { sesion } = useAuth();
  const [cuenta, setCuenta] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.estadoDeCuenta(sesion.estudiante_id).then(setCuenta).catch((err) => setError(err.message));
  }, [sesion]);

  return (
    <>
      <NavEstudiante />
      <div className="pagos animar-entrada">
        <div className="pagos__cuerpo" style={{ paddingTop: '2rem' }}>
          <h1 style={{ color: 'var(--texto-claro)', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Wallet size={20} color="var(--rojo-pre)" /> Mis Pagos
          </h1>

          {error && <p className="pagos__mensaje pagos__mensaje--error">{error}</p>}

          {cuenta && (
            <div className="estado-cuenta">
              <div className="estado-cuenta__resumen">
                <span className="estado-cuenta__total">{formatearSoles(cuenta.resumen.total_pagado)}</span>
                <span className="estado-cuenta__cantidad">{cuenta.resumen.cantidad_pagos} pagos registrados</span>
              </div>

              <div className="historial">
                {cuenta.historial.length === 0 && (
                  <span className="historial__vacio">Aún no tienes pagos registrados.</span>
                )}
                {cuenta.historial.map((p) => (
                  <div className="historial__fila" key={p.id_pago}>
                    <span className="historial__metodo">
                      {iconoMetodo(p.metodo_pago)} {new Date(p.fecha).toLocaleDateString('es-PE')} · {p.metodo_pago || '—'}
                    </span>
                    <span>{formatearSoles(p.monto)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
