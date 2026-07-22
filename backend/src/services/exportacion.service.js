const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

// Arma un PDF simple y legible del reporte consolidado de una sede.
// Devuelve un Buffer, no escribe a disco (así se puede enviar directo por HTTP).
function generarPdfReporteSede(reporte, nombreSede) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const partes = [];

    doc.on('data', (chunk) => partes.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(partes)));
    doc.on('error', reject);

    doc.fontSize(18).text('LA PRE PERÚ', { align: 'center' });
    doc.fontSize(12).fillColor('#666').text('Reporte consolidado de sede', { align: 'center' });
    doc.moveDown(1.5);

    doc.fillColor('#000').fontSize(14).text(nombreSede);
    doc.fontSize(9).fillColor('#666').text(`Generado: ${new Date().toLocaleString('es-PE')}`);
    doc.moveDown();

    const fila = (etiqueta, valor) => {
      doc.fontSize(11).fillColor('#000').text(`${etiqueta}:  `, { continued: true }).fillColor('#c81e2e').text(String(valor));
    };

    doc.fillColor('#000').fontSize(12).text('Estudiantes', { underline: true });
    fila('Estudiantes activos', reporte.estudiantes.total_estudiantes);
    doc.moveDown(0.5);

    doc.fontSize(12).text('Pagos', { underline: true });
    fila('Total recaudado', `S/ ${Number(reporte.pagos.total_recaudado).toFixed(2)}`);
    fila('Pagos registrados', reporte.pagos.cantidad_pagos);
    doc.moveDown(0.5);

    doc.fontSize(12).text('Asistencia', { underline: true });
    fila('Asistencias registradas', reporte.asistencia.total_marcados);
    fila('Estudiantes distintos que asistieron', reporte.asistencia.estudiantes_distintos);

    doc.end();
  });
}

// Mismo contenido, en una hoja de cálculo (para quien prefiera Excel sobre PDF).
async function generarExcelReporteSede(reporte, nombreSede) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'LA PRE PERÚ - Sistema de Gestión Estudiantil';
  const hoja = workbook.addWorksheet('Reporte de sede');

  hoja.columns = [
    { header: 'Indicador', key: 'indicador', width: 34 },
    { header: 'Valor', key: 'valor', width: 22 },
  ];
  hoja.getRow(1).font = { bold: true };

  hoja.addRow({ indicador: 'Sede', valor: nombreSede });
  hoja.addRow({ indicador: 'Generado', valor: new Date().toLocaleString('es-PE') });
  hoja.addRow({});
  hoja.addRow({ indicador: 'Estudiantes activos', valor: Number(reporte.estudiantes.total_estudiantes) });
  hoja.addRow({ indicador: 'Total recaudado (S/)', valor: Number(reporte.pagos.total_recaudado) });
  hoja.addRow({ indicador: 'Pagos registrados', valor: Number(reporte.pagos.cantidad_pagos) });
  hoja.addRow({ indicador: 'Asistencias registradas', valor: Number(reporte.asistencia.total_marcados) });
  hoja.addRow({ indicador: 'Estudiantes distintos que asistieron', valor: Number(reporte.asistencia.estudiantes_distintos) });

  return workbook.xlsx.writeBuffer();
}

module.exports = { generarPdfReporteSede, generarExcelReporteSede };
