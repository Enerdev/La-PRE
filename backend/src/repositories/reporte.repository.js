const pool = require('../config/db');

// Consolida pagos y asistencia de una sede en una sola respuesta (RF-09).
async function consolidadoPorSede(sedeId) {
  const pagos = await pool.query(
    `SELECT COALESCE(SUM(monto), 0) AS "ingresosTotales", COUNT(*) AS cantidad_pagos
     FROM pago p JOIN estudiante e ON e.id_estudiante = p.estudiante_id
     WHERE e.sede_id = $1 AND p.estado = 'pagado'`,
    [sedeId]
  );

  const asistencias = await pool.query(
    `SELECT COUNT(*) AS "totalMarcados", COUNT(DISTINCT a.estudiante_id) AS "estudiantesDistintos"
     FROM asistencia a JOIN estudiante e ON e.id_estudiante = a.estudiante_id
     WHERE e.sede_id = $1 AND a.estado = 'asistio'`,
    [sedeId]
  );

  const estudiantes = await pool.query(
    `SELECT COUNT(*) AS "totalEstudiantes" FROM estudiante WHERE sede_id = $1 AND estado = 'activo'`,
    [sedeId]
  );

  return {
    sede_id: sedeId,
    estudiantes: estudiantes.rows[0],
    pagos: pagos.rows[0],
    asistencia: asistencias.rows[0],
  };
}

function _periodoInicio(periodo) {
  if (periodo === 'hoy') return `CURRENT_DATE`;
  if (periodo === 'mes') return `CURRENT_DATE - INTERVAL '1 month'`;
  return `CURRENT_DATE - INTERVAL '6 days'`;
}

async function tendencias(periodo = 'semana', sedeId = null) {
  const periodoInicio = _periodoInicio(periodo);
  const params = [];
  const sedeFiltro = sedeId ? 'AND e.sede_id = $1' : '';

  if (sedeId) params.push(sedeId);

  const asistenciaQuery = `
    SELECT fecha::date AS fecha, COUNT(*) AS asistencias
    FROM asistencia a
    JOIN estudiante e ON e.id_estudiante = a.estudiante_id
    WHERE a.estado = 'asistio' AND fecha >= ${periodoInicio} ${sedeFiltro}
    GROUP BY fecha
    ORDER BY fecha
  `;
  const { rows: asistenciaRows } = await pool.query(asistenciaQuery, params);

  const ingresosFecha = periodo === 'mes' ? "date_trunc('month', p.fecha)::date" : "p.fecha::date";
  const ingresosQuery = `
    SELECT ${ingresosFecha} AS fecha, COALESCE(SUM(p.monto), 0) AS ingresos
    FROM pago p
    JOIN estudiante e ON e.id_estudiante = p.estudiante_id
    WHERE p.estado = 'pagado' AND p.fecha::date >= ${periodoInicio} ${sedeFiltro}
    GROUP BY fecha
    ORDER BY fecha
  `;
  const { rows: ingresosRows } = await pool.query(ingresosQuery, params);

  const porSedeParams = [];
  const porSedeFiltro = sedeId ? 'AND s.id_sede = $1' : '';
  if (sedeId) porSedeParams.push(sedeId);

  const porSedeQuery = `
    SELECT
      s.id_sede,
      s.nombre,
      COALESCE(SUM(p.monto), 0) AS "ingresosTotales",
      COUNT(a.id_asistencia) AS asistencias,
      COUNT(DISTINCT e.id_estudiante) FILTER (WHERE e.estado = 'activo') AS "estudiantesActivos"
    FROM sede s
    LEFT JOIN estudiante e ON e.sede_id = s.id_sede
    LEFT JOIN pago p ON p.estudiante_id = e.id_estudiante
      AND p.estado = 'pagado'
      AND p.fecha::date >= ${periodoInicio}
    LEFT JOIN asistencia a ON a.estudiante_id = e.id_estudiante
      AND a.estado = 'asistio'
      AND a.fecha >= ${periodoInicio}
    WHERE s.estado = 'activo'
    ${porSedeFiltro}
    GROUP BY s.id_sede, s.nombre
    ORDER BY s.nombre
  `;
  const { rows: porSedeRows } = await pool.query(porSedeQuery, porSedeParams);

  const totalEstudiantes = porSedeRows.reduce(
    (acc, row) => acc + Number(row.estudiantesActivos ?? 0),
    0
  );
  const ingresosTotales = porSedeRows.reduce(
    (acc, row) => acc + Number(row.ingresosTotales ?? 0),
    0
  );
  const asistenciaHoy = porSedeRows.reduce(
    (acc, row) => acc + Number(row.asistencias ?? 0),
    0
  );

  return {
    periodo,
    totalEstudiantes,
    asistenciaHoy,
    ingresosTotales,
    totalSedes: porSedeRows.length,
    asistenciaDiaria: asistenciaRows,
    recaudacion: ingresosRows,
    porSede: porSedeRows,
  };
}

// Mismo consolidado pero a nivel de toda la institución, agrupado por sede.
async function consolidadoGeneral() {
  const { rows } = await pool.query(
    `SELECT
       s.id_sede,
       s.nombre AS nombre,
       COUNT(DISTINCT e.id_estudiante) AS "totalEstudiantes",
       COALESCE(SUM(p.monto) FILTER (WHERE p.estado = 'pagado'), 0) AS "ingresosTotales",
       COUNT(DISTINCT a.id_asistencia) FILTER (WHERE a.estado = 'asistio') AS "totalMarcados"
     FROM sede s
     LEFT JOIN estudiante e ON e.sede_id = s.id_sede AND e.estado = 'activo'
     LEFT JOIN pago p ON p.estudiante_id = e.id_estudiante
     LEFT JOIN asistencia a ON a.estudiante_id = e.id_estudiante
     WHERE s.estado = 'activo'
     GROUP BY s.id_sede, s.nombre
     ORDER BY s.nombre`
  );
  return rows;
}

module.exports = { consolidadoPorSede, consolidadoGeneral, tendencias };
