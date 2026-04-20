const sql = require('pg')
var os = require('os');
const { Client } = require('pg');
const { execCentralizada, execCentralizadaProcedimientos } = require('../../config/execSQLCentralizada.helper');


module.exports.ListadoCargoActivo = async function () {
    var sentencia;
    sentencia = 'SELECT * FROM central.f_central_cargo($1, $2, $3, $4 ,$5)'
    var listaParametros = ['LSTACTIVO', null, null, null, null]
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
