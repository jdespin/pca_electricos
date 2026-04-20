const ExcelJS = require('exceljs');
const { execCentralizadaProcedimientos } = require('../../config/execSQLCentralizada.helper');

async function obtenerDatos(idorden) {
  const sqlOrden = `
    SELECT o.idorden, o.strtipo, o.strcontrato, o.strproyecto, o.strregistro,
           o.strlocacion, o.strpozo, o.strestado, o.strcalificacion,
           o.strobservacionevaluacion,
           to_char(o.dtfecha,'DD/MM/YYYY') AS dtfecha,
           to_char(o.dtfechacreacion,'DD/MM/YYYY HH24:MI') AS dtfechacreacion
    FROM public.tb_orden_trabajo o WHERE o.idorden = $1`;
  const sqlPersonal = `
    SELECT per.strnombres || ' ' || per.strapellidos AS nombre, op.boolider
    FROM public.tb_orden_personal op
    JOIN seguridad.tb_usuario u ON u.idusuario = op.idusuario
    JOIN central.tb_persona per ON per.idpersona = u.usuario_idpersona
    WHERE op.idorden = $1 ORDER BY op.boolider DESC`;
  const sqlReportes = `
    SELECT per.strnombres || ' ' || per.strapellidos AS tecnico,
           ro.strdesviaciongeneral, ro.strconclusiongeneral,
           to_char(ro.dtfechaenvio,'DD/MM/YYYY HH24:MI') AS dtfechaenvio
    FROM public.tb_reporte_orden ro
    JOIN seguridad.tb_usuario u ON u.idusuario = ro.idusuario
    JOIN central.tb_persona per ON per.idpersona = u.usuario_idpersona
    WHERE ro.idorden = $1 ORDER BY ro.dtfechaenvio DESC`;
  const sqlEquipos = `
    SELECT re.strtipoequipo, re.strpotencia, re.strserial, re.strmarca, re.strcaf,
           re.strestadogeneral, re.stractividades, re.strdesviaciones,
           per.strnombres || ' ' || per.strapellidos AS tecnico,
           to_char(re.dtfechaenvio,'DD/MM/YYYY HH24:MI') AS dtfechaenvio
    FROM public.tb_reporte_equipo re
    JOIN seguridad.tb_usuario u ON u.idusuario = re.idusuario
    JOIN central.tb_persona per ON per.idpersona = u.usuario_idpersona
    WHERE re.idorden = $1 ORDER BY re.strtipoequipo`;
  const sqlFotos = `
    SELECT strtipoequipo, stretiqueta, bytfoto, strmimetype, dbllatitud, dbllongitud
    FROM public.tb_foto_equipo WHERE idorden = $1
    ORDER BY strtipoequipo, stretiqueta`;

  const [rO, rP, rR, rE, rF] = await Promise.all([
    execCentralizadaProcedimientos(sqlOrden,    [idorden], 'OK', 'Error'),
    execCentralizadaProcedimientos(sqlPersonal, [idorden], 'OK', 'Error'),
    execCentralizadaProcedimientos(sqlReportes, [idorden], 'OK', 'Error'),
    execCentralizadaProcedimientos(sqlEquipos,  [idorden], 'OK', 'Error'),
    execCentralizadaProcedimientos(sqlFotos,    [idorden], 'OK', 'Error'),
  ]);

  const orden = (rO.data ?? [])[0];
  if (!orden) return null;
  return { orden, personal: rP.data ?? [], reportes: rR.data ?? [], equipos: rE.data ?? [], fotos: rF.data ?? [] };
}

const DARK  = '1E3A5F';
const LIGHT = 'EBF0F8';

function sectionHeader(ws, rowNum, text, colSpan = 8) {
  const row = ws.getRow(rowNum);
  row.height = 22;
  const cell = ws.getCell(rowNum, 1);
  cell.value = text.toUpperCase();
  cell.font  = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
  cell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + DARK } };
  cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  ws.mergeCells(rowNum, 1, rowNum, colSpan);
}

function labelValue(ws, rowNum, label, value, colSpan = 7) {
  const lCell = ws.getCell(rowNum, 1);
  lCell.value = label;
  lCell.font  = { bold: true, size: 10, color: { argb: 'FF374151' } };
  lCell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + LIGHT } };
  lCell.alignment = { vertical: 'top', wrapText: true };

  const vCell = ws.getCell(rowNum, 2);
  vCell.value = value || '—';
  vCell.font  = { size: 10 };
  vCell.alignment = { vertical: 'top', wrapText: true };
  ws.mergeCells(rowNum, 2, rowNum, colSpan);

  ws.getRow(rowNum).height = 18;
}

