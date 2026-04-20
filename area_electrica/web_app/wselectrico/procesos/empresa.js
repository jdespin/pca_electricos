const { iniciarTransaccion, commitTransaccion, rollbackTransaccion } = require("./transacciones");
const modeloempresa = require("../modelo/empresa/empresa");
const modelocentral = require("../modelo/persona/central");
const modelomensajesolicitud = require("../modelo/compartido/mensajesolicitud");
const { tipoCargo } = require('../config/parametroConfigurable');
const parametroConfigurable = require("../config/parametroConfigurable");

module.exports.IngresarSolicitudEmpresa = async function (objPersona, objEmpresa, objEmpresaAnexo, objSolicitud) {
  const client = await iniciarTransaccion();
  try {
    let cedula = objPersona.documento || null;
    let strRuc = objEmpresa.strruc || null;
    let idPersona, idEmpresa, idRepresentante;

    
    const personaExistente = await modelocentral.EncontrarPersonaDadoCedula(
      cedula
    );

    if (personaExistente && personaExistente.data && personaExistente.data.length > 0) {
      idPersona = Number(personaExistente.data[0].idpersona);
    } else {
      const nuevaPersona = await modelocentral.IngresarPersona(client, objPersona);

      if (!nuevaPersona || !nuevaPersona.data || nuevaPersona.data.length === 0) {
        throw new Error("No se pudo registrar la nueva persona.");
      }
      idPersona = Number(nuevaPersona.data[0].ouidpersona);
    }

    
    if (!idPersona) {
      throw new Error("El ID de la persona no está definido. No se puede continuar.");
    }

    
    const empresaExistente = await modeloempresa.EncontrarEmpresaRuc(strRuc);
    if (empresaExistente && empresaExistente.data.length > 0) {
      idEmpresa = Number(empresaExistente.data[0].ouidempresa);
      
      objEmpresa.idempresa = idEmpresa;
      const empresaActualizar = await modeloempresa.ActualizarEmpresa(client, objEmpresa);
      if (!empresaActualizar || !empresaActualizar.data || empresaActualizar.data.length === 0) {
        throw new Error("Fallo en la actualización de datos de la empresa.");
      }
      
      const representanteExistente = await modeloempresa.ObtenerRepresentanteIdPersona(idPersona, idEmpresa, tipoCargo.REPRESENTANTE_LEGAL);
      if (!representanteExistente || !representanteExistente.data || representanteExistente.data.length === 0) {
        const nuevoRepresentante = await modeloempresa.RegistrarRepresentante(client, idPersona, idEmpresa, tipoCargo.REPRESENTANTE_LEGAL);

        if (!nuevoRepresentante || !nuevoRepresentante.data || nuevoRepresentante.data.length === 0) {
          throw new Error("Fallo en el registro del representante legal.");
        }
        idRepresentante = nuevoRepresentante.data[0].ouidrepresentante;
      } else {
        idRepresentante = representanteExistente.data[0].ouidrepresentante;
        objPersona.idpersona = representanteExistente.data[0].ouidpersona;
        const personaActualizar = await modelocentral.ActualizarPersona(client, objPersona);
        if (!personaActualizar || !personaActualizar.data || personaActualizar.data.length === 0) {
          throw new Error("Fallo en la actualización de datos del representante legal.");
        }
      }

      
      if (!objEmpresaAnexo.emp_anexo_strruta) {
        throw new Error("El campo de ruta no puede estar vacío para actualizar el anexo.");
      }
      objEmpresaAnexo.emp_anexo_idempresa = idEmpresa;
      const actualizarAnexo = await modeloempresa.ActualizarEmpresaAnexo(client, objEmpresaAnexo);
      if (!actualizarAnexo || actualizarAnexo.data.length === 0) {
        throw new Error("Fallo al actualizar el anexo de la empresa.");
      }

      
      objSolicitud.idempresa = idEmpresa;
      objSolicitud.idrepresentante = idRepresentante;
      const nuevaSolicitud = await modeloempresa.NuevaSolicitudEmpresa(client, objSolicitud);
      if (!nuevaSolicitud || nuevaSolicitud.data.length === 0) {
        throw new Error("Fallo en el registro de la solicitud.");
      }
    } else {
      
      objEmpresa.idrepresentante = Number(idPersona);
      objSolicitud.idcargo = tipoCargo.REPRESENTANTE_LEGAL;
      const nuevaEmpresa = await modeloempresa.IngresoEmpresa(client, objEmpresa, objSolicitud);
      if (!nuevaEmpresa || nuevaEmpresa.data.length === 0) {
        throw new Error("Fallo en el registro de la empresa.", nuevaEmpresa);
      }

      idEmpresa = nuevaEmpresa.data[0].ouidempresa;

      
      let objSucursal = {
        idempresa: idEmpresa,
        sucursal_strnombre: 'Matríz',
        sucursal_strdescripcion: 'Establecimiento principal donde se recolectarán los alimentos destinados a donaciones y se coordinarán visitas técnicas para garantizar el cumplimiento de los objetivos del convenio.',
        idubicacion: idEmpresa,
        sucursal_strdireccion: objEmpresa.empresa_strdireccion
      };

      const nuevaSucursal = await modeloempresa.CrearSucursal(client, objSucursal);
      if (!nuevaSucursal || nuevaSucursal.data.length === 0) {
        throw new Error("Fallo en el registro de la sucursal matriz.", nuevaSucursal);
      }

      
      if (!objEmpresaAnexo.emp_anexo_strruta) {
        throw new Error("El campo ruta no puede estar vacío para registrar el anexo."
        );
      }
      objEmpresaAnexo.emp_anexo_idempresa = idEmpresa;
      const nuevoAnexo = await modeloempresa.CrearEmpresaAnexo(client, objEmpresaAnexo);
      if (!nuevoAnexo || nuevoAnexo.data.length === 0) {
        throw new Error("Fallo en el registro del anexo.");
      }
    }

    await commitTransaccion(client);

    return {
      success: true,
      mensaje: "Operación completada exitosamente.",
    };
  } catch (error) {
    await rollbackTransaccion(client);
    console.error("Error en la transacción:", error.message);
    return { success: false, mensaje: `Error: ${error.message}` };
  }
};

