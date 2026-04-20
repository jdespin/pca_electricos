const { Pool } = require('pg');
const { execCentralizadaProcedimientos } = require('../../config/execSQLCentralizada.helper.js');
const CONFIGCENTRALIZADA = require('../../config/databaseCentral.js'); 


const iniciarPoolCentralizada = async (db) => {
  try {
    const conex = { ...CONFIGCENTRALIZADA, database: db };
    const pool = new Pool(conex);
    return pool;
  } catch (error) {
    throw error;
  }
};

module.exports.ListadoRolTodos = async function () {
  const sentencia = 'SELECT * FROM seguridad.f_central_tb_rol($1, $2, $3, $4, $5 ,$6, $7)';
  const listaParametros = ['TODO', null, null, null, null, null, null];

  try {
    if (sentencia) {
      const resp = await execCentralizadaProcedimientos(sentencia, listaParametros, "OK", "OK");
      return resp;
    } else {
      return { data: "vacio sql" };
    }
  } catch (error) {
    return { data: "Error: " + error };
  }
};

module.exports.ListadoRolActivos = async function () {
  const sentencia = 'SELECT * FROM seguridad.f_central_tb_rol($1, $2, $3, $4, $5 ,$6, $7)';
  const listaParametros = ['TODO', null, null, null, null, true, null];

  try {
    if (sentencia) {
      const resp = await execCentralizadaProcedimientos(sentencia, listaParametros, "OK", "OK");
      return resp;
    } else {
      return { data: "vacio sql" };
    }
  } catch (error) {
    return { data: "Error: " + error };
  }
};

module.exports.CrearRol = async function (objRol) {

  const sentencia = 'SELECT * FROM seguridad.f_central_tb_rol($1, $2, $3, $4, $5 ,$6, $7 )';
  const listaParametros = ['IN', null, objRol.rol_strcodigo, objRol.rol_strnombre, objRol.rol_strdescripcion, null, null];

  try {
    const resp = await execCentralizadaProcedimientos(sentencia, listaParametros, "OK", "OK");
    return resp;
  } catch (error) {
    return { data: "Error: " + error };
  } 
};

module.exports.ActualizarRol = async function (objRol) {


  const sentencia = 'SELECT * FROM seguridad.f_central_tb_rol($1, $2, $3, $4, $5 ,$6, $7)';
  const listaParametros = ['UP', objRol.idrol, objRol.rol_strcodigo, objRol.rol_strnombre, objRol.rol_strdescripcion, null,  null];

  try {


    const resp = await execCentralizadaProcedimientos(sentencia, listaParametros, "OK", "OK");


    return resp;

  } catch (error) {

    return { data: "Error: " + error };
  } 
  
};

module.exports.ActualizarRolEstado = async function (idRol, blestado) {


  const sentencia = 'SELECT * FROM seguridad.f_central_tb_rol($1, $2, $3, $4, $5 ,$6, $7)';
  const listaParametros = ['UPE', idRol, null, null, null, blestado, null];

  try {
    

    const resp = await execCentralizadaProcedimientos(sentencia, listaParametros, "OK", "OK");



    return resp;

  } catch (error) {

    return { data: "Error: " + error };
  } 
};

module.exports.ObtenerRolDadoId = async function (idRol) {
  const sentencia = 'SELECT * FROM seguridad.f_central_tb_rol($1, $2, $3, $4, $5 ,$6, $7)';
  const listaParametros = ['UNO', idRol, null, null, null, null, null];

  try {
    if (sentencia) {
      const resp = await execCentralizadaProcedimientos(sentencia, listaParametros, "OK", "OK");
      return resp;
    } else {
      return { data: "vacio sql" };
    }
  } catch (error) {
    return { data: "Error: " + error };
  }
};

module.exports.EliminarRegistroRol = async function (idRol) {
  const sentencia = 'SELECT * FROM seguridad.f_central_tb_rol($1, $2, $3, $4, $5 ,$6, $7)';
  const listaParametros = ['DEL', idRol, null, null, null, null, null];

  try {
    

    const resp = await execCentralizadaProcedimientos(sentencia, listaParametros, "OK", "OK");

   

    return resp;

  } catch (error) {
    
    return { data: "Error: " + error };
  } 
};
