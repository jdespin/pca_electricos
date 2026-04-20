const { Client } = require('pg');
const CONFIGCENTRALIZADA = require('../../config/databaseCentral');
const { execCentralizadaProcedimientos } = require('../../config/execSQLCentralizada.helper');

module.exports.ObtenerTurnosTecnico = async function (idusuario) {
  const sql = `
    SELECT to_char(dtfecha, 'YYYY-MM-DD') AS dtfecha,
           COALESCE(strtipo, 'TRABAJO')   AS strtipo
    FROM   public.tb_tecnico_turno
    WHERE  idusuario = $1
    ORDER  BY dtfecha
  `;
  try {
    const resp = await execCentralizadaProcedimientos(sql, [idusuario], 'OK', 'OK');
    return resp;
  } catch (error) {
    console.error('[ObtenerTurnosTecnico] error:', error);
    return { data: [] };
  }
};

module.exports.ObtenerTurnosTecnicosHoy = async function () {
  const sql = `
    SELECT idusuario,
           COALESCE(strtipo, 'TRABAJO') AS strtipo
    FROM   public.tb_tecnico_turno
    WHERE  dtfecha = CURRENT_DATE
  `;
  try {
    const resp = await execCentralizadaProcedimientos(sql, [], 'OK', 'OK');
    return resp;
  } catch (error) {
    console.error('[ObtenerTurnosTecnicosHoy] error:', error);
    return { data: [] };
  }
};

module.exports.GuardarTurnosTecnico = async function (idusuario, dias) {
  const client = new Client(CONFIGCENTRALIZADA);
  try {
    await client.connect();
    await client.query('BEGIN');

    await client.query(
      'DELETE FROM public.tb_tecnico_turno WHERE idusuario = $1',
      [idusuario]
    );

    for (const d of (dias || [])) {
      const fecha = typeof d === 'string' ? d : d.fecha;
      const tipo  = (typeof d === 'object' && d.tipo) ? d.tipo : 'TRABAJO';
      await client.query(
        'INSERT INTO public.tb_tecnico_turno (idusuario, dtfecha, strtipo) VALUES ($1, $2, $3)',
        [idusuario, fecha, tipo]
      );
    }

    await client.query('COMMIT');
    return { success: true, mensaje: 'Turnos guardados correctamente.' };
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    console.error('[GuardarTurnosTecnico] error:', error);
    return { success: false, error: error.message };
  } finally {
    await client.end();
  }
};
