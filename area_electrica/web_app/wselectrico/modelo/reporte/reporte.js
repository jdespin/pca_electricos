const { iniciarTransaccion, commitTransaccion, rollbackTransaccion } = require('../../procesos/transacciones');
const { execCentralizadaProcedimientos } = require('../../config/execSQLCentralizada.helper');

module.exports.SincronizarReporte = async function (objSync) {
  const client = await iniciarTransaccion();
  try {
    const {
      idorden,
      idusuario,
      reporteOrden,
      reportesEquipo,
      fotosEquipo,
    } = objSync;

    
    await client.query(
      `DELETE FROM public.tb_reporte_orden  WHERE idorden=$1 AND idusuario=$2`,
      [idorden, idusuario]
    );
    await client.query(
      `DELETE FROM public.tb_reporte_equipo WHERE idorden=$1 AND idusuario=$2`,
      [idorden, idusuario]
    );
    await client.query(
      `DELETE FROM public.tb_foto_equipo    WHERE idorden=$1 AND idusuario=$2`,
      [idorden, idusuario]
    );

    
    if (reporteOrden) {
      await client.query(
        `INSERT INTO public.tb_reporte_orden
           (idorden, idusuario, strdesviaciongeneral, strconclusiongeneral, strterminado)
         VALUES ($1,$2,$3,$4,$5)`,
        [
          idorden,
          idusuario,
          reporteOrden.desviacionGeneral  || '',
          reporteOrden.conclusionGeneral  || '',
          reporteOrden.terminado          || '',
        ]
      );
    }

    
    for (const re of (reportesEquipo || [])) {
      await client.query(
        `INSERT INTO public.tb_reporte_equipo
           (idorden, idusuario, strtipoequipo,
            strpotencia, strserial, strmarca, strcaf,
            strestadogeneral, stractividades, strdesviaciones)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [
          idorden,
          idusuario,
          re.tipoequipo      || '',
          re.potencia        || '',
          re.serial          || '',
          re.marca           || '',
          re.caf             || '',
          re.estadoGeneral   || '',
          re.actividades     || '',
          re.desviaciones    || '',
        ]
      );
    }

    
    for (const foto of (fotosEquipo || [])) {
      if (!foto.base64) continue;
      const buffer = Buffer.from(foto.base64, 'base64');
      await client.query(
        `INSERT INTO public.tb_foto_equipo
           (idorden, idusuario, strtipoequipo, stretiqueta, boolobligatoria,
            bytfoto, strfilename, strmimetype, dbllatitud, dbllongitud)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [
          idorden,
          idusuario,
          foto.tipoequipo  || '',
          foto.etiqueta    || '',
          foto.obligatoria === true,
          buffer,
          foto.filename    || 'foto.jpg',
          foto.mimetype    || 'image/jpeg',
          foto.latitude    ?? null,
          foto.longitude   ?? null,
        ]
      );
    }

    
    const terminadoNorm = (reporteOrden?.terminado ?? '').toLowerCase();
    await client.query(
      `UPDATE public.tb_orden_trabajo SET strestado='finalizada', strterminado=$2 WHERE idorden=$1`,
      [idorden, terminadoNorm]
    );

    
    const resOrden = await client.query(
      `SELECT ot.idusuariocreador,
              per.strnombres || ' ' || per.strapellidos AS nombre_tecnico
       FROM public.tb_orden_trabajo ot
       JOIN seguridad.tb_usuario u   ON u.idusuario = $2
       JOIN central.tb_persona  per ON per.idpersona = u.usuario_idpersona
       WHERE ot.idorden = $1`,
      [idorden, idusuario]
    );
    const supervisor = resOrden.rows[0];
    if (supervisor?.idusuariocreador && supervisor.idusuariocreador !== idusuario) {
      await client.query(
        `INSERT INTO public.tb_notificacion (idusuario, idorden, strtitulo, strmensaje)
         VALUES ($1, $2, $3, $4)`,
        [
          supervisor.idusuariocreador,
          idorden,
          'Reporte técnico recibido',
          `${supervisor.nombre_tecnico} ha enviado el reporte de la orden #${idorden}. La orden está lista para evaluación.`,
        ]
      );
    }

    await commitTransaccion(client);
    return { success: true, mensaje: 'Reporte sincronizado correctamente' };
  } catch (error) {
    await rollbackTransaccion(client);
    console.error('Error SincronizarReporte:', error);
    return { success: false, mensaje: error.message };
  }
};

module.exports.ListarReportes = async function () {
  const SQL = `
    SELECT
      o.idorden,
      o.strtipo,
      o.strcontratista,
      o.strsubcontratista,
      o.strsitio,
      o.strestado,
      to_char(o.dtfecha, 'YYYY-MM-DD') AS dtfecha,
      COUNT(DISTINCT ro.idusuario)           AS nro_tecnicos,
      COUNT(DISTINCT re.idreporteequipo)     AS nro_equipos,
      COUNT(DISTINCT fe.idfotoequipo)        AS nro_fotos_equipo,
      MAX(ro.dtfechaenvio)                   AS ultima_actualizacion
    FROM public.tb_orden_trabajo o
    LEFT JOIN public.tb_reporte_orden  ro ON ro.idorden = o.idorden
    LEFT JOIN public.tb_reporte_equipo re ON re.idorden = o.idorden
    LEFT JOIN public.tb_foto_equipo    fe ON fe.idorden = o.idorden
    WHERE ro.idreporte IS NOT NULL
    GROUP BY o.idorden, o.strtipo, o.strcontratista, o.strsubcontratista, o.strsitio, o.strestado, o.dtfecha
    ORDER BY ultima_actualizacion DESC NULLS LAST
  `;
  const resp = await execCentralizadaProcedimientos(SQL, [], 'OK', 'Error');
  return { success: true, datos: resp.data ?? [] };
};

