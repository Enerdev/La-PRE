// Imita la forma de las tarjetas de indicadores mientras llega el dato real.
export function SkeletonTarjetas({ cantidad = 3 }) {
  return (
    <div className="tarjetas">
      {Array.from({ length: cantidad }).map((_, i) => (
        <div className="tarjeta" key={i}>
          <div className="skeleton skeleton--linea" style={{ width: '55%', height: '0.7em' }} />
          <div className="skeleton skeleton--linea" style={{ width: '80%', height: '1.8em', marginTop: '0.5rem' }} />
        </div>
      ))}
    </div>
  );
}

// Imita filas de una lista (estudiantes, sedes) mientras carga.
export function SkeletonFilas({ cantidad = 4 }) {
  return (
    <div className="lista-filas">
      {Array.from({ length: cantidad }).map((_, i) => (
        <div className="fila-item" key={i}>
          <div style={{ flex: 1 }}>
            <div className="skeleton skeleton--linea" style={{ width: '40%' }} />
            <div className="skeleton skeleton--linea" style={{ width: '25%' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// Imita filas de una tabla (auditoría, ranking) mientras carga.
export function SkeletonTablaFilas({ columnas = 4, filas = 5 }) {
  return (
    <>
      {Array.from({ length: filas }).map((_, f) => (
        <tr key={f}>
          {Array.from({ length: columnas }).map((_, c) => (
            <td key={c}>
              <div className="skeleton skeleton--linea" style={{ width: `${50 + ((f + c) % 3) * 15}%` }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
