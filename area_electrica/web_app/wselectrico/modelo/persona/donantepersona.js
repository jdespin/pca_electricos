const sql = require('pg')
var os = require('os');
const { Client } = require('pg');
const { execCentralizada, execCentralizadaProcedimientos, execTransaccion } = require('../../config/execSQLCentralizada.helper');



module.exports.ListadoSolicitudDonante = async function (idTipoSolicitud, solicitud_blestado) {
  var sentencia;
  sentencia = 'SELECT * FROM central.f_central_persona_donante($1, $2, $3, $4)'
  var listaParametros = ['LIST', null, idTipoSolicitud, solicitud_blestado]
  try {

    if (sentencia != "") {
      const resp = await execCentralizadaProcedimientos(sentencia, listaParametros, "OK", "OK");

      return (resp)
    } else {
      return { data: "vacio sql" }
    }
  } catch (error) {
    return { data: "Error: " + error }
  }
}

module.exports.NuevaSolicitudPersona = async function (client, objSolicitud) {
  var sentencia;
  sentencia = 'SELECT * FROM central.f_central_solicitud_persona_donante($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)';
  var listaParametros = ['IN', null, objSolicitud.idtiposolicitud, objSolicitud.idpersona, null, objSolicitud.solicitud_strdescripcion, 'ND', null, null, null];

  try {
    return await execTransaccion(client, sentencia, listaParametros, "Persona insertada", "No se pudo insertar el donante");
  } catch (error) {
    await rollbackTransaccion(client);
    console.error("Error en la transacción:", error.message || error);

    return {
      success: false,
      mensaje: `Error en la transacción: ${error.message || "Error desconocido"}`
    };
  }
};

module.exports.ActualizarEstadoSolicitudPersona = async function (client, idSolicitud, idTipoSolicitud) {
  var sentencia;
  sentencia = 'SELECT * FROM central.f_central_solicitud_persona_donante($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)'
  var listaParametros = ['UPTS', idSolicitud, idTipoSolicitud, null, null, null, null, null, null, null]
  try {
    return await execTransaccion(client, sentencia, listaParametros, "Cita asignada", "No se pudo actualizar la cita");
  } catch (error) {
    await rollbackTransaccion(client);
    console.error("Error en la transacción:", error.message || error);

    return {
      success: false,
      mensaje: `Error en la transacción: ${error.message || "Error desconocido"}`
    };
  }
}

module.exports.ObtenerSolicitudPersonaActivo = async function (idtiposolicitud, idPersona) {
  var sentencia;
  sentencia = 'SELECT * FROM central.f_central_solicitud_persona_donante($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)'
  var listaParametros = ['ACTIVO', null, idtiposolicitud, idPersona, null, null, null, null, null, null]
  try {

    if (sentencia != "") {
      const resp = await execCentralizadaProcedimientos(sentencia, listaParametros, "OK", "OK");

      return (resp)
    } else {
      return { data: "vacio sql" }
    }
  } catch (error) {
    return { data: "Error: " + error }
  }
}

module.exports.ActualizarCitaDonante = async function (client, idSolicitud, strCita) {
  var sentencia;
  sentencia = 'SELECT * FROM central.f_central_solicitud_persona_donante($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)'
  var listaParametros = ['UP', idSolicitud, null, null, strCita, null, null, null, null, null]
  try {

    if (sentencia != "") {
      const resp = await execTransaccion(client, sentencia, listaParametros, "Cita actualizada", "No se pudo actualizar la cita");
      return (resp)
    } else {
      return { data: "vacio sql" }
    }
  } catch (error) {
    return { data: "Error al actualizar la cita del donante: " + error }
  }
}