module.exports.ActualizarEmpresaRepresentante = async function (objPersona, objEmpresa, objEmpresaAnexo) {
  const client = await iniciarTransaccion();
  try {
    let cedula = objPersona.documento || null;
    let strRuc = objEmpresa.strruc || null;
    let idPersona, idEmpresa, idRepresentante;

    
    const personaExistente = await modelocentral.EncontrarPersonaDadoCedula(cedula);

    if (personaExistente && personaExistente.data && personaExistente.data.length > 0) {
      idPersona = Number(personaExistente.data[0].idpersona);
    } else {
      const nuevaPersona = await modelocentral.IngresarPersona(client, objPersona);
      if (!nuevaPersona || !nuevaPersona.data || nuevaPersona.data.length === 0) {
        throw new Error("No se pudo registrar la nueva persona.");
      }
      idPersona = Number(nuevaPersona.data[0].ouidpersona);
    }

    
    if (!idPersona) {
      throw new Error("El ID de la persona no está definido. No se puede continuar.");
    }

    
    const empresaExistente = await modeloempresa.EncontrarEmpresaRuc(strRuc);
    if (empresaExistente && empresaExistente.data.length > 0) {
      idEmpresa = Number(empresaExistente.data[0].ouidempresa);
      
      objEmpresa.idempresa = idEmpresa;
      const empresaActualizar = await modeloempresa.ActualizarEmpresa(client, objEmpresa);
      if (!empresaActualizar || !empresaActualizar.data || empresaActualizar.data.length === 0) {
        throw new Error("Fallo en la actualización de datos de la empresa.");
      }
      
      const representanteExistente = await modeloempresa.ObtenerRepresentanteIdPersona(idPersona, idEmpresa, tipoCargo.REPRESENTANTE_LEGAL);
      if (!representanteExistente || !representanteExistente.data || representanteExistente.data.length === 0) {
        const nuevoRepresentante = await modeloempresa.RegistrarRepresentante(client, idPersona, idEmpresa, tipoCargo.REPRESENTANTE_LEGAL);
        if (!nuevoRepresentante || !nuevoRepresentante.data || nuevoRepresentante.data.length === 0) {
          throw new Error("Fallo en el registro del representante legal.");
        }
        idRepresentante = nuevoRepresentante.data[0].ouidrepresentante;
      } else {
        idRepresentante = representanteExistente.data[0].ouidrepresentante;
        objPersona.idpersona = representanteExistente.data[0].ouidpersona;
        const personaActualizar = await modelocentral.ActualizarPersona(client, objPersona);
        if (!personaActualizar || !personaActualizar.data || personaActualizar.data.length === 0) {
          throw new Error("Fallo en la actualización de datos del representante legal.");
        }
      }

      
      if (!objEmpresaAnexo.emp_anexo_strruta) {
        throw new Error("El campo de ruta no puede estar vacío para actualizar el anexo.");
      }
      objEmpresaAnexo.emp_anexo_idempresa = idEmpresa;
      const actualizarAnexo = await modeloempresa.ActualizarEmpresaAnexo(client, objEmpresaAnexo);
      if (!actualizarAnexo || actualizarAnexo.data.length === 0) {
        throw new Error("Fallo al actualizar el anexo de la empresa.");
      }

    } else {

      throw new Error(" No se encontro una empresa con el ruc proporcioando.");
    }

    await commitTransaccion(client);

    return {
      success: true,
      mensaje: "Operación completada exitosamente.",
    };
  } catch (error) {
    await rollbackTransaccion(client);
    console.error("Error en la transacción:", error.message);
    return { success: false, mensaje: `Error: ${error.message}` };
  }
};


