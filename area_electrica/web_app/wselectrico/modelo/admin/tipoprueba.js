const sql = require('pg')
var os = require('os');
const { Client } = require('pg');
const { execCentralizada, execCentralizadaProcedimientos } = require('../../config/execSQLCentralizada.helper');


module.exports.ListadoTipoPruebaActivos = async function () {
    var sentencia;
    sentencia = "select * from proceso.tb_tipo_prueba where blestado=true"
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
