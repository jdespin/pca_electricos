const { iniciarTransaccion, commitTransaccion, rollbackTransaccion } = require("./transacciones");
const modelodonantepersona = require("../modelo/persona/donantepersona");
const modelocentral = require("../modelo/persona/central");
const modelomensajesolicitud = require("../modelo/compartido/mensajesolicitud");



module.exports.IngresarSolicitudPersona = async function (objPersona, objSolicitud) {
  const client = await iniciarTransaccion();

  try {
    let cedula = objPersona.documento || null;

    
    const personaExistente = await modelocentral.EncontrarPersonaDadoCedula(cedula);

    if (personaExistente && personaExistente.data && personaExistente.data.length > 0) {
      idPersona = personaExistente.data[0].idpersona;
    } else {
      const nuevaPersona = await modelocentral.IngresarPersona(client, objPersona);

      if (!nuevaPersona || !nuevaPersona.data || nuevaPersona.data.length === 0) {
        console.error("Fallo en el registro de la nueva persona.");
        throw new Error("No se pudo registrar la nueva persona.");
      }
      idPersona = Number(nuevaPersona.data[0].ouidpersona);
      const personaFoto = await modelocentral.InsertarPersonaFoto(client, idPersona, objPersona.strfoto)
      if (!personaFoto || personaFoto.message !== 'Foto insertada') {
        console.error("Fallo en el registro de la foto de la persona.");
        throw new Error("No se pudo registrar la foto de la persona.");
      }

    }

    
    if (!idPersona) {
      console.error("ID de persona no definido después de verificar o registrar la persona.");
      throw new Error("El ID de la persona no está definido. No se puede continuar.");
    }

    
    const solicitudActiva = await modelodonantepersona.ObtenerSolicitudPersonaActivo(objSolicitud.idtiposolicitud, idPersona);
    if (solicitudActiva && solicitudActiva.data.length > 0) {
      idSolicitudPersona = solicitudActiva.data[0].ouidsolicitudpersona;
      
      return {
        success: false,
        mensaje: "Usted ya es un donante activo en el banco de alimentos. Puede acercarse en el horario de atención establecido."
      };
    } else {
      
      objSolicitud.idpersona = idPersona;
      const nuevaSolicitud = await modelodonantepersona.NuevaSolicitudPersona(client, objSolicitud);
      if (!nuevaSolicitud || nuevaSolicitud.data.length === 0) throw new Error("Fallo en el registro de la solicitud.");
    }

    await commitTransaccion(client);
    
    return {
      success: true,
      mensaje: "Operación completada exitosamente."
    };
  } catch (error) {
    await rollbackTransaccion(client);
    console.error("Error en la transacción:", error.message);
    return { success: false, mensaje: `Error: ${error.message}` };
  }
};



module.exports.GuardarSolicitudMensajeDonante = async function (objSolicitud) {
  const client = await iniciarTransaccion();

  try {
    const { idSolicitud, cuerpo } = objSolicitud;

    const actualizacionResp = await modelodonantepersona.ActualizarCitaDonante(client, idSolicitud, cuerpo);

    if (!actualizacionResp || !actualizacionResp.data || actualizacionResp.data.length === 0) {
      throw new Error("No se actualizó ninguna solicitud");
    }

    const solicitudResp = await modelomensajesolicitud.mensajeSolicitud(objSolicitud);
    if (!solicitudResp || !solicitudResp.success || solicitudResp.count === 0) {
      throw new Error("No se envió el correo de notificación");
    }

    await commitTransaccion(client);

    return {
      success: true,
      data: actualizacionResp.data,
      mensaje: "Actualizado y enviado el correo correctamente.",
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
