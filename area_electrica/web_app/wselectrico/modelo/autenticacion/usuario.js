const { Pool } = require('pg');
const { execCentralizada, execCentralizadaProcedimientos,execTransaccion } = require('../../config/execSQLCentralizada.helper');
const bcrypt = require('bcrypt');



module.exports.ListadoUsuarioTodos = async function () {
  const sentencia = 'SELECT * FROM seguridad.f_central_tb_usuario($1, $2, $3, $4, $5, $6, $7, $8, $9)';
  const listaParametros = ['TODO', null, null, null, null, null, null, null, null];

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


module.exports.ListadoUsuarioPersonaTodos = async function () {
  const sentencia = `
    SELECT
      u.idusuario,
      u.usuario_strnombre,
      u.usuario_blestado,
      u.usuario_idpersona,
      p.idpersona,
      p.strcorreo1,
      p.strnombres,
      p.strapellidos,
      p.strcedula,
      p.strcelular1,
      p.strtiposangre,
      COALESCE(
        (
          SELECT json_agg(json_build_object('idrol', r2.idrol, 'rol_strnombre', r2.rol_strnombre))
          FROM seguridad.tb_perfil pf2
          JOIN seguridad.tb_rol r2 ON pf2.idrol = r2.idrol
          WHERE pf2.idusuario = u.idusuario
        ),
        '[]'::json
      ) AS roles
    FROM seguridad.tb_usuario u
    JOIN central.tb_persona p ON u.usuario_idpersona = p.idpersona
    ORDER BY u.idusuario
  `;
  try {
    const resp = await execCentralizadaProcedimientos(sentencia, [], 'OK', 'OK');
    console.log('[ListadoUsuarioPersonaTodos] filas:', resp?.data?.length, '| primer registro:', JSON.stringify(resp?.data?.[0]));
    return resp;
  } catch (error) {
    console.error('[ListadoUsuarioPersonaTodos] error:', error);
    return { data: [] };
  }
};
module.exports.listadoUsuarioActivos = async function () {
  const sentencia = "SELECT * FROM seguridad.tb_usuario WHERE estado = TRUE";

  try {
    if (sentencia) {
      const resp = await execCentralizada(sentencia, "OK", "OK");
      return resp;
    } else {
      return { data: "vacio sql" };
    }
  } catch (error) {
    return { data: "Error: " + error };
  }
};

module.exports.CrearUsuario = async function (client, objUsuario) {
  const sentencia = 'SELECT * FROM seguridad.f_central_tb_usuario($1, $2, $3, $4, $5, $6, $7, $8, $9)';

  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(objUsuario.usuario_strclave, saltRounds);

    const listaParametros = ['IN', null, objUsuario.usuario_strnombre, hashedPassword, null, null, objUsuario.usuario_idpersona, null, null];

    const resp = await execTransaccion(client, sentencia, listaParametros, "OK", "OK");
    return resp;
  } catch (error) {
    return { data: "Error: " + error };
  }
};

module.exports.ActualizarUsuario = async function (objUsuario) {
  const sentencia = 'SELECT * FROM seguridad.f_central_tb_usuario($1, $2, $3, $4, $5, $6, $7, $8, $9)';

  try {
    let hashedPassword = null;

    if (objUsuario.usuario_strclave) {
      const saltRounds = 10;
      hashedPassword = await bcrypt.hash(objUsuario.usuario_strclave, saltRounds);
    }

    const listaParametros = [
      'UP',
      objUsuario.idusuario,
      objUsuario.usuario_strnombre,
      hashedPassword,
      null,
      null,
      objUsuario.usuario_idpersona,
      null,
      null
    ];

    
    const resp = await execCentralizadaProcedimientos(sentencia, listaParametros, "OK", "OK");
    return resp;
  } catch (error) {
    return { data: "Error: " + error };
  }
};


module.exports.ActualizarUsuarioEstado = async function (idUsuario, blestado) {
  const sentencia = 'SELECT * FROM seguridad.f_central_tb_usuario($1, $2, $3, $4, $5, $6, $7, $8, $9)';
  const listaParametros = ['UPE', idUsuario, null, null, blestado, null, null, null, null];
  try {
    const resp = await execCentralizadaProcedimientos(sentencia, listaParametros, "OK", "OK");
    return resp;
  } catch (error) {
    return { data: "Error: " + error };
  } 
};

