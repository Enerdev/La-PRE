const CONTENIDO = {
  exito: { clase: 'exito', texto: 'Asistencia Registrada' },
  duplicado: { clase: 'duplicado', texto: 'Código Ya Utilizado' },
  error: { clase: 'error', texto: 'Código Inválido' },
};

// El "sello" es la firma visual de todo el sistema: cada marcado de asistencia
// se resuelve como si un sello de tinta cayera sobre una ficha oficial.
export default function ResultFlash({ tipo, detalle }) {
  if (!tipo) return null;
  const { clase, texto } = CONTENIDO[tipo] || CONTENIDO.error;

  return (
    <div className={`sello-overlay sello-overlay--${clase}`}>
      <div className="sello">
        <div className="sello__marco">
          <p className="sello__texto">{texto}</p>
          {detalle && <p className="sello__detalle">{detalle}</p>}
        </div>
      </div>
    </div>
  );
}
