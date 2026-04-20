const { iniciarTransaccion, commitTransaccion, rollbackTransaccion } = require('../../procesos/transacciones');
const { execCentralizadaProcedimientos } = require('../../config/execSQLCentralizada.helper');

module.exports.CrearOrdenTrabajo = async function (objOrden) {
  const client = await iniciarTransaccion();
  try {
    const {
      strtipo, strcontratista, strsubcontratista, strterminado,
      strsitio, strordencompra, dtfecha, idusuariocreador, personal
    } = objOrden;


    const resOrden = await client.query(
      `INSERT INTO public.tb_orden_trabajo
         (strtipo, strcontratista, strsubcontratista, strterminado, strsitio, strordencompra, dtfecha, strestado, idusuariocreador)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'proceso',$8)
       RETURNING idorden`,
      [
        strtipo,
        strcontratista     || null,
        strsubcontratista  || null,
        strterminado       || null,
        strsitio           || null,
        strordencompra     || null,
        dtfecha            || null,
        idusuariocreador   || null
      ]
    );

    const idorden = resOrden.rows[0].idorden;

    
    for (const p of (personal || [])) {
      if (!p.idusuario) continue;

      await client.query(
        `INSERT INTO public.tb_orden_personal (idorden, idusuario, boolider) VALUES ($1,$2,$3)`,
        [idorden, p.idusuario, p.boolider === true]
      );

      await client.query(
        `INSERT INTO public.tb_notificacion (idusuario, idorden, strtitulo, strmensaje)
         VALUES ($1,$2,$3,$4)`,
        [
          p.idusuario,
          idorden,
          'Nueva orden de trabajo asignada',
          `Se te ha asignado una nueva orden de ${strtipo} #${idorden}${p.boolider ? ' — eres el líder del grupo.' : '.'}`
        ]
      );
    }

    await commitTransaccion(client);
    return { success: true, idorden, mensaje: 'Orden creada correctamente' };
  } catch (error) {
    await rollbackTransaccion(client);
    console.error('Error CrearOrdenTrabajo:', error);
    return { success: false, mensaje: error.message };
  }
};

module.exports.ObtenerNotificacionesUsuario = async function (idUsuario) {
  const SQL = `
    SELECT
      n.idnotificacion,
      n.idorden,
      n.idequipointerno,
      n.strtitulo,
      n.strmensaje,
      n.boolleida,
      to_char(n.dtfechacreacion, 'YYYY-MM-DD HH24:MI') AS fechacreacion,
      o.strtipo
    FROM public.tb_notificacion n
    LEFT JOIN public.tb_orden_trabajo o ON o.idorden = n.idorden
    WHERE n.idusuario = $1
    ORDER BY n.dtfechacreacion DESC
    LIMIT 50
  `;
  const resp = await execCentralizadaProcedimientos(SQL, [idUsuario], 'OK', 'Error');
  return { success: true, datos: resp.data ?? [] };
};

module.exports.MarcarNotificacionLeida = async function (idnotificacion) {
  const SQL = `UPDATE public.tb_notificacion SET boolleida = TRUE WHERE idnotificacion = $1`;
  await execCentralizadaProcedimientos(SQL, [idnotificacion], 'OK', 'Error');
  return { success: true };
};

module.exports.MarcarTodasNotificacionesLeidas = async function (idUsuario) {
  const SQL = `UPDATE public.tb_notificacion SET boolleida = TRUE WHERE idusuario = $1 AND boolleida = FALSE`;
  await execCentralizadaProcedimientos(SQL, [idUsuario], 'OK', 'Error');
  return { success: true };
};

module.exports.ObtenerOrdenes = async function (estado) {
  let SQL = `
    SELECT
      o.idorden,
      o.strtipo,
      o.strcontratista,
      o.strsubcontratista,
      o.strterminado,
      o.strsitio,
      o.strordencompra,
      o.dtfecha,
      o.strestado,
      o.strcalificacion,
      o.strobservacionevaluacion,
      to_char(o.dtfechacreacion, 'YYYY-MM-DD HH24:MI') AS dtfechacreacion,
      TRIM(COALESCE(per.strnombres,'') || ' ' || COALESCE(per.strapellidos,'')) AS nombresupervisor
    FROM public.tb_orden_trabajo o
    LEFT JOIN seguridad.tb_usuario us ON us.idusuario = o.idusuariocreador
    LEFT JOIN central.tb_persona per ON per.idpersona = us.usuario_idpersona
  `;
  const params = [];
  if (estado) {
    SQL += ` WHERE o.strestado = $1`;
    params.push(estado);
  }
  SQL += ` ORDER BY o.dtfechacreacion DESC`;
  const resp = await execCentralizadaProcedimientos(SQL, params, 'OK', 'Error');
  return { success: true, datos: resp.data ?? [] };
};

