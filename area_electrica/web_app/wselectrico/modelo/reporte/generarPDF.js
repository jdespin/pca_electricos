const puppeteer = require('puppeteer');
const { execCentralizadaProcedimientos } = require('../../config/execSQLCentralizada.helper');

async function obtenerDatosReporte(idorden) {
  const sqlOrden = `
    SELECT o.idorden, o.strtipo, o.strcontratista, o.strsubcontratista, o.strterminado,
           o.strsitio, o.strordencompra, o.strestado, o.strcalificacion,
           o.strobservacionevaluacion,
           to_char(o.dtfecha,'DD/MM/YYYY')            AS dtfecha,
           to_char(o.dtfechacreacion,'DD/MM/YYYY HH24:MI') AS dtfechacreacion
    FROM public.tb_orden_trabajo o WHERE o.idorden = $1
  `;
  const sqlPersonal = `
    SELECT per.strnombres || ' ' || per.strapellidos AS nombre, op.boolider
    FROM public.tb_orden_personal op
    JOIN seguridad.tb_usuario u ON u.idusuario = op.idusuario
    JOIN central.tb_persona per ON per.idpersona = u.usuario_idpersona
    WHERE op.idorden = $1 ORDER BY op.boolider DESC
  `;
  const sqlReportesOrden = `
    SELECT per.strnombres || ' ' || per.strapellidos AS tecnico,
           ro.strdesviaciongeneral, ro.strconclusiongeneral,
           to_char(ro.dtfechaenvio,'DD/MM/YYYY HH24:MI') AS dtfechaenvio
    FROM public.tb_reporte_orden ro
    JOIN seguridad.tb_usuario u ON u.idusuario = ro.idusuario
    JOIN central.tb_persona per ON per.idpersona = u.usuario_idpersona
    WHERE ro.idorden = $1 ORDER BY ro.dtfechaenvio DESC
  `;
  const sqlEquipos = `
    SELECT re.strtipoequipo, re.strpotencia, re.strserial, re.strmarca, re.strcaf,
           re.strestadogeneral, re.stractividades, re.strdesviaciones,
           per.strnombres || ' ' || per.strapellidos AS tecnico,
           to_char(re.dtfechaenvio,'DD/MM/YYYY HH24:MI') AS dtfechaenvio
    FROM public.tb_reporte_equipo re
    JOIN seguridad.tb_usuario u ON u.idusuario = re.idusuario
    JOIN central.tb_persona per ON per.idpersona = u.usuario_idpersona
    WHERE re.idorden = $1 ORDER BY re.strtipoequipo
  `;
  const sqlFotos = `
    SELECT idfotoequipo, strtipoequipo, stretiqueta, bytfoto, strmimetype,
           dbllatitud, dbllongitud
    FROM public.tb_foto_equipo WHERE idorden = $1
    ORDER BY strtipoequipo, stretiqueta
  `;

  const [rOrden, rPersonal, rReportes, rEquipos, rFotos] = await Promise.all([
    execCentralizadaProcedimientos(sqlOrden,    [idorden], 'OK', 'Error'),
    execCentralizadaProcedimientos(sqlPersonal, [idorden], 'OK', 'Error'),
    execCentralizadaProcedimientos(sqlReportesOrden, [idorden], 'OK', 'Error'),
    execCentralizadaProcedimientos(sqlEquipos,  [idorden], 'OK', 'Error'),
    execCentralizadaProcedimientos(sqlFotos,    [idorden], 'OK', 'Error'),
  ]);

  const orden = (rOrden.data ?? [])[0];
  if (!orden) return null;

  
  const fotos = (rFotos.data ?? []).map(f => ({
    ...f,
    base64: f.bytfoto ? `data:${f.strmimetype};base64,${Buffer.from(f.bytfoto).toString('base64')}` : null,
  }));

  return {
    orden,
    personal:      rPersonal.data   ?? [],
    reportesOrden: rReportes.data   ?? [],
    equipos:       rEquipos.data    ?? [],
    fotos,
  };
}

function val(v) { return v || '—'; }

