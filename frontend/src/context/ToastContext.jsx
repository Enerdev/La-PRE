import { createContext, useCallback, useContext, useRef, useState } from 'react';
import ToastContainer from '../components/ToastContainer';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const mostrarToast = useCallback(({ tipo = 'exito', texto, duracionMs = 4000 }) => {
    const id = ++idRef.current;
    setToasts((actuales) => [...actuales, { id, tipo, texto }]);
    setTimeout(() => {
      setToasts((actuales) => actuales.filter((t) => t.id !== id));
    }, duracionMs);
  }, []);

  const cerrarToast = useCallback((id) => {
    setToasts((actuales) => actuales.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ mostrarToast }}>
      {children}
      <ToastContainer toasts={toasts} onCerrar={cerrarToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
