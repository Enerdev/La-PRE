import { useEffect, useRef, useState, useCallback } from 'react';
import jsQR from 'jsqr';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import ResultFlash from '../components/ResultFlash';
import '../styles/scanner.css';

const PAUSA_TRAS_RESULTADO_MS = 1800;

export default function ScannerPage() {
  const { sesion, cerrarSesion } = useAuth();
  const navigate = useNavigate();

  const videoRef = useRef(null);
  const canvasRef = useRef(document.createElement('canvas'));
  const escaneandoRef = useRef(true);
  const framRef = useRef(null);

  const [estadoCamara, setEstadoCamara] = useState('iniciando'); // iniciando | listo | error
  const [resultado, setResultado] = useState(null); // { tipo, detalle }
  const [contador, setContador] = useState(0);

  const manejarDeteccion = useCallback(async (valor) => {
    if (!escaneandoRef.current) return;
    escaneandoRef.current = false;

    try {
      const respuesta = await api.marcarAsistencia(valor);
      setResultado({
        tipo: 'exito',
        detalle: `Registrado a las ${new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`,
      });
      setContador((c) => c + 1);
      void respuesta;
    } catch (err) {
      if (err.status === 409) {
        setResultado({ tipo: 'duplicado', detalle: err.message });
      } else {
        setResultado({ tipo: 'error', detalle: err.message });
      }
    }

    setTimeout(() => {
      setResultado(null);
      escaneandoRef.current = true;
    }, PAUSA_TRAS_RESULTADO_MS);
  }, []);

  useEffect(() => {
    let stream;

    async function iniciarCamara() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setEstadoCamara('listo');
          bucleEscaneo();
        }
      } catch (err) {
        console.error('No se pudo acceder a la cámara:', err);
        setEstadoCamara('error');
      }
    }

    function bucleEscaneo() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) {
        framRef.current = requestAnimationFrame(bucleEscaneo);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const codigo = jsQR(imageData.data, imageData.width, imageData.height);

      if (codigo && escaneandoRef.current) {
        manejarDeteccion(codigo.data);
      }

      framRef.current = requestAnimationFrame(bucleEscaneo);
    }

    iniciarCamara();

    return () => {
      if (framRef.current) cancelAnimationFrame(framRef.current);
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [manejarDeteccion]);

  function salir() {
    cerrarSesion();
    navigate('/login');
  }

  return (
    <div className="escaner">
      <header className="escaner__header">
        <div className="escaner__header-titulo">
          <span className="eyebrow">Sede #{sesion?.sede_id ?? '—'}</span>
          <h1>Control de Asistencia</h1>
        </div>
        <button className="boton boton--fantasma" onClick={salir}>
          Salir
        </button>
      </header>

      <div className="escaner__cuerpo">
        <div className="visor">
          <video ref={videoRef} muted playsInline />
          <div className="visor__esquina visor__esquina--tl" />
          <div className="visor__esquina visor__esquina--tr" />
          <div className="visor__esquina visor__esquina--bl" />
          <div className="visor__esquina visor__esquina--br" />
          {estadoCamara === 'listo' && <div className="visor__linea" />}
        </div>

        <p className="escaner__estado">
          {estadoCamara === 'iniciando' && 'Solicitando acceso a la cámara…'}
          {estadoCamara === 'listo' && `Escaneando · ${contador} marcados en esta sesión`}
          {estadoCamara === 'error' && 'No se pudo acceder a la cámara del dispositivo.'}
        </p>

        {estadoCamara === 'error' && (
          <p className="escaner__ayuda">
            Verifica que el navegador tenga permiso de cámara para este sitio, y que ningún
            otro programa la esté usando. Recarga la página después de habilitar el permiso.
          </p>
        )}
      </div>

      <ResultFlash tipo={resultado?.tipo} detalle={resultado?.detalle} />
    </div>
  );
}
