const { iniciarTransaccion, commitTransaccion, rollbackTransaccion } = require('./transacciones');
const modelousuario = require("./../modelo/autenticacion/usuario");
const modeloperfil = require("./../modelo/autenticacion/perfil");
const modelocentral = require('../modelo/persona/central');


module.exports.actualizarUsuarioCompleto = async function (objUsuario) {
  const client = await iniciarTransaccion();

  try {
    if (!objUsuario) throw new Error('objUsuario es requerido');

    const idusuario = objUsuario.idusuario;
    if (!idusuario) throw new Error('idusuario es requerido para actualizar');

    const objPersona = objUsuario.objPersona;
    if (!objPersona || !objPersona.idpersona) throw new Error('objPersona.idpersona es requerido');

    const perfiles = Array.isArray(objUsuario.objPerfil) ? objUsuario.objPerfil : [];
    if (perfiles.length === 0) throw new Error('objPerfil debe tener al menos un rol');

    
    const personaResp = await modelocentral.ActualizarPersona(client, {
      ...objPersona,
      dtfechamodificacion: new Date().toISOString(),
    });
    if (!personaResp || (personaResp.count === 0 && !personaResp.success)) {
      throw new Error('Error al actualizar persona');
    }

    
    const usuarioResp = await modelousuario.ActualizarUsuario({
      idusuario,
      usuario_strnombre: objUsuario.usuario_strnombre,
      usuario_idpersona: objPersona.idpersona,
    });
    if (!usuarioResp) throw new Error('Error al actualizar usuario');

    
    await modeloperfil.EliminarPerfilesDeUsuario(client, idusuario);

    for (const perfil of perfiles) {
      const idrol = perfil?.idrol ?? null;
      if (!idrol) throw new Error('Perfil inválido: falta idrol');
      const perfilResp = await modeloperfil.CrearPerfil(client, { idusuario, idrol });
      if (!perfilResp || perfilResp.count === 0) throw new Error('Error al insertar perfil');
    }

    await commitTransaccion(client);

    return {
      success: true,
      mensaje: 'Usuario, persona y roles actualizados correctamente',
    };
  } catch (error) {
    await rollbackTransaccion(client);
    console.error('Error en actualizarUsuarioCompleto:', error);
    return { success: false, error: error.message };
  }
};



module.exports.guardarPersonaPerfil = async function (objUsuario) {
  const client = await iniciarTransaccion();

  try {
    
    
    
    if (!objUsuario) throw new Error("objUsuario es requerido");

    console.log("objUsuario", objUsuario);
    const objPersona = objUsuario.objPersona;
    if (!objPersona) throw new Error("objUsuario.objPersona es requerido");

    const perfiles = Array.isArray(objUsuario.objPerfil) ? objUsuario.objPerfil : [];
    if (perfiles.length === 0) throw new Error("objUsuario.objPerfil debe tener al menos un rol");

    
    
    
    const personaResp = await modelocentral.IngresarPersona(client, objPersona);
    if (!personaResp || personaResp.count === 0) {
      throw new Error("Error al insertar la persona");
    }

    
    const idPersona =
      personaResp.data?.[0]?.idpersona ??
      personaResp.data?.[0]?.ouidpersona ??
      null;

    if (!idPersona) {
      throw new Error("No se pudo obtener idpersona luego de insertar persona");
    }

    
    
    
    const strfoto = objPersona.strfoto ?? "";
    if (strfoto && String(strfoto).trim().length > 0) {
      const fotoResp = await modelocentral.InsertarPersonaFoto(client, idPersona, strfoto);
      if (!fotoResp || fotoResp.count === 0) {
        throw new Error("Error al insertar la foto de la persona");
      }
    }

    
    
    
    const objUsuarioParaCrear = {
      ...objUsuario,
      usuario_idpersona: idPersona,  
    };

    
    delete objUsuarioParaCrear.objPersona;

    const usuarioResp = await modelousuario.CrearUsuario(client, objUsuarioParaCrear);
    if (!usuarioResp || usuarioResp.count === 0) {
      throw new Error("Error al insertar el usuario");
    }

    const nuevoIdUsuario =
      usuarioResp.data?.[0]?.ouidusuario ??
      usuarioResp.data?.[0]?.idusuario ??
      null;

    if (!nuevoIdUsuario) {
      throw new Error("No se pudo obtener idusuario luego de crear usuario");
    }

    
    
    
    for (const perfil of perfiles) {
      const idrol = perfil?.idrol ?? perfil?.ouidrol ?? null;
      if (!idrol) throw new Error("Perfil inválido: falta idrol");

      const objPerfil = { idusuario: nuevoIdUsuario, idrol };
      const perfilResp = await modeloperfil.CrearPerfil(client, objPerfil);

      if (!perfilResp || perfilResp.count === 0) {
        throw new Error("Error al insertar el perfil");
      }
    }

    
    
    
    await commitTransaccion(client);

    return {
      success: true,
      persona: personaResp.data,
      usuario: usuarioResp.data,
      mensaje: "Persona, usuario y perfiles insertados correctamente",
    };
  } catch (error) {
    await rollbackTransaccion(client);
    console.error("Error en la transacción:", error);

    return {
      success: false,
      data: [],
      error: error.message,
    };
  }
};
