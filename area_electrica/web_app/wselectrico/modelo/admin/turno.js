const { execCentralizadaProcedimientos } = require('../../config/execSQLCentralizada.helper');

module.exports.ListadoTurnoTodos = async function () {
  const sentencia = `SELECT * FROM public.tb_turno ORDER BY idturno`;
  try {
    const resp = await execCentralizadaProcedimientos(sentencia, [], 'OK', 'OK');
    return resp;
  } catch (error) {
    return { data: [] };
  }
};

module.exports.CrearTurno = async function (objTurno) {
  const sentencia = `
    INSERT INTO public.tb_turno
      (strturno, strdescripcion, strhorainicio, strhorafin,
       bllunes, blmartes, blmiercoles, bljueves, blviernes, blsabado, bldomingo, blestado)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    RETURNING *
  `;
  const params = [
    objTurno.strturno,
    objTurno.strdescripcion ?? null,
    objTurno.strhorainicio ?? null,
    objTurno.strhorafin ?? null,
    objTurno.bllunes    ?? false,
    objTurno.blmartes   ?? false,
    objTurno.blmiercoles ?? false,
    objTurno.bljueves   ?? false,
    objTurno.blviernes  ?? false,
    objTurno.blsabado   ?? false,
    objTurno.bldomingo  ?? false,
    objTurno.blestado   ?? true,
  ];
  try {
    const resp = await execCentralizadaProcedimientos(sentencia, params, 'OK', 'OK');
    return resp;
  } catch (error) {
    return { data: [] };
  }
};

module.exports.ActualizarTurno = async function (objTurno) {
  const sentencia = `
    UPDATE public.tb_turno SET
      strturno=$1, strdescripcion=$2, strhorainicio=$3, strhorafin=$4,
      bllunes=$5, blmartes=$6, blmiercoles=$7, bljueves=$8, blviernes=$9, blsabado=$10, bldomingo=$11
    WHERE idturno=$12
    RETURNING *
  `;
  const params = [
    objTurno.strturno,
    objTurno.strdescripcion ?? null,
    objTurno.strhorainicio ?? null,
    objTurno.strhorafin ?? null,
    objTurno.bllunes    ?? false,
    objTurno.blmartes   ?? false,
    objTurno.blmiercoles ?? false,
    objTurno.bljueves   ?? false,
    objTurno.blviernes  ?? false,
    objTurno.blsabado   ?? false,
    objTurno.bldomingo  ?? false,
    objTurno.idturno,
  ];
  try {
    const resp = await execCentralizadaProcedimientos(sentencia, params, 'OK', 'OK');
    return resp;
  } catch (error) {
    return { data: [] };
  }
};

module.exports.ActualizarTurnoEstado = async function (idTurno, blEstado) {
  const sentencia = `UPDATE public.tb_turno SET blestado=$1 WHERE idturno=$2 RETURNING *`;
  try {
    const resp = await execCentralizadaProcedimientos(sentencia, [blEstado, idTurno], 'OK', 'OK');
    return resp;
  } catch (error) {
    return { data: [] };
  }
};
