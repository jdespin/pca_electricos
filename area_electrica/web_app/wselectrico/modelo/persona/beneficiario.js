const sql = require('pg')
var os = require('os');
const { Client } = require('pg');
const { execCentralizada, execCentralizadaProcedimientos, execTransaccion } = require('../../config/execSQLCentralizada.helper');

module.exports.ListadoTipoBono = async function () {
  var sentencia;
  sentencia = "select * from procesos.tb_tipo_bono"
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