module.exports.DetalleOrden = async function (idorden) {
  const sqlOrden = `
    SELECT
      o.idorden, o.strtipo, o.strcontratista, o.strsubcontratista, o.strterminado,
      o.strsitio, o.strordencompra, o.strestado, o.strcalificacion, o.strobservacionevaluacion, o.dtfecha,
      to_char(o.dtfechacreacion, 'DD/MM/YYYY HH24:MI') AS dtfechacreacion,
      TRIM(COALESCE(per.strnombres,'') || ' ' || COALESCE(per.strapellidos,'')) AS nombresupervisor
    FROM public.tb_orden_trabajo o
    LEFT JOIN seguridad.tb_usuario us ON us.idusuario = o.idusuariocreador
    LEFT JOIN central.tb_persona per ON per.idpersona = us.usuario_idpersona
    WHERE o.idorden = $1
  `;
  const sqlPersonal = `
    SELECT
      u.idusuario,
      per.strnombres || ' ' || per.strapellidos AS nombre,
      op.boolider
    FROM public.tb_orden_personal op
    JOIN seguridad.tb_usuario u ON u.idusuario = op.idusuario
    JOIN central.tb_persona per ON per.idpersona = u.usuario_idpersona
    WHERE op.idorden = $1
    ORDER BY op.boolider DESC
  `;
  const respOrden = await execCentralizadaProcedimientos(sqlOrden, [idorden], 'OK', 'Error');
  const respPersonal = await execCentralizadaProcedimientos(sqlPersonal, [idorden], 'OK', 'Error');
  const orden = (respOrden.data ?? [])[0] ?? null;
  if (!orden) return { success: false, mensaje: 'Orden no encontrada' };
  orden.personal = respPersonal.data ?? [];
  return { success: true, dato: orden };
};

module.exports.CambiarEstadoOrden = async function (idorden, nuevoEstado, calificacion = null, observacion = null) {
  
  const check = await execCentralizadaProcedimientos(
    `SELECT strestado FROM public.tb_orden_trabajo WHERE idorden = $1`,
    [idorden], 'OK', 'Error'
  );
  const estadoActual = (check.data ?? [])[0]?.strestado;
  if (estadoActual === 'evaluada' && nuevoEstado !== 'evaluada') {
    return { success: false, mensaje: 'Una orden evaluada no puede cambiar de estado.' };
  }

  let SQL, params;
  if (calificacion) {
    SQL = `UPDATE public.tb_orden_trabajo SET strestado = $1, strcalificacion = $2, strobservacionevaluacion = $3 WHERE idorden = $4`;
    params = [nuevoEstado, calificacion, observacion || null, idorden];
  } else {
    SQL = `UPDATE public.tb_orden_trabajo SET strestado = $1 WHERE idorden = $2`;
    params = [nuevoEstado, idorden];
  }
  await execCentralizadaProcedimientos(SQL, params, 'OK', 'Error');

  if (nuevoEstado === 'evaluada') {
    try {
      const personalResp = await execCentralizadaProcedimientos(
        `SELECT idusuario FROM public.tb_orden_personal WHERE idorden = $1`,
        [idorden], 'OK', 'Error'
      );
      const tecnicos = personalResp.data ?? [];
      const cal = calificacion ? ` con calificación ${calificacion}` : '';
      const notifMsg = `Tu reporte de la orden #${idorden} ha sido evaluado${cal}. Sincroniza la app para ver los detalles.`;
      for (const tec of tecnicos) {
        await execCentralizadaProcedimientos(
          `INSERT INTO public.tb_notificacion (idusuario, idorden, strtitulo, strmensaje) VALUES ($1, $2, $3, $4)`,
          [tec.idusuario, idorden, 'Orden evaluada', notifMsg],
          'OK', 'Error'
        );
      }
    } catch (_) {}
  }

  return { success: true };
};

