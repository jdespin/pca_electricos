const { iniciarTransaccion, commitTransaccion, rollbackTransaccion } = require('./transacciones');
const modelocentral = require('../modelo/persona/central');


module.exports.guardarPersonaConFoto = async function (objPersona) {
    const client = await iniciarTransaccion();

    try {
        
        const personaResp = await modelocentral.IngresarPersona(client, objPersona);
        if (!personaResp || personaResp.count === 0) {
            throw new Error("Error al insertar la persona");
        }

        console.log("Persona insertada con ID:", personaResp.data[0].idpersona);
        console.log("Respuesta completa de la inserción de persona:", personaResp);
        const idPersona = personaResp.data[0].idpersona;

        
        const fotoResp = await modelocentral.InsertarPersonaFoto(client, idPersona, objPersona.strfoto);
        if (!fotoResp || fotoResp.count === 0) {
            throw new Error("Error al insertar la foto de la persona");
        }

        
        await commitTransaccion(client);

        return {
            success: true,
            persona: personaResp.data,
            foto: fotoResp.data
        };
    } catch (error) {
        
        await rollbackTransaccion(client);
        console.error("Error en la transacción:", error);
        return {
            success: false,
            error: error.message
        };
    }
};

module.exports.actualizarPersonaConFoto = async function (objPersona) {
    const client = await iniciarTransaccion();

    try {
        
        const personaResp = await modelocentral.ActualizarPersona(client, objPersona);
        if (!personaResp || personaResp.count === 0) {
            throw new Error("Error al actualizar la persona");
        }

        console.log("Persona actualizada con ID:", personaResp.data[0].idpersona);
        console.log("Respuesta completa de la actualización de persona:", personaResp);
        const idPersona = personaResp.data[0].idpersona;

        
        const fotoResp = await modelocentral.ActualizarFoto(client, idPersona, objPersona.strfoto);
        if (!fotoResp || fotoResp.count === 0) {
            throw new Error("Error al actualizar la foto de la persona");
        }

        
        await commitTransaccion(client);

        return {
            success: true,
            persona: personaResp.data,
            foto: fotoResp.data
        };
    } catch (error) {
        
        await rollbackTransaccion(client);
        console.error("Error en la transacción:", error);
        return {
            success: false,
            error: error.message
        };
    }
};
