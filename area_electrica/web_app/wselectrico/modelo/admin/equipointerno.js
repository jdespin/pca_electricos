const { execCentralizadaProcedimientos, execTransaccion } = require('../../config/execSQLCentralizada.helper');

module.exports.IngresarEquipoInterno = async function (client, objEquipo) {
  const sentencia =
    'SELECT * FROM proceso.f_central_equipo_interno($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)';
  const listaParametros = [
    'IN',
    null,
    objEquipo.idtipoprueba,
    objEquipo.strequipo,
    objEquipo.strserie,
    objEquipo.strmarca,
    objEquipo.strdescripcion,
    objEquipo.iddisponibilidad,
    objEquipo.strmodelo,
    objEquipo.strimagen ?? null,
  ];

  try {
    if (client) {
      return await execTransaccion(client, sentencia, listaParametros, "Equipo Registrado", "No se pudo registrar equipo");
    }
    return await execCentralizadaProcedimientos(sentencia, listaParametros, "OK", "OK");
  } catch (error) {
    return { success: false, mensaje: error.message };
  }
};

module.exports.ActualizarEquipoImagen = async function (idequipointerno, strimagen) {
  const sentencia = `
    UPDATE proceso.tb_equipo_interno
       SET strimagen = $1
     WHERE idequipointerno = $2
    RETURNING idequipointerno
  `;
  return await execCentralizadaProcedimientos(
    sentencia, [strimagen, idequipointerno],
    "Imagen actualizada", "No se pudo actualizar imagen"
  );
};

module.exports.ListadoEquiposInternos = async function () {
  const sentencia = 'SELECT * FROM proceso.f_central_equipo_interno($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)';
  const listaParametros = ['TODO', null, null, null, null, null, null, null, null, null];
  try {
    return await execCentralizadaProcedimientos(
      sentencia, listaParametros,
      'Consulta realizada correctamente.',
      'No se pudo listar los equipos internos.'
    );
  } catch (error) {
    return { success: false, mensaje: error?.message || error };
  }
};

module.exports.ActualizarEquiposVencidos = async function () {
  return await execCentralizadaProcedimientos(
    'SELECT proceso.f_actualizar_equipos_vencidos()',
    [],
    'OK',
    'Error al actualizar equipos vencidos'
  );
};

module.exports.RestaurarEquipoCertificado = async function (idequipointerno) {
  return await execCentralizadaProcedimientos(
    'SELECT proceso.f_restaurar_equipo_calibrado($1)',
    [idequipointerno],
    'OK',
    'Error al restaurar equipo'
  );
};

module.exports.EquiposLibres = async function () {
  const sentencia = `
    SELECT e.idequipointerno, e.idtipoprueba, e.strequipo, e.strserie,
           e.strmarca, e.strmodelo, e.strdescripcion, e.strimagen,
           COALESCE(d.strdisponibilidad, 'Libre') AS strdisponibilidad
      FROM proceso.tb_equipo_interno e
      LEFT JOIN proceso.tb_disponibilidad d ON d.iddisponibilidad = e.iddisponibilidad
     WHERE COALESCE(LOWER(d.strdisponibilidad), 'libre') = 'libre' AND e.blestado = TRUE
     ORDER BY e.strequipo ASC
  `;
  return await execCentralizadaProcedimientos(sentencia, [], 'OK', 'Error al listar equipos libres');
};

module.exports.MiEquipoActivo = async function (idusuario) {
  const sentencia = `
    SELECT u.iduso, u.idequipointerno, u.dtfechainicio,
           e.strequipo, e.strserie, e.strmarca, e.strmodelo, e.strimagen
      FROM proceso.tb_uso_equipo u
      JOIN proceso.tb_equipo_interno e ON e.idequipointerno = u.idequipointerno
     WHERE u.idusuario = $1 AND u.blactivo = TRUE
     ORDER BY u.dtfechainicio DESC
  `;
  return await execCentralizadaProcedimientos(sentencia, [idusuario], 'OK', 'Error al obtener equipos activos');
};

module.exports.CambiarDisponibilidad = async function (idequipointerno, strdisponibilidad, idusuario, strnombretecnico) {
  const sentencia = 'SELECT proceso.f_cambiar_disponibilidad_equipo($1,$2,$3,$4)';
  return await execCentralizadaProcedimientos(
    sentencia,
    [idequipointerno, strdisponibilidad, idusuario ?? null, strnombretecnico ?? null],
    'Disponibilidad actualizada',
    'No se pudo cambiar la disponibilidad'
  );
};

module.exports.GetEstadoEquipo = async function (idequipointerno) {
  const sentencia = `
    SELECT e.blestado,
           LOWER(COALESCE(d.strdisponibilidad, 'libre')) AS strdisponibilidad
      FROM proceso.tb_equipo_interno e
      LEFT JOIN proceso.tb_disponibilidad d ON d.iddisponibilidad = e.iddisponibilidad
     WHERE e.idequipointerno = $1
  `;
  return await execCentralizadaProcedimientos(sentencia, [idequipointerno], 'OK', 'Error al obtener estado');
};

module.exports.SetEstadoEquipo = async function (idequipointerno, blestado) {
  const sentencia = `
    UPDATE proceso.tb_equipo_interno SET blestado = $1 WHERE idequipointerno = $2
  `;
  return await execCentralizadaProcedimientos(sentencia, [blestado, idequipointerno], 'OK', 'Error al actualizar estado');
};

module.exports.QueryLibre = async function (sentencia, params) {
  return await execCentralizadaProcedimientos(sentencia, params, 'OK', 'Error en consulta');
};

module.exports.ListadoEquipoPorPrueba = async function (idtipoprueba) {
  const sentencia = 'SELECT * FROM proceso.f_central_equipo_interno($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)';
  const listaParametros = ['EQUIPOSPORPRUEBA', null, idtipoprueba, null, null, null, null, null, null, null];
  try {
    return await execCentralizadaProcedimientos(
      sentencia, listaParametros,
      'Consulta realizada correctamente.',
      'No se pudo listar los equipos por prueba.'
    );
  } catch (error) {
    return { success: false, mensaje: error?.message || error };
  }
};