module.exports.ObtenerUsuarioDadoId = async function (idUsuario) {
  const sentencia = 'SELECT * FROM seguridad.f_central_tb_usuario($1, $2, $3, $4, $5, $6, $7, $8, $9)';
  const listaParametros = ['UNO', idUsuario, null, null, null, null, null, null, null];
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
module.exports.ObtenerUsuarioDadoNombreUsuario = async function (nombreUsuario) {
  const sentencia = 'SELECT * FROM seguridad.f_central_tb_usuario($1, $2, $3, $4, $5, $6, $7, $8, $9)';
  const listaParametros = ['EDU', null, nombreUsuario, null, null, null, null, null, null];
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

module.exports.ObtenerUsuarioDadoCorreoUsuario = async function (correoUsuario) {
  const sentencia = 'SELECT * FROM seguridad.f_central_tb_usuario($1, $2, $3, $4, $5, $6, $7, $8, $9)';
  const listaParametros = ['EDE', null, null, null, null, null, null, correoUsuario, null];
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

module.exports.EliminarRegistroUsuario = async function (idUsuario) {
  const sentencia = 'SELECT * FROM seguridad.f_central_tb_usuario($1, $2, $3, $4, $5, $6, $7, $8, $9)';
  const listaParametros = ['DEL', idUsuario, null, null, null, null, null, null, null];
  try {
    const resp = await execCentralizadaProcedimientos(sentencia, listaParametros, "OK", "OK");
    return resp;
  } catch (error) {
    return { data: "Error: " + error };
  }
};

module.exports.ObtenerPerfilCompleto = async function (idUsuario) {
  const sentencia = `
    SELECT u.idusuario, u.usuario_strnombre,
           p.strnombres, p.strapellidos, p.strcedula,
           p.strcelular1, p.strtiposangre, p.strcorreo1
    FROM seguridad.tb_usuario u
    LEFT JOIN central.tb_persona p ON u.usuario_idpersona = p.idpersona
    WHERE u.idusuario = $1
  `;
  try {
    const resp = await execCentralizadaProcedimientos(sentencia, [idUsuario], 'OK', 'OK');
    return resp;
  } catch (error) {
    return { data: [] };
  }
};

module.exports.CambiarPassword = async function (idUsuario, passwordActual, passwordNueva) {
  try {
    
    const sentenciaGet = `SELECT usuario_strclave FROM seguridad.tb_usuario WHERE idusuario = $1`;
    const resp = await execCentralizadaProcedimientos(sentenciaGet, [idUsuario], 'OK', 'OK');
    const fila = resp?.data?.[0];
    if (!fila) return { success: false, mensaje: 'Usuario no encontrado' };

    
    const coincide = await bcrypt.compare(passwordActual, fila.usuario_strclave);
    if (!coincide) return { success: false, mensaje: 'La contraseña actual no es correcta' };

    
    const saltRounds = 10;
    const nuevoHash = await bcrypt.hash(passwordNueva, saltRounds);
    const sentenciaUp = `UPDATE seguridad.tb_usuario SET usuario_strclave = $1 WHERE idusuario = $2`;
    await execCentralizadaProcedimientos(sentenciaUp, [nuevoHash, idUsuario], 'OK', 'OK');

    return { success: true, mensaje: 'Contraseña actualizada correctamente' };
  } catch (error) {
    return { success: false, mensaje: 'Error interno: ' + error };
  }
};

module.exports.ObtenerRolesDadoId = async function (idUsuario) {
  const sentencia = 'SELECT * FROM seguridad.f_central_obtener_roles_usuario($1)';
  const listaParametros = [idUsuario];
  try {
    const resp = await execCentralizadaProcedimientos(sentencia, listaParametros, "OK", "OK");
    return { data: resp?.data ?? [] };
  } catch (error) {
    return { data: "Error: " + error };
  }
};
