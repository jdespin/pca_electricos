const { Pool } = require('pg');
const { execCentralizadaProcedimientos } = require('../../config/execSQLCentralizada.helper.js');
const crypto = require('crypto');
const CONFIGCENTRALIZADA = require('../../config/databaseCentral.js');
require('dotenv').config();
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'abcdefghijklmnopqrstuvwx01234567';
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; 
const bcrypt = require('bcrypt');


const ROLES_WEB = ['administrador', 'supervisor'];
const ROLES_MOVIL = ['administrador', 'supervisor', 'tecnico'];

function normalizarRol(nombre) {
  return (nombre || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function tieneAcceso(roles, rolesPermitidos) {
  return roles.some(r => rolesPermitidos.includes(normalizarRol(r.rol_nombre || r.rol_strnombre)));
}

module.exports.ValidarCredenciales = async function (nombreUsuario, password) {
  const sentencia = `SELECT idusuario AS ouidusuario, usuario_strnombre AS ouusuario_strnombre,
                     usuario_strclave AS ouusuario_strclave, usuario_blestado
                     FROM seguridad.tb_usuario WHERE usuario_strnombre = $1`;
  try {
   const resp = await execCentralizadaProcedimientos(sentencia, [nombreUsuario], "OK", "OK");

    if (resp && resp.data && resp.data.length > 0) {
      const usuario = resp.data[0];
      if (!usuario.usuario_blestado) {
        return { success: false, mensaje: 'Usuario inactivo' };
      }
      const isMatch = await bcrypt.compare(password, usuario.ouusuario_strclave);


      if (isMatch) {
        return {
          success: true,
          idUsuario: usuario.ouidusuario,
          mensaje: 'Credenciales Válidas'
        };
      } else {
        return { success: false, mensaje: 'Contraseña incorrecta' };
      }
    } else {
      return { success: false, mensaje: 'Usuario no encontrado' };
    }
  } catch (error) {
    return { success: false, mensaje: "Error: " + error.message };
  }
};


module.exports.ValidarCredencialesApp = async function (nombreUsuario, password, appType) {
  const sentenciaUsuario = `SELECT idusuario AS ouidusuario, usuario_strnombre AS ouusuario_strnombre,
                            usuario_strclave AS ouusuario_strclave, usuario_blestado
                            FROM seguridad.tb_usuario WHERE usuario_strnombre = $1`;

  try {
    const resp = await execCentralizadaProcedimientos(sentenciaUsuario, [nombreUsuario], "OK", "OK");

    if (!resp || !resp.data || resp.data.length === 0) {
      return { success: false, mensaje: 'Usuario no encontrado' };
    }

    const usuario = resp.data[0];
    if (!usuario.usuario_blestado) {
      return { success: false, mensaje: 'Usuario inactivo' };
    }
    const isMatch = await bcrypt.compare(password, usuario.ouusuario_strclave);

    if (!isMatch) {
      return { success: false, mensaje: 'Contraseña incorrecta' };
    }

    
    const sentenciaRoles = 'SELECT * FROM seguridad.f_central_obtener_roles_usuario($1)';
    const modelousuario = require('./usuario');

    const [respRoles, perfil] = await Promise.all([
      execCentralizadaProcedimientos(sentenciaRoles, [usuario.ouidusuario], "OK", "OK"),
      modelousuario.ObtenerPerfilCompleto(usuario.ouidusuario)
    ]);

    const roles = respRoles?.data ?? [];
    const datosPerfil = perfil?.data?.[0] ?? {};

    const rolesPermitidos = appType === 'web' ? ROLES_WEB : ROLES_MOVIL;
    if (!tieneAcceso(roles, rolesPermitidos)) {
      return {
        success: true,
        sinPermiso: true,
        idUsuario: usuario.ouidusuario,
        roles: roles,
        nombre: '', apellido: '', correo: '',
        mensaje: 'No tiene permisos para acceder a esta aplicación'
      };
    }

    return {
      success: true,
      idUsuario: usuario.ouidusuario,
      nombre:   datosPerfil.strnombres  ?? nombreUsuario,
      apellido: datosPerfil.strapellidos ?? '',
      correo:   datosPerfil.strcorreo1   ?? '',
      roles: roles,
      mensaje: 'Credenciales Válidas'
    };
  } catch (error) {
    return { success: false, mensaje: "Error: " + error.message };
  }
};



module.exports.EncriptarToken = async function (text) {
  try {
    const iv = crypto.randomBytes(IV_LENGTH); 
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag().toString('hex'); 
    const encryptedToken = iv.toString('hex') + ':' + tag + ':' + encrypted; 

    return {
      success: true,
      encryptedToken: encryptedToken
    };
  } catch (error) {
    return {
      success: false,
      mensaje: "Error en encriptación: " + error.message
    };
  }
};

module.exports.DesencriptarToken = async function (text) {
  try {
    const [ivHex, tagHex, encryptedText] = text.split(':');
    if (!ivHex || !tagHex || !encryptedText) throw new Error("Formato de token inválido");

    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
    decipher.setAuthTag(tag); 

    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return {
      success: true,
      decryptedToken: decrypted
    };
  } catch (error) {
    return {
      success: false,
      mensaje: "Error en desencriptación: " + error.message
    };
  }
};
