import { useEffect, useRef, useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import '../styles/shared.css';

const DURACION_QR_SEGUNDOS = 120;

/*
  NOTA: uso api.generarQR(estudianteId), que ya existe en tu client.js.
  Asumo que el backend devuelve algo como { token, imagenBase64 } o
  { token, qr } — ajusta el nombre del campo de imagen según lo que
  realmente responda tu endpoint /asistencia/qr/:estudianteId.
*/
export default function MiQRPage() {
  const { sesion } = useAuth();
  const [qr, setQr] = useState(null);
  const [segundosRestantes, setSegundosRestantes] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const intervaloRef = useRef(null);

  const estudianteId = sesion?.estudianteId ?? sesion?.estudiante_id;

  async function generarNuevoQR() {
    setCargando(true);
    setError(null);
    try {
      const data = await api.generarQR(estudianteId);
      setQr(data);
      setSegundosRestantes(data.expiraEnSegundos || DURACION_QR_SEGUNDOS);
    } catch (err) {
      setError(err.message || 'No se pudo generar el código QR.');
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    if (estudianteId) generarNuevoQR();
    return () => clearInterval(intervaloRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estudianteId]);

  useEffect(() => {
    intervaloRef.current = setInterval(() => {
      setSegundosRestantes((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(intervaloRef.current);
  }, [qr]);

  const vigente = segundosRestantes > 0;
  const imagenQR = qr?.qrImageDataUrl || qr?.imagenBase64 || qr?.qr || qr?.imagen || null;
  const progreso = segundosRestantes / DURACION_QR_SEGUNDOS;
  const radio = 90;
  const circunferencia = 2 * Math.PI * radio;
  const offset = circunferencia * (1 - progreso);

  return (
    <AppLayout titulo="Mi QR" subtitulo="Muestra este código al personal de asistencia para registrar tu ingreso">
      {error && <div className="login-alerta login-alerta--error">⚠️ {error}</div>}

      <div className="tarjeta" style={{ maxWidth: '480px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{ position: 'relative', width: '220px', height: '220px', margin: '0 auto 1.25rem' }}>
          <svg width="220" height="220" style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
            <circle cx="110" cy="110" r={radio} stroke="var(--negro-pre-linea)" strokeWidth="8" fill="none" />
            <circle
              cx="110"
              cy="110"
              r={radio}
              stroke={vigente ? 'var(--rojo-pre)' : 'var(--gris-acero)'}
              strokeWidth="8"
              fill="none"
              strokeDasharray={circunferencia}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>

          <div
            style={{
              position: 'absolute',
              inset: '18px',
              background: '#fff',
              borderRadius: 'var(--radio-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {cargando ? (
              <div className="skeleton-linea" style={{ width: '80%', height: '80%' }} />
            ) : imagenQR ? (
              <img
                src={imagenQR.startsWith('data:') ? imagenQR : `data:image/png;base64,${imagenQR}`}
                alt="Código QR de asistencia"
                style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: vigente ? 1 : 0.3 }}
              />
            ) : (
              <span style={{ color: '#999', fontSize: '0.8rem' }}>Sin código generado</span>
            )}
          </div>
        </div>

        <span
          className={`badge-estado ${
            !vigente ? 'badge-estado--gris' : segundosRestantes <= 20 ? 'badge-estado--ambar' : 'badge-estado--verde'
          }`}
        >
          {!vigente ? 'Expirado' : `Vigente · ${segundosRestantes}s`}
        </span>

        <p style={{ color: 'var(--texto-claro-tenue)', fontSize: '0.85rem', margin: '1rem 0 1.25rem' }}>
          {sesion?.nombres} {sesion?.apellidos} · el código expira a los 120s por seguridad
        </p>

        <button className="boton-primario" onClick={generarNuevoQR} disabled={cargando} style={{ width: '100%' }}>
          {cargando ? 'Generando...' : vigente ? 'Generar nuevo código' : 'Renovar código QR'}
        </button>
      </div>
    </AppLayout>
  );
}
