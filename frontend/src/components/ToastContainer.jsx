import { CheckCircle2, XCircle, X } from 'lucide-react';
import '../styles/toast.css';

export default function ToastContainer({ toasts, onCerrar }) {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-pila">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast--${t.tipo}`}>
          {t.tipo === 'exito' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
          <span className="toast__texto">{t.texto}</span>
          <button className="toast__cerrar" onClick={() => onCerrar(t.id)} aria-label="Cerrar">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
