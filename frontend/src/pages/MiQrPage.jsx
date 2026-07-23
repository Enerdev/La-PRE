import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import NavEstudiante from '../components/NavEstudiante';
import '../styles/miqr.css';

export default function MiQrPage() {
  const { sesion } = useAuth();

  const [qr, setQr] = useState(null); // { qrImageDataUrl, expiraEnSegundos }
  const [segundosRestantes, setSegundosRestantes] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const intervaloRef = useRef(null);

  const generar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const data = await api.generarQR(sesion.estudiante_id);
      setQr(data);
      setSegundosRestantes(data.expiraEnSegundos);
    } catch (err) {
      setError(err.message || 'No se pudo generar el código.');
    } finally {
      setCargando(false);
    }
  }, [sesion]);

  useEffect(() => {
    generar();
  }, [generar]);

  useEffect(() => {
    if (!qr) return;
    intervaloRef.current = setInterval(() => {
      setSegundosRestantes((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(intervaloRef.current);
  }, [qr]);

  const porcentaje = qr ? Math.round((segundosRestantes / qr.expiraEnSegundos) * 100) : 0;
  const expirado = qr && segundosRestantes <= 0;

  return (
    <>
      <NavEstudiante />
      <div className="miqr-escena">
        <div className="miqr-ticket">
          <span className="miqr-ticket__serie">CÓDIGO DE ASISTENCIA · UN SOLO USO</span>
          <h1 className="miqr-ticket__titulo">Mi código QR</h1>

          {cargando && <p className="miqr-ticket__ayuda">Generando código…</p>}
          {error && <p className="miqr-ticket__ayuda">{error}</p>}

          {qr && !cargando && (
            <>
              <div className="miqr-ticket__marco" style={{ opacity: expirado ? 0.35 : 1 }}>
                <img src={qr.qrImageDataUrl} alt="Código QR de asistencia" />
              </div>

              <div className="miqr-ticket__anillo" style={{ '--pct': porcentaje }}>
                <span>{expirado ? '0s' : `${segundosRestantes}s`}</span>
              </div>

              <p className="miqr-ticket__ayuda">
                {expirado
                  ? 'Este código ya expiró. Genera uno nuevo para que el personal de asistencia lo escanee.'
                  : 'Muestra este código al personal de asistencia. Se usa una sola vez.'}
              </p>
            </>
          )}

          <button className="boton boton--primario miqr-ticket__boton" onClick={generar} disabled={cargando}>
            {expirado ? 'Generar nuevo código' : 'Regenerar código'}
          </button>
        </div>
      </div>
    </>
  );
}