module.exports.DetalleReporte = async function (idorden) {
  const sqlOrden = `
    SELECT o.idorden, o.strtipo, o.strcontratista, o.strsubcontratista,
           o.strsitio, o.strordencompra, o.strestado,
           o.strcalificacion, o.strobservacionevaluacion,
           to_char(o.dtfecha,'DD/MM/YYYY') AS dtfecha,
           to_char(o.dtfechacreacion,'DD/MM/YYYY HH24:MI') AS dtfechacreacion
    FROM public.tb_orden_trabajo o WHERE o.idorden = $1
  `;

  const sqlReportesOrden = `
    SELECT
      ro.idreporte,
      ro.idusuario,
      per.strnombres || ' ' || per.strapellidos AS tecnico,
      ro.strdesviaciongeneral,
      ro.strconclusiongeneral,
      LOWER(ro.strterminado) AS strterminado,
      to_char(ro.dtfechaenvio,'DD/MM/YYYY HH24:MI') AS dtfechaenvio
    FROM public.tb_reporte_orden ro
    JOIN seguridad.tb_usuario u  ON u.idusuario = ro.idusuario
    JOIN central.tb_persona per  ON per.idpersona = u.usuario_idpersona
    WHERE ro.idorden = $1
    ORDER BY ro.dtfechaenvio DESC
  `;

  const sqlReportesEquipo = `
    SELECT
      re.idreporteequipo,
      re.idusuario,
      per.strnombres || ' ' || per.strapellidos AS tecnico,
      re.strtipoequipo,
      re.strpotencia,
      re.strserial,
      re.strmarca,
      re.strcaf,
      re.strestadogeneral,
      re.stractividades,
      re.strdesviaciones,
      to_char(re.dtfechaenvio,'DD/MM/YYYY HH24:MI') AS dtfechaenvio
    FROM public.tb_reporte_equipo re
    JOIN seguridad.tb_usuario u  ON u.idusuario = re.idusuario
    JOIN central.tb_persona per  ON per.idpersona = u.usuario_idpersona
    WHERE re.idorden = $1
    ORDER BY re.strtipoequipo, re.dtfechaenvio DESC
  `;

  const sqlFotosEquipo = `
    SELECT idfotoequipo, idusuario, strtipoequipo, stretiqueta, boolobligatoria,
           strfilename, strmimetype, dbllatitud, dbllongitud,
           to_char(dtfechacreacion,'DD/MM/YYYY HH24:MI') AS dtfechacreacion
    FROM public.tb_foto_equipo
    WHERE idorden = $1
    ORDER BY strtipoequipo, stretiqueta, dtfechacreacion
  `;

  const [rOrden, rRepOrden, rRepEquipo, rFotosEquipo] = await Promise.all([
    execCentralizadaProcedimientos(sqlOrden,          [idorden], 'OK', 'Error'),
    execCentralizadaProcedimientos(sqlReportesOrden,  [idorden], 'OK', 'Error'),
    execCentralizadaProcedimientos(sqlReportesEquipo, [idorden], 'OK', 'Error'),
    execCentralizadaProcedimientos(sqlFotosEquipo,    [idorden], 'OK', 'Error'),
  ]);

  const orden = (rOrden.data ?? [])[0] ?? null;
  if (!orden) return { success: false, mensaje: 'Orden no encontrada' };

  return {
    success: true,
    dato: {
      ...orden,
      reportesOrden:  rRepOrden.data  ?? [],
      reportesEquipo: rRepEquipo.data ?? [],
      fotosEquipo:    rFotosEquipo.data ?? [],
    },
  };
};

module.exports.ObtenerFotoEquipo = async function (idfotoequipo) {
  const SQL = `SELECT bytfoto, strmimetype FROM public.tb_foto_equipo WHERE idfotoequipo = $1`;
  const resp = await execCentralizadaProcedimientos(SQL, [idfotoequipo], 'OK', 'Error');
  const row = (resp.data ?? [])[0];
  if (!row || !row.bytfoto) return { success: false, mensaje: 'Foto no encontrada' };
  const base64 = Buffer.from(row.bytfoto).toString('base64');
  return { success: true, base64, mimetype: row.strmimetype };
};

module.exports.ObtenerFotosOrden = async function (idorden) {
  const SQL = `
    SELECT idfotoequipo, strfilename, strmimetype, bytfoto,
           strtipoequipo, stretiqueta
    FROM public.tb_foto_equipo
    WHERE idorden = $1
    ORDER BY strtipoequipo, stretiqueta, idfotoequipo
  `;
  const resp = await execCentralizadaProcedimientos(SQL, [idorden], 'OK', 'Error');
  return { success: true, fotos: resp.data ?? [] };
};
