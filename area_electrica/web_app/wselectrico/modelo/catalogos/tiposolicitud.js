const sql = require('pg')
var os = require('os');
const { Client } = require('pg');
const { execCentralizada,execCentralizadaProcedimientos } = require('../../config/execSQLCentralizada.helper');



module.exports.ListadoTipoSolicitud = async function () {
    var sentencia;
    sentencia = 'SELECT * FROM central.f_central_tipo_solicitud($1, $2, $3, $4,$5)'
    var listaParametros = ['TODO', null, null, null,null]
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

module.exports.ObtenerTipoSolicitudDadoId = async function (idTipo) {
    var sentencia;
    sentencia = 'SELECT * FROM central.f_central_tipo_solicitud($1, $2, $3, $4)'
    var listaParametros = ['UNO', idTipo, null, null,null]
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

module.exports.CrearTipoSolicitud = async function (strNombre) {
    var sentencia;
    sentencia = 'SELECT * FROM central.f_central_tipo_solicitud($1, $2, $3, $4,$5)'
    var listaParametros = ['IN',null, strNombre, null,null]
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

module.exports.ActualizarTipoSolicitud = async function (idTipo, strNombre) {
    var sentencia;
    sentencia = 'SELECT * FROM central.f_central_tipo_solicitud($1, $2, $3, $4, $5)'
    var listaParametros = ['UP', idTipo, strNombre, null,null]
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

module.exports.ActualizarTipoSolicitudEstado = async function (idTipo, blestado) {
    var sentencia;
    sentencia = 'SELECT * FROM central.f_central_tipo_solicitud($1, $2, $3, $4,$5)'
    var listaParametros = ['UPE', idTipo, null, blestado,null]
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
