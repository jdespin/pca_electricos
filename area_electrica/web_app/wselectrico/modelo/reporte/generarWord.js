const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, HeadingLevel, BorderStyle, ShadingType,
  ImageRun, Header, Footer, PageNumber, NumberFormat,
} = require('docx');
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

const COLOR_DARK  = '1E3A5F';
const COLOR_LIGHT = 'EBF0F8';
const COLOR_CAL   = { A: '166534', B: '1D4ED8', C: '92400E' };
const CAL_LABEL   = { A: 'Excelente', B: 'Bueno', C: 'Regular' };

function heading(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 100 },
    shading: { type: ShadingType.SOLID, color: COLOR_DARK, fill: COLOR_DARK },
    run: { color: 'FFFFFF', bold: true, size: 22 },
  });
}

function labelRow(label, value) {
  return new TableRow({
    children: [
      new TableCell({
        width: { size: 30, type: WidthType.PERCENTAGE },
        shading: { type: ShadingType.SOLID, fill: COLOR_LIGHT },
        children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 18, color: '374151' })] })],
      }),
      new TableCell({
        width: { size: 70, type: WidthType.PERCENTAGE },
        children: [new Paragraph({ children: [new TextRun({ text: value || '—', size: 18 })] })],
      }),
    ],
  });
}

function infoTable(rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map(([l, v]) => labelRow(l, v)),
  });
}

module.exports.GenerarWordReporte = async function (idorden) {
  const datos = await obtenerDatos(idorden);
  if (!datos) return { success: false, mensaje: 'Orden no encontrada' };

  const { orden, personal, reportes, equipos, fotos } = datos;
  const cal = orden.strcalificacion;

  const children = [];

  
  children.push(new Paragraph({
    children: [new TextRun({ text: `Reporte de Orden de Trabajo #${orden.idorden}`, bold: true, size: 36, color: COLOR_DARK })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 100 },
  }));
  children.push(new Paragraph({
    children: [new TextRun({ text: 'Área Eléctrica — PCA', size: 22, color: '6B7280' })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 300 },
  }));

  
  if (cal) {
    children.push(new Paragraph({
      children: [
        new TextRun({ text: `Calificación: `, bold: true, size: 24 }),
        new TextRun({ text: `${cal} — ${CAL_LABEL[cal] || cal}`, bold: true, size: 24, color: COLOR_CAL[cal] || '111827' }),
      ],
      spacing: { after: 60 },
    }));
    children.push(new Paragraph({
      children: [new TextRun({ text: orden.strobservacionevaluacion || 'Sin observación registrada.', size: 20, color: '6B7280', italics: true })],
      spacing: { after: 240 },
    }));
  }

  
  children.push(heading('Datos de la Orden'));
  children.push(infoTable([
    ['Tipo',       orden.strtipo],
    ['Contrato',   orden.strcontrato],
    ['Proyecto',   orden.strproyecto],
    ['Registro',   orden.strregistro],
    ['Locación',   orden.strlocacion],
    ['Pozo',       orden.strpozo],
    ['Fecha',      orden.dtfecha],
    ['Estado',     orden.strestado?.toUpperCase()],
    ['Creado',     orden.dtfechacreacion],
  ]));

  
  children.push(heading('Personal Asignado'));
  if (personal.length) {
    personal.forEach(p => {
      children.push(new Paragraph({
        children: [
          new TextRun({ text: `• ${p.nombre}`, size: 20 }),
          p.boolider ? new TextRun({ text: '  ★ Líder', bold: true, size: 20, color: COLOR_DARK }) : new TextRun({ text: '' }),
        ],
        spacing: { after: 60 },
      }));
    });
  } else {
    children.push(new Paragraph({ children: [new TextRun({ text: '—', size: 20, italics: true, color: '9CA3AF' })], spacing: { after: 60 } }));
  }

  
  children.push(heading('Reporte General del Técnico'));
  if (reportes.length) {
    reportes.forEach(r => {
      children.push(new Paragraph({ children: [new TextRun({ text: `Técnico: ${r.tecnico}  ·  Enviado: ${r.dtfechaenvio}`, bold: true, size: 20, color: COLOR_DARK })], spacing: { before: 120, after: 60 } }));
      children.push(infoTable([
        ['Desviación general', r.strdesviaciongeneral],
        ['Conclusión general', r.strconclusiongeneral],
      ]));
    });
  } else {
    children.push(new Paragraph({ children: [new TextRun({ text: 'Sin reporte general.', italics: true, size: 20, color: '9CA3AF' })], spacing: { after: 60 } }));
  }

  
  children.push(heading('Reporte de Equipos'));
  if (equipos.length) {
    for (const eq of equipos) {
      children.push(new Paragraph({
        children: [new TextRun({ text: eq.strtipoequipo, bold: true, size: 22, color: 'FFFFFF' })],
        shading: { type: ShadingType.SOLID, fill: COLOR_DARK },
        spacing: { before: 160, after: 80 },
      }));
      children.push(infoTable([
        ['Potencia',       eq.strpotencia],
        ['Serial',         eq.strserial],
        ['Marca',          eq.strmarca],
        ['CAF',            eq.strcaf],
        ['Estado general', eq.strestadogeneral],
        ['Actividades',    eq.stractividades],
        ['Desviaciones',   eq.strdesviaciones],
        ['Técnico',        eq.tecnico],
        ['Fecha envío',    eq.dtfechaenvio],
      ]));

      
      const fotosEq = fotos.filter(f => f.strtipoequipo === eq.strtipoequipo && f.bytfoto);
      for (const foto of fotosEq) {
        try {
          const imgBuf = Buffer.from(foto.bytfoto);
          const mime = (foto.strmimetype || 'image/jpeg').toLowerCase();
          const imgType = mime.includes('png') ? 'png' : mime.includes('gif') ? 'gif' : 'jpg';
          children.push(new Paragraph({
            children: [
              new ImageRun({ data: imgBuf, transformation: { width: 260, height: 200 }, type: imgType }),
            ],
            spacing: { before: 80, after: 40 },
          }));
          if (foto.stretiqueta) {
            children.push(new Paragraph({
              children: [new TextRun({ text: foto.stretiqueta, size: 16, italics: true, color: '6B7280' })],
              spacing: { after: 80 },
            }));
          }
        } catch (_) {  }
      }
    }
  } else {
    children.push(new Paragraph({ children: [new TextRun({ text: 'Sin reportes de equipos.', italics: true, size: 20, color: '9CA3AF' })], spacing: { after: 60 } }));
  }

  
  children.push(new Paragraph({
    children: [new TextRun({ text: `Documento generado automáticamente · Área Eléctrica PCA · Orden #${orden.idorden}`, size: 16, color: '9CA3AF' })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 400 },
  }));

  const doc = new Document({ sections: [{ children }] });
  const buffer = await Packer.toBuffer(doc);
  return { success: true, buffer, filename: `reporte_orden_${idorden}.docx` };
};
