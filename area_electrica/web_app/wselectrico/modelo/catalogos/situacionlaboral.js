const sql = require('pg')
var os = require('os');
const { Client } = require('pg');
const { execCentralizada, execCentralizadaProcedimientos } = require('../../config/execSQLCentralizada.helper');



module.exports.ListadoSituacionLaboral = async function () {
  var sentencia;
  sentencia = 'SELECT * FROM procesos.f_central_tb_situacion_laboral($1, $2, $3, $4)'
  var listaParametros = ['TODO', null, null, null]
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
module.exports.ObtenerSituacionLaboralDadoId = async function (idSituacion) {
  var sentencia;
  sentencia = 'SELECT * FROM procesos.f_central_tb_situacion_laboral($1, $2, $3, $4)'
  var listaParametros = ['UNO', idSituacion, null, null]
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
module.exports.CrearSituacionLaboral = async function (strnombre) {
  var sentencia;
  sentencia = 'SELECT * FROM procesos.f_central_tb_situacion_laboral($1, $2, $3, $4)'
  var listaParametros = ['IN',null,strnombre,null]
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
module.exports.ActualizarSituacioLaboral = async function (idSituacion, strnombre) {
  var sentencia;
  sentencia = 'SELECT * FROM procesos.f_central_tb_situacion_laboral($1, $2, $3, $4)'
  var listaParametros = ['UP', idSituacion, strnombre, null]
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
module.exports.ActualizarSituacionLaboralEstado = async function (idSituacion, blestado) {
  var sentencia;
  sentencia = 'SELECT * FROM procesos.f_central_tb_situacion_laboral($1, $2, $3, $4)'
  var listaParametros = ['UPE', idSituacion, null, blestado]
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