function applyBorder(cell) {
  const border = { style: 'thin', color: { argb: 'FFE5E7EB' } };
  cell.border = { top: border, left: border, bottom: border, right: border };
}

module.exports.GenerarExcelReporte = async function (idorden) {
  const datos = await obtenerDatos(idorden);
  if (!datos) return { success: false, mensaje: 'Orden no encontrada' };

  const { orden, personal, reportes, equipos, fotos } = datos;
  const wb = new ExcelJS.Workbook();
  wb.creator = 'PCA Área Eléctrica';
  wb.created = new Date();

  
  
  
  const wsOrden = wb.addWorksheet('Orden de Trabajo');
  wsOrden.columns = [
    { width: 22 }, { width: 40 }, { width: 18 }, { width: 18 },
    { width: 18 }, { width: 18 }, { width: 18 }, { width: 18 },
  ];

  
  wsOrden.mergeCells('A1:H1');
  const titulo = wsOrden.getCell('A1');
  titulo.value = `REPORTE DE ORDEN DE TRABAJO #${orden.idorden} — ÁREA ELÉCTRICA PCA`;
  titulo.font  = { bold: true, size: 13, color: { argb: 'FFFFFFFF' } };
  titulo.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + DARK } };
  titulo.alignment = { horizontal: 'center', vertical: 'middle' };
  wsOrden.getRow(1).height = 30;

  let r = 3;
  sectionHeader(wsOrden, r++, 'Datos de la Orden');
  const camposOrden = [
    ['Tipo',            orden.strtipo],
    ['Contrato',        orden.strcontrato],
    ['Proyecto',        orden.strproyecto],
    ['Registro',        orden.strregistro],
    ['Locación',        orden.strlocacion],
    ['Pozo',            orden.strpozo],
    ['Fecha',           orden.dtfecha],
    ['Estado',          orden.strestado?.toUpperCase()],
    ['Fecha creación',  orden.dtfechacreacion],
  ];
  camposOrden.forEach(([l, v]) => { labelValue(wsOrden, r, l, v); r++; });

  
  if (orden.strcalificacion) {
    r++;
    sectionHeader(wsOrden, r++, 'Evaluación del Supervisor');
    labelValue(wsOrden, r++, 'Calificación', `${orden.strcalificacion} — ${({'A':'Excelente','B':'Bueno','C':'Regular'})[orden.strcalificacion] || orden.strcalificacion}`);
    labelValue(wsOrden, r++, 'Observación',  orden.strobservacionevaluacion);
  }

  
  r++;
  sectionHeader(wsOrden, r++, 'Personal Asignado');
  personal.forEach(p => {
    labelValue(wsOrden, r, p.boolider ? 'Líder' : 'Técnico', p.nombre);
    r++;
  });

  
  
  
  const wsRep = wb.addWorksheet('Reporte General');
  wsRep.columns = [{ width: 22 }, { width: 60 }, { width: 20 }, { width: 20 }, { width: 20 }, { width: 20 }, { width: 20 }, { width: 20 }];

  let r2 = 1;
  sectionHeader(wsRep, r2++, 'Reporte General del Técnico');
  if (reportes.length) {
    reportes.forEach(rep => {
      labelValue(wsRep, r2++, 'Técnico',              rep.tecnico);
      labelValue(wsRep, r2++, 'Fecha envío',          rep.dtfechaenvio);
      labelValue(wsRep, r2++, 'Desviación general',   rep.strdesviaciongeneral);
      labelValue(wsRep, r2++, 'Conclusión general',   rep.strconclusiongeneral);
      r2++;
    });
  } else {
    wsRep.getCell(r2, 1).value = 'Sin reporte general.';
    wsRep.getCell(r2, 1).font = { italic: true, color: { argb: 'FF9CA3AF' } };
  }

  
  
  
  const wsEq = wb.addWorksheet('Equipos');
  wsEq.columns = [
    { header: 'Tipo Equipo',    key: 'tipo',      width: 20 },
    { header: 'Potencia',       key: 'potencia',  width: 16 },
    { header: 'Serial',         key: 'serial',    width: 20 },
    { header: 'Marca',          key: 'marca',     width: 18 },
    { header: 'CAF',            key: 'caf',       width: 14 },
    { header: 'Estado General', key: 'estado',    width: 18 },
    { header: 'Actividades',    key: 'actividades', width: 40 },
    { header: 'Desviaciones',   key: 'desviaciones', width: 40 },
    { header: 'Técnico',        key: 'tecnico',   width: 30 },
    { header: 'Fecha Envío',    key: 'fecha',     width: 20 },
  ];

  
  wsEq.getRow(1).eachCell(cell => {
    cell.font  = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
    cell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + DARK } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    applyBorder(cell);
  });
  wsEq.getRow(1).height = 22;

  equipos.forEach((eq, i) => {
    const row = wsEq.addRow({
      tipo:        eq.strtipoequipo,
      potencia:    eq.strpotencia,
      serial:      eq.strserial,
      marca:       eq.strmarca,
      caf:         eq.strcaf,
      estado:      eq.strestadogeneral,
      actividades: eq.stractividades,
      desviaciones: eq.strdesviaciones,
      tecnico:     eq.tecnico,
      fecha:       eq.dtfechaenvio,
    });
    row.eachCell(cell => {
      cell.alignment = { wrapText: true, vertical: 'top' };
      cell.font = { size: 10 };
      applyBorder(cell);
      if (i % 2 === 0) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
    });
    row.height = 40;
  });

  
  
  
  const fotosValidas = fotos.filter(f => f.bytfoto);
  if (fotosValidas.length) {
    const wsFotos = wb.addWorksheet('Fotografías');
    wsFotos.columns = [
      { width: 22 }, { width: 40 }, { width: 40 }, { width: 40 }, { width: 40 },
    ];

    
    wsFotos.mergeCells('A1:E1');
    const tFotos = wsFotos.getCell('A1');
    tFotos.value = 'FOTOGRAFÍAS DE EQUIPOS';
    tFotos.font  = { bold: true, size: 13, color: { argb: 'FFFFFFFF' } };
    tFotos.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + DARK } };
    tFotos.alignment = { horizontal: 'center', vertical: 'middle' };
    wsFotos.getRow(1).height = 30;

    const IMG_W = 260;
    const IMG_H = 200;
    const COL_W_PX = 200; 
    const ROW_H_PT = 150; 

    let fRow = 2;          
    let fCol = 0;          
    const COLS_PER_ROW = 4;

    
    const grupos = {};
    for (const f of fotosValidas) {
      const key = f.strtipoequipo || 'Sin tipo';
      if (!grupos[key]) grupos[key] = [];
      grupos[key].push(f);
    }

    for (const [tipo, fGroup] of Object.entries(grupos)) {
      
      if (fCol !== 0) { fRow++; fCol = 0; }
      wsFotos.mergeCells(fRow, 1, fRow, COLS_PER_ROW + 1);
      const hCell = wsFotos.getCell(fRow, 1);
      hCell.value = tipo.toUpperCase();
      hCell.font  = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      hCell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + DARK } };
      hCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      wsFotos.getRow(fRow).height = 22;
      fRow++;
      fCol = 0;

      for (const foto of fGroup) {
        try {
          const mime = (foto.strmimetype || 'image/jpeg').toLowerCase();
          const ext  = mime.includes('png') ? 'png' : 'jpeg';
          const imgBuf = Buffer.isBuffer(foto.bytfoto) ? foto.bytfoto : Buffer.from(foto.bytfoto);

          
          if (fCol >= COLS_PER_ROW) { fRow++; fCol = 0; }

          
          wsFotos.getRow(fRow).height = ROW_H_PT;

          const imgId = wb.addImage({ buffer: imgBuf, extension: ext });
          wsFotos.addImage(imgId, {
            tl: { col: fCol, row: fRow - 1 },      
            ext: { width: IMG_W, height: IMG_H },
          });

          
          const labelRow = fRow + 1;
          const labelCell = wsFotos.getCell(labelRow, fCol + 1);
          labelCell.value = foto.stretiqueta || '';
          labelCell.font  = { italic: true, size: 9, color: { argb: 'FF6B7280' } };
          labelCell.alignment = { horizontal: 'center', wrapText: true };
          wsFotos.getRow(labelRow).height = 16;

          fCol++;
        } catch (_) {  }
      }

      
      if (fCol > 0) { fRow += 2; fCol = 0; }
    }
  }

  const buffer = await wb.xlsx.writeBuffer();
  return { success: true, buffer: Buffer.from(buffer), filename: `reporte_orden_${idorden}.xlsx` };
};
