const { Pool } = require('pg');
const { execCentralizadaProcedimientos, execTransaccion } = require('../../config/execSQLCentralizada.helper');




module.exports.ListadoPerfilTodos = async function () {
  const sentencia = 'SELECT * FROM seguridad.f_central_tb_perfil($1, $2, $3, $4, $5)';
  const listaParametros = ['TODO', null, null, null, null];

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

module.exports.ListadoPerfilUsuarioRoles = async function (idusuario) {
  const sentencia = 'SELECT * FROM seguridad.f_central_tb_perfil($1, $2, $3, $4, $5)';
  const listaParametros = ['RUE', null, idusuario, null, null];

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

module.exports.CrearPerfil = async function (client, objPerfil) {
  const sentencia = 'SELECT * FROM seguridad.f_central_tb_perfil($1, $2, $3, $4, $5)';
  const listaParametros = ['IN', objPerfil.idrol, objPerfil.idusuario, null, null];

  try {
    const resp = await execTransaccion(client, sentencia, listaParametros, "OK", "OK");
    return resp;
  } catch (error) {

    return { data: "Error: " + error };
  }
};

module.exports.ActualizarPerfil = async function (objPerfil) {
  const pool = await iniciarPoolCentralizada(CONFIGCENTRALIZADA.database);
  const transaction = await pool.connect();

  const sentencia = 'SELECT * FROM seguridad.f_central_tb_perfil($1, $2, $3, $4, $5)';
  const listaParametros = ['UP', objPerfil.idrol, objPerfil.idusuario, null, null];

  try {
    await transaction.query('BEGIN');
    const resp = await execCentralizadaProcedimientos(sentencia, listaParametros, "OK", "OK", transaction);

    await transaction.query('COMMIT');
    return resp;
  } catch (error) {
    await transaction.query('ROLLBACK');
    return { data: "Error: " + error };
  } finally {
    transaction.release();
    await pool.end();
  }
};

module.exports.ActualizarPerfilesEstado = async function (objPerfil) {

  try {

    const perfiles = objPerfil.objPerfil;
    for (const perfil of perfiles) {
      const sentencia = `SELECT * FROM seguridad.f_central_tb_perfil( $1, $2, $3, $4, $5 )`;
      const listaParametros = [
        'UPE',
        perfil.idrol,
        perfil.idusuario,
        perfil.blestado,
        null,
      ];

      await execCentralizadaProcedimientos(sentencia, listaParametros, "OK", "OK");
    }

    return { success: true, message: 'Perfiles actualizados correctamente' };
  } catch (error) {


    return { success: false, message: 'Error al actualizar los perfiles' };
  }
};

module.exports.EliminarPerfilesDeUsuario = async function (client, idusuario) {
  const sentencia = `DELETE FROM seguridad.tb_perfil WHERE idusuario = $1`;
  try {
    return await execTransaccion(client, sentencia, [idusuario], 'OK', 'OK');
  } catch (error) {
    return { data: 'Error: ' + error };
  }
};

module.exports.EliminarRegistroPerfil = async function (idPerfil) {
  const pool = await iniciarPoolCentralizada(CONFIGCENTRALIZADA.database);
  const transaction = await pool.connect();

  const sentencia = 'SELECT * FROM seguridad.f_central_tb_perfil($1, $2, $3, $4, $5)';
  const listaParametros = ['DEL', idPerfil, null, null, null];

  try {
    await transaction.query('BEGIN');
    const resp = await execCentralizadaProcedimientos(sentencia, listaParametros, "OK", "OK", transaction);
    await transaction.query('COMMIT');
    return resp;
  } catch (error) {
    await transaction.query('ROLLBACK');
    return { data: "Error: " + error };
  } finally {
    transaction.release();
    await pool.end();
  }
};