module.exports.IngresarPersonalEmpresa = async function (objPersona) {
  const client = await iniciarTransaccion();

  try {
    let idEmpresa = objPersona.idempresa;
    let idCargo = objPersona.idcargo;
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
      idPersona = nuevaPersona.data[0].ouidpersona;
    }

    
    if (!idPersona) {
      console.error("ID de persona no definido después de verificar o registrar la persona.");
      throw new Error("El ID de la persona no está definido. No se puede continuar.");
    }

    
    const representanteExistente = await modeloempresa.ObtenerRepresentanteIdPersona(idPersona, idEmpresa, idCargo);
    if (!representanteExistente || !representanteExistente.data || representanteExistente.data.length === 0
    ) {
      const nuevoRepresentante = await modeloempresa.RegistrarRepresentante(client, idPersona, idEmpresa, idCargo);
      if (!nuevoRepresentante || !nuevoRepresentante.data || nuevoRepresentante.data.length === 0
      ) {
        console.error("Error: Fallo en el registro del representante legal.");
        throw new Error("Fallo en el registro del representante legal.");
      }
      idRepresentante = nuevoRepresentante.data[0].ouidrepresentante;
    } else {
      idRepresentante = representanteExistente.data[0].ouidrepresentante;

      objPersona.idpersona = representanteExistente.data[0].ouidpersona;
      const personaActualizar = await modelocentral.ActualizarPersona(client, objPersona);
      if (!personaActualizar || !personaActualizar.data || personaActualizar.data.length === 0
      ) {
        console.error("Error: Fallo en la actualización del representante legal.");
        throw new Error("Fallo en la actualización del representante legal.");
      }
    }

    await commitTransaccion(client);
    return {
      success: true,
      mensaje: "Operación completada exitosamente.",
      datos: {
        idRepresentante,  
        idPersona
      }
    };
  } catch (error) {
    await rollbackTransaccion(client);
    console.error("Error en la transacción:", error.message);
    return { success: false, mensaje: `Error: ${error.message}` };
  }
};


