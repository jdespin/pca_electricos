const sql = require('pg')
var os = require('os');
const { Client } = require('pg');
const { execCentralizada, execCentralizadaProcedimientos } = require('../../config/execSQLCentralizada.helper');



module.exports.ListadoTipoEmpresaActivos = async function () {
    var sentencia;
    sentencia = "select * from central.tb_tipo_empresa where blestadotipo=true"
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

module.exports.ListadoTipoEmpresa = async function () {
    var sentencia;
    sentencia = 'SELECT * FROM central.f_central_tipo_empresa($1, $2, $3, $4,$5)'
    var listaParametros = ['TODO', null, null, null, null]
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



module.exports.ObtenerTipoEmpresaDadoId = async function (idTipoempresa) {
    var sentencia;
    sentencia = 'SELECT * FROM central.f_central_tipo_empresa($1, $2, $3, $4,$5)'
    var listaParametros = ['UNO', idTipoempresa, null, null, null]
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

module.exports.CrearTipoEmpresa = async function (strNombre) {
    var sentencia;
    sentencia = 'SELECT * FROM central.f_central_tipo_empresa($1, $2, $3, $4,$5)'
    var listaParametros = ['IN', null, strNombre, null, null]
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

module.exports.ActualizarTipoEmpresa = async function (idTipoempresa, strNombre) {
    var sentencia;
    sentencia = 'SELECT * FROM central.f_central_tipo_empresa($1, $2, $3, $4,$5)'
    var listaParametros = ['UP', idTipoempresa, strNombre, null, null]
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
module.exports.ActualizarTipoEmpresaEstado = async function (idTipoempresa, blestado) {
    var sentencia;
    sentencia = 'SELECT * FROM central.f_central_tipo_empresa($1, $2, $3, $4,$5)'
    var listaParametros = ['UPE', idTipoempresa, null, blestado, null]
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
