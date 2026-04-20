const sql = require('pg')
var os = require('os');
const { Client } = require('pg');
const { execCentralizada, execTransaccion, execCentralizadaProcedimientos } = require('./../config/execSQLCentralizada.helper');


module.exports.ObtenerTerminoVigente = async function (tipo) {
  var sentencia;
  sentencia = "select * from terminos.tb_terminos where blestado=true and idtipo=" + tipo + ""
  try {

    if (sentencia != "") {
      const resp = await execCentralizada(sentencia, "OK", "OK");
      return (resp)
    } else {
      return { data: "vacio sql" }
    }
  } catch (error) {
    return { data: "Error: " + error }
  }

}
module.exports.EncontrarAceptacionTermino = async function (idTerminos, idPersona) {
  var sentencia;
  sentencia = 'SELECT * FROM terminos.f_central_tb_aceptacion($1, $2, $3, $4)'
  var listaParametros = ['UNO', null, idTerminos, idPersona]
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

module.exports.IngresarAceptacionTermino = async function (client, idTerminos, idPersona) {
  var sentencia;
  sentencia = 'SELECT * FROM terminos.f_central_tb_aceptacion($1, $2, $3, $4)'
  var listaParametros = ['IN', null, idTerminos, idPersona]

  try {
    if (client) {
      return await execTransaccion(client, sentencia, listaParametros, "Ingresar aceptación de terminos ", "No se pudo ingresar la aceptación de terminos");
    }
    if (!client && sentencia != "") {
      const resp = await execCentralizadaProcedimientos(sentencia, listaParametros, "OK", "OK");
      return (resp)
    }
  } catch (error) {
    await rollbackTransaccion(client);

    return {
      success: false,
      mensaje: `Error en la transacción: ${error.message || "Error desconocido"}`
    };
  }

}