function campoDisplay(label, value) {
  return `
    <div class="field">
      <label>${label}</label>
      <div class="value-display">${val(value)}</div>
    </div>`;
}

function generarHTML(datos) {
  const { orden, personal, reportesOrden, equipos, fotos } = datos;

  const calBadge = { A: '#166534', B: '#1d4ed8', C: '#92400e' };
  const calBg    = { A: '#dcfce7', B: '#dbeafe', C: '#fef3c7' };
  const calLabel = { A: 'Excelente', B: 'Bueno', C: 'Regular' };
  const cal      = orden.strcalificacion;

  const tipoLabel = {
    inspeccion:    'Inspección',
    mantenimiento: 'Mantenimiento',
    instalacion:   'Instalación',
  }[orden.strtipo] || (orden.strtipo || 'Inspección');

  const lider = personal.find(p => p.boolider);
  const reporte = reportesOrden[0] || {};

  const filasEquipos = equipos.map((eq, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${val(eq.strtipoequipo)}</td>
      <td>${val(eq.strserial)}</td>
      <td>${val(eq.strpotencia)}</td>
      <td>${val(eq.strmarca)}</td>
      <td>${val(eq.strcaf)}</td>
    </tr>`).join('');

  const bloquesEquipos = equipos.map(eq => {
    const fotosEquipo = fotos.filter(f => f.strtipoequipo === eq.strtipoequipo);
    const fotosHTML = fotosEquipo.length ? `
      <div class="fotos-grid">
        ${fotosEquipo.map(f => `
          <div class="foto-item">
            ${f.base64
              ? `<img src="${f.base64}" alt="${f.stretiqueta || ''}"/>`
              : '<div class="foto-placeholder">Sin imagen</div>'}
            <p class="foto-label">${f.stretiqueta || 'Foto'}${f.dbllatitud
              ? `<br><span class="gps">GPS: ${Number(f.dbllatitud).toFixed(5)}, ${Number(f.dbllongitud).toFixed(5)}</span>`
              : ''}</p>
          </div>`).join('')}
      </div>` : '';

    const actividades = (eq.stractividades || '').split('\n')
      .filter(l => l.trim())
      .map(l => `<li>${l.replace(/^-\s*/, '')}</li>`)
      .join('') || '<li>Sin actividades registradas</li>';

    return `
      <div class="equipment-block">
        <div class="equipment-header"><h4>${val(eq.strtipoequipo)}</h4></div>
        <div class="field" style="padding:12px 14px 0">
          <label>Actividades / observaciones</label>
          <ul class="actividades-list">${actividades}</ul>
        </div>
        ${eq.strdesviaciones ? `
        <div class="field" style="padding:8px 14px 0">
          <label>Desviaciones</label>
          <div class="value-display desviacion">${eq.strdesviaciones}</div>
        </div>` : ''}
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;padding:10px 14px">
          <div><span class="mini-label">Estado general</span><span class="mini-val">${val(eq.strestadogeneral)}</span></div>
          <div><span class="mini-label">Técnico</span><span class="mini-val">${val(eq.tecnico)}</span></div>
          <div><span class="mini-label">Fecha envío</span><span class="mini-val">${val(eq.dtfechaenvio)}</span></div>
        </div>
        ${fotosHTML}
      </div>`;
  }).join('') || '<p class="empty">Sin reportes de equipos registrados.</p>';

  const liderHTML = lider ? `
    <div class="grid" style="grid-template-columns:1fr 1fr;gap:14px">
      ${campoDisplay('Nombre', lider.nombre)}
      ${campoDisplay('Cargo', 'Técnico Líder')}
      ${campoDisplay('Fecha', orden.dtfecha)}
    </div>` : '<p class="empty">Sin líder asignado.</p>';

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<style>
  :root {
    --primary: #16324f;
    --secondary: #f4f7fb;
    --border: #c8d3df;
    --text: #1f2937;
    --muted: #6b7280;
    --danger: #b91c1c;
    --success: #166534;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; background: #fff; color: var(--text); font-size: 13px; line-height: 1.45; }

  .page { max-width: 1100px; margin: 0 auto; background: #fff; }

  /* Header */
  .header { background: linear-gradient(135deg, var(--primary), #274c77); color: #fff; padding: 24px 28px; }
  .header-top { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; }
  .title { font-size: 26px; font-weight: 700; margin: 0 0 5px; }
  .subtitle { margin: 0; opacity: .9; font-size: 13px; }
  .doc-code { min-width: 200px; text-align: right; font-size: 13px; background: rgba(255,255,255,.1);
              padding: 11px 13px; border-radius: 10px; border: 1px solid rgba(255,255,255,.18); line-height: 1.7; }

  /* Calificación banner */
  .cal-banner { display: flex; align-items: center; gap: 14px; padding: 12px 28px;
                border-bottom: 1px solid var(--border); }
  .cal-circle { width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center;
                justify-content: center; font-size: 20px; font-weight: 900; flex-shrink: 0; }
  .cal-text { font-size: 14px; font-weight: 700; }
  .cal-obs  { font-size: 12px; color: var(--muted); margin-top: 2px; }

  /* Content */
  .content { padding: 20px 28px 32px; }

  .section { margin-top: 20px; border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
  .section-title { background: var(--secondary); color: var(--primary); padding: 10px 15px;
                   font-size: 13px; font-weight: 700; border-bottom: 1px solid var(--border);
                   text-transform: uppercase; letter-spacing: .4px; }
  .section-body { padding: 14px 15px; }

  .grid { display: grid; gap: 12px; }
  .grid-3 { grid-template-columns: repeat(3, 1fr); }
  .grid-2 { grid-template-columns: repeat(2, 1fr); }

  .field { display: flex; flex-direction: column; gap: 5px; }
  .field label { font-size: 12px; font-weight: 700; color: var(--primary); }
  .value-display { border: 1px solid var(--border); border-radius: 8px; padding: 9px 11px;
                   font-size: 13px; color: var(--text); background: #fafbfd; min-height: 38px; }
  .value-display.desviacion { background: #fff5f5; border-color: #fca5a5; color: var(--danger); }

  /* Radio display */
  .radio-display { display: flex; gap: 16px; padding: 6px 0; }
  .radio-opt { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: var(--text); }
  .radio-dot { width: 16px; height: 16px; border-radius: 50%; border: 2px solid var(--border); display: flex; align-items: center; justify-content: center; }
  .radio-dot.active { border-color: var(--primary); background: var(--primary); }
  .radio-dot.active::after { content: ''; width: 7px; height: 7px; border-radius: 50%; background: #fff; }

  /* Equipment table */
  table { width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 13px; }
  th, td { border: 1px solid var(--border); padding: 9px 10px; text-align: left; vertical-align: middle; }
  th { background: #f8fafc; color: var(--primary); font-size: 12px; text-transform: uppercase; letter-spacing: .3px; font-weight: 700; }

  /* Equipment blocks */
  .equipment-block { border: 1px solid var(--border); border-radius: 10px; padding: 0 0 12px; margin-bottom: 12px; background: #fcfdff; overflow: hidden; }
  .equipment-header { background: var(--primary); padding: 9px 14px; }
  .equipment-header h4 { margin: 0; font-size: 14px; color: #fff; }

  .actividades-list { margin: 6px 0 10px 18px; color: var(--text); line-height: 1.7; }
  .actividades-list li { font-size: 13px; }

  .mini-label { display: block; font-size: 11px; color: var(--muted); font-weight: 600; text-transform: uppercase; letter-spacing: .3px; margin-bottom: 2px; }
  .mini-val   { font-size: 13px; font-weight: 600; color: var(--text); }

  /* Fotos */
  .fotos-grid { display: flex; flex-wrap: wrap; gap: 8px; padding: 10px 14px; background: #f9fafb; border-top: 1px solid var(--border); }
  .foto-item  { width: 220px; }
  .foto-item img { width: 220px; height: 170px; object-fit: cover; border-radius: 6px; border: 1px solid var(--border); display: block; }
  .foto-placeholder { width: 220px; height: 170px; background: #e5e7eb; border-radius: 6px;
                      display: flex; align-items: center; justify-content: center; color: #9ca3af; font-size: 12px; }
  .foto-label { font-size: 10px; color: var(--muted); margin-top: 4px; text-align: center; line-height: 1.4; }
  .gps { color: #9ca3af; font-size: 9px; }

  /* Signature box */
  .signature-box { border: 1px dashed var(--border); border-radius: 10px; padding: 14px; background: #fbfcfe; }

  /* Conclusion */
  .conclusion-box { border: 1px solid var(--border); border-radius: 8px; padding: 14px 15px;
                    font-size: 13px; color: var(--text); background: #fafbfd; white-space: pre-wrap;
                    line-height: 1.65; min-height: 80px; }

  .empty { color: var(--muted); font-style: italic; font-size: 12px; padding: 4px 0; }

  .footer { text-align: center; font-size: 11px; color: var(--muted); padding: 14px 28px 10px;
            border-top: 1px solid var(--border); margin-top: 20px; }

  @media print {
    body { background: #fff; }
    .page { max-width: 100%; box-shadow: none; }
  }
</style>
</head>
<body>
<div class="page">

  <div class="header">
    <div class="header-top">
      <div>
        <h1 class="title">Reporte de ${tipoLabel}</h1>
        <p class="subtitle">Área Eléctrica PCA — Documento generado automáticamente</p>
      </div>
      <div class="doc-code">
        <div><strong>Código:</strong> QA/QC-B61-2018</div>
        <div><strong>Tipo:</strong> ${tipoLabel}</div>
        <div><strong>Orden #:</strong> ${orden.idorden}</div>
        <div><strong>Generado:</strong> ${new Date().toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
        ${cal ? `<div><strong>Calificación:</strong> ${cal} — ${calLabel[cal] || cal}</div>` : ''}
      </div>
    </div>
  </div>

  ${cal ? `
  <div class="cal-banner">
    <div class="cal-circle" style="background:${calBg[cal]};color:${calBadge[cal]}">${cal}</div>
    <div>
      <div class="cal-text" style="color:${calBadge[cal]}">Calificación: ${calLabel[cal] || cal}</div>
      <div class="cal-obs">${orden.strobservacionevaluacion ? `Observación: ${orden.strobservacionevaluacion}` : 'Sin observación de evaluación registrada'}</div>
    </div>
  </div>` : ''}

  <div class="content">

    <!-- 1. Datos generales -->
    <div class="section">
      <div class="section-title">1. Datos generales</div>
      <div class="section-body">
        <div class="grid grid-3">
          ${campoDisplay('Fecha de ' + tipoLabel.toLowerCase(), val(orden.dtfecha))}
          ${campoDisplay('Sitio de ' + tipoLabel.toLowerCase(), val(orden.strsitio))}
          ${campoDisplay('Contratista', val(orden.strcontratista))}
          ${campoDisplay('Subcontratista', val(orden.strsubcontratista))}
          ${campoDisplay('Orden de compra', val(orden.strordencompra))}
          <div class="field">
            <label>Trabajo terminado</label>
            <div class="radio-display">
              <div class="radio-opt">
                <div class="radio-dot ${orden.strterminado === 'si' ? 'active' : ''}"></div> Sí
              </div>
              <div class="radio-opt">
                <div class="radio-dot ${orden.strterminado === 'no' ? 'active' : ''}"></div> No
              </div>
            </div>
          </div>
        </div>
        <div style="margin-top:12px">
          ${campoDisplay('Personal asignado', personal.map(p => `${p.nombre}${p.boolider ? ' (Líder)' : ''}`).join(' · ') || '—')}
        </div>
      </div>
    </div>

    <!-- 2. Equipos inspeccionados -->
    <div class="section">
      <div class="section-title">2. Equipos inspeccionados</div>
      <div class="section-body">
        ${equipos.length ? `
        <table>
          <thead>
            <tr>
              <th style="width:50px">N°</th>
              <th>Equipo</th>
              <th>Serial</th>
              <th>Potencia</th>
              <th>Marca</th>
              <th>CAF</th>
            </tr>
          </thead>
          <tbody>${filasEquipos}</tbody>
        </table>` : '<p class="empty">Sin equipos registrados.</p>'}
      </div>
    </div>

    <!-- 3. Observaciones y desviaciones -->
    <div class="section">
      <div class="section-title">3. Observaciones y desviaciones</div>
      <div class="section-body">
        <div class="grid grid-3" style="margin-bottom:12px">
          <div class="field">
            <label>Existe desviación</label>
            <div class="radio-display">
              ${['Si','No','PNC'].map(op => `
              <div class="radio-opt">
                <div class="radio-dot ${reporte.strdesviaciongeneral === op ? 'active' : ''}"></div> ${op}
              </div>`).join('')}
            </div>
          </div>
          ${campoDisplay('Estado de la orden', val(orden.strestado?.toUpperCase()))}
          ${campoDisplay('Fecha de creación', val(orden.dtfechacreacion))}
        </div>
        ${reporte.strdesviaciones ? `
        <div class="field" style="margin-bottom:10px">
          <label>Desviaciones encontradas</label>
          <div class="value-display desviacion">${reporte.strdesviaciones}</div>
        </div>` : ''}
        ${reporte.strconclusiongeneral ? `
        <div class="field">
          <label>Conclusión / Observaciones generales</label>
          <div class="value-display">${reporte.strconclusiongeneral}</div>
        </div>` : ''}
      </div>
    </div>

    <!-- 4. Actividades recomendadas por equipo -->
    <div class="section">
      <div class="section-title">4. Actividades recomendadas por equipo</div>
      <div class="section-body">
        ${bloquesEquipos}
      </div>
    </div>

    <!-- 5. Conclusión -->
    <div class="section">
      <div class="section-title">5. Conclusión</div>
      <div class="section-body">
        <div class="field">
          <label>Conclusión general</label>
          <div class="conclusion-box">${reporte.strconclusiongeneral || '—'}</div>
        </div>
      </div>
    </div>

    <!-- 6. Firmas y responsables -->
    <div class="section">
      <div class="section-title">6. Firmas y responsables</div>
      <div class="section-body">
        <div class="grid grid-2" style="gap:16px">
          <div class="signature-box">
            <p style="font-size:12px;font-weight:700;color:var(--primary);margin-bottom:10px">Técnico líder</p>
            ${liderHTML}
            <div style="border-top:1px dashed var(--border);margin-top:28px;padding-top:6px;text-align:center;font-size:11px;color:var(--muted)">Firma</div>
          </div>
          <div class="signature-box">
            <p style="font-size:12px;font-weight:700;color:var(--primary);margin-bottom:10px">Supervisor / Representante</p>
            <div class="grid" style="gap:10px">
              ${campoDisplay('Nombre', '')}
              ${campoDisplay('Cargo', '')}
              ${campoDisplay('Fecha', '')}
            </div>
            <div style="border-top:1px dashed var(--border);margin-top:28px;padding-top:6px;text-align:center;font-size:11px;color:var(--muted)">Firma</div>
          </div>
        </div>
      </div>
    </div>

  </div>

  <div class="footer">
    Documento generado automáticamente &nbsp;·&nbsp; Área Eléctrica PCA &nbsp;·&nbsp; Orden #${orden.idorden}
  </div>

</div>
</body>
</html>`;
}

module.exports.GenerarPDFReporte = async function (idorden) {
  const datos = await obtenerDatosReporte(idorden);
  if (!datos) return { success: false, mensaje: 'Orden no encontrada' };

  const html = generarHTML(datos);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfData = await page.pdf({
      format: 'A4',
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
      printBackground: true,
    });
    const pdfBuffer = Buffer.isBuffer(pdfData) ? pdfData : Buffer.from(pdfData);
    return { success: true, buffer: pdfBuffer, filename: `reporte_orden_${idorden}.pdf` };
  } finally {
    await browser.close();
  }
};