module.exports.EliminarOrden = async function (idorden) {
  const check = await execCentralizadaProcedimientos(
    `SELECT strestado FROM public.tb_orden_trabajo WHERE idorden = $1`,
    [idorden], 'OK', 'Error'
  );
  if ((check.data ?? [])[0]?.strestado === 'evaluada') {
    return { success: false, mensaje: 'Una orden evaluada no puede ser eliminada.' };
  }

  const client = await iniciarTransaccion();
  try {
    await client.query(`DELETE FROM public.tb_notificacion WHERE idorden = $1`, [idorden]);
    await client.query(`DELETE FROM public.tb_orden_personal WHERE idorden = $1`, [idorden]);
    await client.query(`DELETE FROM public.tb_orden_trabajo WHERE idorden = $1`, [idorden]);
    await commitTransaccion(client);
    return { success: true };
  } catch (error) {
    await rollbackTransaccion(client);
    return { success: false, mensaje: error.message };
  }
};

module.exports.ObtenerOrdenesUsuario = async function (idusuario, estado) {
  const SQL = `
    SELECT
      o.idorden, o.strtipo, o.strcontratista, o.strsubcontratista, o.strterminado,
      o.strsitio, o.strordencompra, o.dtfecha, o.strestado,
      op.boolider,
      TRIM(COALESCE(per.strnombres,'') || ' ' || COALESCE(per.strapellidos,'')) AS nombresupervisor
    FROM public.tb_orden_trabajo o
    JOIN public.tb_orden_personal op ON op.idorden = o.idorden
    LEFT JOIN seguridad.tb_usuario us ON us.idusuario = o.idusuariocreador
    LEFT JOIN central.tb_persona per ON per.idpersona = us.usuario_idpersona
    WHERE op.idusuario = $1 AND o.strestado = $2
    ORDER BY o.dtfechacreacion DESC
  `;
  const resp = await execCentralizadaProcedimientos(SQL, [idusuario, estado], 'OK', 'Error');
  return { success: true, datos: resp.data ?? [] };
};

module.exports.ObtenerOrdenesEvaluadasUsuario = async function (idusuario) {
  const SQL = `
    SELECT o.idorden, o.strcalificacion, o.strobservacionevaluacion
    FROM public.tb_orden_trabajo o
    JOIN public.tb_orden_personal op ON op.idorden = o.idorden
    WHERE op.idusuario = $1 AND o.strestado = 'evaluada'
  `;
  const resp = await execCentralizadaProcedimientos(SQL, [idusuario], 'OK', 'Error');
  return { success: true, datos: resp.data ?? [] };
};

module.exports.ActualizarOrden = async function (idorden, objOrden) {
  const check = await execCentralizadaProcedimientos(
    `SELECT strestado FROM public.tb_orden_trabajo WHERE idorden = $1`,
    [idorden], 'OK', 'Error'
  );
  if ((check.data ?? [])[0]?.strestado === 'evaluada') {
    return { success: false, mensaje: 'Una orden evaluada no puede ser editada.' };
  }

  const client = await iniciarTransaccion();
  try {
    const { strcontratista, strsubcontratista, strterminado, strsitio, strordencompra, dtfecha, personal } = objOrden;
    await client.query(
      `UPDATE public.tb_orden_trabajo
       SET strcontratista=$1, strsubcontratista=$2, strterminado=$3, strsitio=$4, strordencompra=$5, dtfecha=$6
       WHERE idorden=$7`,
      [strcontratista||null, strsubcontratista||null, strterminado||null, strsitio||null, strordencompra||null, dtfecha||null, idorden]
    );
    await client.query(`DELETE FROM public.tb_orden_personal WHERE idorden=$1`, [idorden]);
    for (const p of (personal || [])) {
      if (!p.idusuario) continue;
      await client.query(
        `INSERT INTO public.tb_orden_personal (idorden, idusuario, boolider) VALUES ($1,$2,$3)`,
        [idorden, p.idusuario, p.boolider === true]
      );
    }
    await commitTransaccion(client);
    return { success: true, mensaje: 'Orden actualizada correctamente' };
  } catch (error) {
    await rollbackTransaccion(client);
    return { success: false, mensaje: error.message };
  }
};