module.exports.GuardarSolicitudMensaje = async function (objSolicitud) {
  const client = await iniciarTransaccion();

  try {
    idSolicitud = objSolicitud.idSolicitud;
    strCita = objSolicitud.cuerpo;

    
    const actualizacionResp = await modeloempresa.ActualizarCitaEmpresa(client, idSolicitud, strCita);
    if (!actualizacionResp || actualizacionResp.count === 0) {
      throw new Error("Error al actualizar solicitud");
    }

    const solicitudResp = await modelomensajesolicitud.mensajeSolicitud(objSolicitud);
    if (!solicitudResp || solicitudResp.count === 0) {
      throw new Error("Error al enviar correo");
    }

    await commitTransaccion(client);

    return {
      success: true,
      data: actualizacionResp.data,
      mensaje: "Actualizado y Enviado el correo.",
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




module.exports.IngresarSolicitudFundacion = async function (objPersona, objCoordinador, objEmpresa, objEmpresaAnexos, objSolicitud) {
  const client = await iniciarTransaccion();
  try {
    let cedulaRepresentante = objPersona.documento || null;
    let cedulaCoordinador = objPersona.documento || null;

    let strRuc = objEmpresa.strruc || null;
    let idPersona, idPersonaCoordinador, idEmpresa, idRepresentante;

    
    const personaExistente = await modelocentral.EncontrarPersonaDadoCedula(
      cedulaRepresentante
    );

    if (personaExistente && personaExistente.data && personaExistente.data.length > 0) {
      idPersona = personaExistente.data[0].idpersona;
    } else {
      const nuevaPersona = await modelocentral.IngresarPersona(client, objPersona);

      if (!nuevaPersona || !nuevaPersona.data || nuevaPersona.data.length === 0) {
        throw new Error("No se pudo registrar la nueva persona.");
      }
      idPersona = nuevaPersona.data[0].ouidpersona;
    }

    
    if (!idPersona) {
      throw new Error("El ID de la persona representante no está definido. No se puede continuar.");
    }

    
    if (cedulaCoordinador && cedulaCoordinador !== "0") {
      const personaExistente1 = await modelocentral.EncontrarPersonaDadoCedula(cedulaCoordinador);

      if (personaExistente1 && personaExistente1.data && personaExistente1.data.length > 0) {
        idPersonaCoordinador = personaExistente1.data[0].idpersona;
      } else {
        const nuevaPersona = await modelocentral.IngresarPersona(client, objCoordinador);
        if (!nuevaPersona || !nuevaPersona.data || nuevaPersona.data.length === 0) {
          throw new Error("No se pudo registrar la nueva persona.");
        }
        idPersonaCoordinador = nuevaPersona.data[0].ouidpersona;
      }

      
      if (!idPersonaCoordinador) {
        throw new Error("El ID de la persona coordinador no está definido. No se puede continuar.");
      }
    } else {
    }

    
    const empresaExistente = await modeloempresa.EncontrarEmpresaRuc(strRuc);
    if (empresaExistente && empresaExistente.data.length > 0) {
      idEmpresa = empresaExistente.data[0].ouidempresa;
      
      objEmpresa.idempresa = idEmpresa;
      const empresaActualizar = await modeloempresa.ActualizarEmpresa(client, objEmpresa);
      if (!empresaActualizar || !empresaActualizar.data || empresaActualizar.data.length === 0) {
        throw new Error("Fallo en la actualización de datos de la empresa.");
      }
      
      const representanteExistente = await modeloempresa.ObtenerRepresentanteIdPersona(idPersona, idEmpresa, tipoCargo.REPRESENTANTE_LEGAL);
      if (!representanteExistente || !representanteExistente.data || representanteExistente.data.length === 0) {
        const nuevoRepresentante = await modeloempresa.RegistrarRepresentante(client, idPersona, idEmpresa, tipoCargo.REPRESENTANTE_LEGAL);

        if (!nuevoRepresentante || !nuevoRepresentante.data || nuevoRepresentante.data.length === 0) {
          throw new Error("Fallo en el registro del representante legal.");
        }
        idRepresentante = nuevoRepresentante.data[0].ouidrepresentante;
      } else {
        idRepresentante = representanteExistente.data[0].ouidrepresentante;
        objPersona.idpersona = representanteExistente.data[0].ouidpersona;
        const personaActualizar = await modelocentral.ActualizarPersona(client, objPersona);
        if (!personaActualizar || !personaActualizar.data || personaActualizar.data.length === 0) {
          throw new Error("Fallo en la actualización de datos del representante legal.");
        }
      }

      
      if (cedulaCoordinador && cedulaCoordinador !== "0") {
        const coordinadorExistente = await modeloempresa.ObtenerRepresentanteIdPersona(idPersona, idEmpresa, tipoCargo.REPRESENTANTE_LEGAL);
        if (!coordinadorExistente || !coordinadorExistente.data || coordinadorExistente.data.length === 0) {
          const nuevoRepresentante = await modeloempresa.RegistrarRepresentante(client, idPersona, idEmpresa, tipoCargo.REPRESENTANTE_LEGAL);

          if (!nuevoRepresentante || !nuevoRepresentante.data || nuevoRepresentante.data.length === 0) {
            throw new Error("Fallo en el registro del coordinador.");
          }
          idRepresentante = nuevoRepresentante.data[0].ouidrepresentante;
        } else {
          idRepresentante = coordinadorExistente.data[0].ouidrepresentante;
          objPersona.idpersona = coordinadorExistente.data[0].ouidpersona;
          const personaActualizar = await modelocentral.ActualizarPersona(client, objPersona);
          if (!personaActualizar || !personaActualizar.data || personaActualizar.data.length === 0) {
            throw new Error("Fallo en la actualización de datos del coordinador.");
          }
        }
      } else {
      }


      
      if (!Array.isArray(objEmpresaAnexos) || objEmpresaAnexos.length === 0) {
        throw new Error("Debe proporcionar al menos un anexo para actualizar.");
      }
      for (const anexo of objEmpresaAnexos) {
        if (!anexo.emp_anexo_strruta) {
          throw new Error("El campo de ruta no puede estar vacío para actualizar el anexo.");
        }
        anexo.emp_anexo_idempresa = idEmpresa;
        const actualizarAnexo = await modeloempresa.ActualizarEmpresaAnexo(client, anexo);
        if (!actualizarAnexo || actualizarAnexo.data.length === 0) {
          throw new Error("Fallo al actualizar el anexo de la empresa.");
        }
      }

      
      objSolicitud.idempresa = idEmpresa;
      objSolicitud.idrepresentante = idRepresentante;

      const nuevaSolicitud = await modeloempresa.NuevaSolicitudEmpresa(client, objSolicitud);
      if (!nuevaSolicitud || nuevaSolicitud.data.length === 0) {
        throw new Error("Fallo en el registro de la solicitud.");
      }
    } else {
      
      objEmpresa.idrepresentante = Number(idPersona);
      objSolicitud.idcargo = tipoCargo.REPRESENTANTE_LEGAL;

      const nuevaEmpresa = await modeloempresa.IngresoEmpresa(client, objEmpresa, objSolicitud);
      if (!nuevaEmpresa || nuevaEmpresa.data.length === 0) {
        throw new Error("Fallo en el registro de la empresa 1.", nuevaEmpresa);
      }
      idEmpresa = nuevaEmpresa.data[0].ouidempresa;

      
      if (!Array.isArray(objEmpresaAnexos) || objEmpresaAnexos.length === 0) {
        throw new Error("Debe proporcionar al menos un anexo para registrar.");
      }
      for (const anexo of objEmpresaAnexos) {
        if (!anexo.emp_anexo_strruta) {
          throw new Error("El campo de ruta no puede estar vacío para registrar el anexo.");
        }
        anexo.emp_anexo_idempresa = idEmpresa;
        const nuevoAnexo = await modeloempresa.CrearEmpresaAnexo(client, anexo);
        if (!nuevoAnexo || nuevoAnexo.data.length === 0) {
          throw new Error("Fallo en el registro del anexo.");
        }
      }
    }

    await commitTransaccion(client);

    return {
      success: true,
      mensaje: "Operación completada exitosamente.",
    };
  } catch (error) {
    await rollbackTransaccion(client);
    console.error("Error en la transacción:", error.message);
    return { success: false, mensaje: `Error: ${error.message}` };
  }
};
