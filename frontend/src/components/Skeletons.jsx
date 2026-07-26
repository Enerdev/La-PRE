// Imita la forma de las tarjetas de indicadores mientras llega el dato real.
export function SkeletonTarjetas({ cantidad = 3 }) {
  return (
    <div className="tarjetas tarjetas--skeleton">
      {Array.from({ length: cantidad }).map((_, i) => (
        <div className="tarjeta tarjeta--skeleton" key={i}>
          <div className="skeleton skeleton--linea" style={{ width: '55%', height: '0.75em' }} />
          <div className="skeleton skeleton--linea" style={{ width: '80%', height: '1.7em', marginTop: '0.75rem' }} />
        </div>
      ))}
    </div>
  );
}

// Imita filas de una lista (estudiantes, sedes) mientras carga.
export function SkeletonFilas({ cantidad = 4 }) {
  return (
    <div className="skeleton-lista">
      {Array.from({ length: cantidad }).map((_, i) => (
        <div className="skeleton-lista__fila" key={i}>
          <div className="skeleton skeleton--linea" style={{ width: '70%' }} />
          <div className="skeleton skeleton--linea" style={{ width: '35%' }} />
        </div>
      ))}
    </div>
  );
}

// Imita filas de una tabla (auditoría, ranking) mientras carga.
export function SkeletonTablaFilas({ columnas = 4, filas = 5 }) {
  return (
    <tbody>
      {Array.from({ length: filas }).map((_, f) => (
        <tr key={f}>
          {Array.from({ length: columnas }).map((_, c) => (
            <td key={c}>
              <div
                className="skeleton skeleton--linea"
                style={{ width: `${50 + ((f + c) % 3) * 15}%`, height: '1.1em' }}
              />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}
