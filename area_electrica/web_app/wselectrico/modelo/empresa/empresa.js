const { execCentralizada, execCentralizadaProcedimientos, execTransaccion } = require('../../config/execSQLCentralizada.helper');


module.exports.ListadoEmpresa = async function (idTipoSolicitud, idTipoEntidad) {
  var sentencia;
  sentencia = 'SELECT * FROM central.f_central_empresa($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,$21,$22)';
  var listaParametros = ['LSET', null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, idTipoSolicitud, null, null, null, idTipoEntidad,null];

  try {
    if (sentencia != "") {

      const resp = await execCentralizadaProcedimientos(sentencia, listaParametros, "OK", "OK");
      return resp;
    } else {
      return { data: "vacio sql" };
    }
  } catch (error) {
    console.error("Error ejecutando la consulta:", error.message);
    return { data: "Error: " + error.message };
  }
}


module.exports.ListadoEmpresasAceptadasActivas = async function (idTipoSolicitud, idTipoEntidad) {
  var sentencia;
  sentencia = 'SELECT * FROM central.f_central_empresa($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,$21,$22)';
  var listaParametros = ['LSET', null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, idTipoSolicitud, null, null, true, idTipoEntidad,null];

  try {
    if (sentencia != "") {

      const resp = await execCentralizadaProcedimientos(sentencia, listaParametros, "OK", "OK");
      return resp;
    } else {
      return { data: "vacio sql" };
    }
  } catch (error) {
    console.error("Error ejecutando la consulta:", error.message);
    return { data: "Error: " + error.message };
  }
}

module.exports.ListadoCargoEmpresaActivos = async function () {
  var sentencia;
  sentencia = "select * from central.tb_cargo where blestado=true AND idcargo>=1 AND idcargo<=3 "
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


module.exports.IngresoEmpresa = async function (client, objEmpresa, objSolicitud) {
  var sentencia;
  sentencia = 'SELECT * FROM central.f_central_empresa($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,$21,$22)';

  var listaParametros = [
    'IN', null, objEmpresa.idtipoempresa, objEmpresa.empresa_strnombre, objEmpresa.empresa_dtfechacreacion, objEmpresa.idubicacion, objEmpresa.empresa_strdireccion, objEmpresa.empresa_stractividad, objEmpresa.empresa_strfoto, objEmpresa.empresa_strcorreo1,
    objEmpresa.empresa_strcorreo2, objEmpresa.empresa_strcelular1, objEmpresa.empresa_strcelular2, objEmpresa.idrepresentante, objEmpresa.strruc, null, objSolicitud.idtiposolicitud, objSolicitud.solicitud_strdescripcion, 'ND', null, objEmpresa.idtipoentidad,objSolicitud.idcargo
  ];

  try {
    return await execTransaccion(client, sentencia, listaParametros, "Empresa insertada", "No se pudo insertar la empresa");
  } catch (error) {
    await rollbackTransaccion(client);
    console.error("Error en la transacción:", error.message || error);

    return {
      success: false,
      mensaje: `Error en la transacción: ${error.message || "Error desconocido"}`
    };
  }
}


module.exports.ObtenerEmpresaRucSolicitudActivo = async function (stRruc, idTipoEntidad, idTipoSolicitud) {
  var sentencia;
  sentencia = 'SELECT * FROM central.f_central_empresa($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,$21,$22)';
  var listaParametros = ['OERUC', null, null, null, null, null, null, null, null, null, null, null, null, null, stRruc, null, idTipoSolicitud, null, null, null, idTipoEntidad,null];

  try {
    if (sentencia != "") {

      const resp = await execCentralizadaProcedimientos(sentencia, listaParametros, "OK", "OK");
      return resp;
    } else {
      return { data: "vacio sql" };
    }
  } catch (error) {
    console.error("Error ejecutando la consulta:", error.message);
    return { data: "Error: " + error.message };
  }
}

module.exports.ActualizarEstadoEmpresa = async function (idEmpresa, empresa_blestado) {
  const sentencia = 'SELECT * FROM central.f_central_empresa_actualizar($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)';
  const listaParametros = ['UPE', idEmpresa, null, null, null, null, null, null, null, null, null, empresa_blestado, null, null];

  try {
    const resp = await execCentralizadaProcedimientos(sentencia, listaParametros, "OK", "OK");
    return resp;
  } catch (error) {
    console.error("Error ejecutando la consulta:", error.message);
    return { data: [`Error: ${error.message}`] };  
  }
};



module.exports.ListadoRepresentantesEmpresaActivos = async function (idEmpresa) {
  var sentencia;
  sentencia = 'SELECT * FROM  central.f_central_empresa_representante($1, $2, $3, $4, $5 ,$6)';
  var listaParametros = ['LIST', null, null, idEmpresa, null, true];

  try {
    if (sentencia != "") {

      const resp = await execCentralizadaProcedimientos(sentencia, listaParametros, "OK", "OK");
      return resp;
    } else {
      return { data: "vacio sql" };
    }
  } catch (error) {
    console.error("Error ejecutando la consulta:", error.message);
    return { data: "Error: " + error.message };
  }
}


module.exports.ObtenerRepresentanteId = async function (idRepresentante, idEmpresa, idCargo) {
  sentencia = 'SELECT * FROM  central.f_central_empresa_representante( $1, $2, $3, $4,$5,$6)';
  var listaParametros = ['UNOIDR', idRepresentante, null, idEmpresa, idCargo, null];
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



module.exports.ObtenerRepresentanteIdPersona = async function (idPersona, idEmpresa, idCargo) {
  sentencia = 'SELECT * FROM  central.f_central_empresa_representante( $1, $2, $3,$4, $5, $6)';
  var listaParametros = ['UNOIDP', null, idPersona, idEmpresa, idCargo, null];
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


module.exports.EncontrarEmpresaRuc = async function (strRuc) {

  sentencia = 'SELECT * FROM central.f_central_empresa_actualizar($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)';
  var listaParametros = ['UNO', null, null, null, null, null, null, null, null, null, null, null, null, strRuc];
  try {
    if (sentencia != "") {

      const resp = await execCentralizadaProcedimientos(sentencia, listaParametros, "OK", "OK");
      return resp;
    } else {
      return { data: "vacio sql" };
    }
  } catch (error) {
    console.error("Error ejecutando la consulta:", error.message);
    return { data: "Error: " + error.message };
  }
}

module.exports.ObtenerEmpresaId = async function (idempresa) {
  var sentencia;
  sentencia = "SELECT * FROM central.tb_empresa_documento ed INNER JOIN central.tb_empresa as em on ed.idempresa=em.idempresa INNER JOIN central.tb_tipo_empresa as te on te.idtipoempresa=em.idtipoempresa INNER JOIN central.tb_tipo_documento as tp on tp.iddocumento=ed.idtipodocumento WHERE ed.idempresa=" + Number(idempresa) + " and ed.blestado=true"
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



module.exports.NuevaSolicitudEmpresa = async function (client, objSolicitud) {
  var sentencia;
  sentencia = 'SELECT * FROM central.f_central_solicitud_empresa($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)';
  var listaParametros = ['IN', null, objSolicitud.idtiposolicitud, objSolicitud.idempresa, objSolicitud.idrepresentante, null, objSolicitud.solicitud_strdescripcion, 'ND', null, null, null];

  try {
    return await execTransaccion(client, sentencia, listaParametros, "Empresa insertada", "No se pudo insertar la empresa");
  } catch (error) {
    await rollbackTransaccion(client);
    console.error("Error en la transacción:", error.message || error);

    return {
      success: false,
      mensaje: `Error en la transacción: ${error.message || "Error desconocido"}`
    };
  }
};


module.exports.RegistrarRepresentante = async function (client, idpersona, idempresa, idcargo) {
  var sentencia;
  sentencia = 'SELECT * FROM  central.f_central_empresa_representante( $1, $2, $3, $4,$5,$6)';
  var listaParametros = ['IN', null, idpersona, idempresa, idcargo, null];

   try {
    if (client) {
      return await execTransaccion(client, sentencia, listaParametros, 'Personal insertado', 'No se pudo insertar');
    }
    if (!client && sentencia != "") {
      const resp = await execCentralizadaProcedimientos(sentencia, listaParametros, "OK", "OK");
      return (resp)
    }
  } catch (error) {
    console.error('Error al insertar personal empresa:', error);
    throw error;
  }

};


module.exports.ActualizarEstadoSolicitudEmpresa = async function (idSolicitud, idTipoSolicitud) {
  var sentencia;
  sentencia = 'SELECT * FROM central.f_central_solicitud_empresa($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)'
  var listaParametros = ['UPTS', idSolicitud, idTipoSolicitud, null, null, null, null, null, null, null, null]
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


module.exports.ActualizarEmpresa = async function (client, objEmpresa) {

  sentencia = 'SELECT * FROM central.f_central_empresa_actualizar($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)';

  var listaParametros = ['UP', objEmpresa.idempresa, objEmpresa.idtipoempresa, objEmpresa.empresa_strnombre, objEmpresa.empresa_strdireccion,
    objEmpresa.empresa_stractividad, objEmpresa.empresa_strfoto, objEmpresa.empresa_strcorreo1, objEmpresa.empresa_strcorreo2, objEmpresa.empresa_strcelular1, 
    objEmpresa.empresa_strcelular2, null, null, null
  ];

  try {

    if (sentencia != "") {
      const resp = await execTransaccion(client, sentencia, listaParametros, "Datos de empresa actualizados", "No se pudo actualizar los datos de la empresa");
      return (resp)
    } else {
      return { data: "vacio sql" }
    }
  } catch (error) {
    return { data: "Error al actualizar los datos de la empresa: " + error }
  }
}



module.exports.CrearEmpresaAnexo = async function (client, objEmpresaAnexo) {
  var sentencia;
  sentencia = 'SELECT * FROM central.f_central_empresa_anexo($1, $2, $3, $4, $5, $6,$7,$8)'
  var listaParametros = ['IN', null, objEmpresaAnexo.emp_anexo_idempresa, objEmpresaAnexo.emp_anexo_strnombre, objEmpresaAnexo.emp_anexo_strdescripcion, objEmpresaAnexo.emp_anexo_strruta, null, null]
  try {

    if (sentencia != "") {
      const resp = await execTransaccion(client, sentencia, listaParametros, "Documento ingresado", "No se pudo insertar el documento");
      return (resp)
    } else {
      return { data: "vacio sql" }
    }
  } catch (error) {
    return { data: "Error al ingresar el documento: " + error }
  }

}

module.exports.ActualizarEmpresaAnexo = async function (client, objEmpresaAnexo) {
  var sentencia;
  sentencia = 'SELECT * FROM central.f_central_empresa_anexo($1, $2, $3, $4, $5, $6,$7,$8)'
  var listaParametros = ['UP', null, objEmpresaAnexo.emp_anexo_idempresa, objEmpresaAnexo.emp_anexo_strnombre, objEmpresaAnexo.emp_anexo_strdescripcion, objEmpresaAnexo.emp_anexo_strruta, null, null]
  try {

    if (sentencia != "") {
      const resp = await execTransaccion(client, sentencia, listaParametros, "Documento actualizado", "No se pudo actualizar el documento");
      return (resp)
    } else {
      return { data: "vacio sql" }
    }
  } catch (error) {
    return { data: "Error al actualizar el documento: " + error }
  }

}

module.exports.ObtenerAnexoDadoIdEmpresa = async function (emp_anexo_idempresa) {
  var sentencia;
  sentencia = 'SELECT * FROM central.f_central_empresa_anexo($1, $2, $3, $4, $5, $6,$7,$8)'
  var listaParametros = ['UNO', null, emp_anexo_idempresa, null, null, null, null, null]
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



module.exports.ListadoSucursalEmpresa = async function (idEmpresa) {
  var sentencia;
  sentencia = 'SELECT * FROM central.f_central_empresa_sucursal($1, $2, $3, $4, $5 ,$6,$7,$8)'
  var listaParametros = ['TODOEMP', null, idEmpresa, null, null, null, null, null]
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

module.exports.CrearSucursal = async function (client, objSucursal) {
  var sentencia;
  sentencia = 'SELECT * FROM central.f_central_empresa_sucursal($1, $2, $3, $4, $5 ,$6,$7,$8)'
  var listaParametros = ['IN', null, objSucursal.idempresa, objSucursal.sucursal_strnombre, objSucursal.sucursal_strdescripcion, objSucursal.idubicacion, objSucursal.sucursal_strdireccion, null]
  try {
    if (client) {
      
      return await execTransaccion(client, sentencia, listaParametros, 'Sucursal insertada', 'No se pudo insertar la sucursal');
    }
    if (!client && sentencia != "") {
      const resp = await execCentralizadaProcedimientos(sentencia, listaParametros, "OK", "OK");
      return (resp)
    }
  } catch (error) {
    console.error('Error al insertar sucursal:', error);
    throw error;
  }
}

module.exports.ActualizarSucursal = async function (objSucursal) {
  var sentencia;
  sentencia = 'SELECT * FROM central.f_central_empresa_sucursal($1, $2, $3, $4, $5 ,$6,$7,$8)'
  var listaParametros = ['UP', objSucursal.idsucursal, null, objSucursal.sucursal_strnombre, objSucursal.sucursal_strdescripcion, objSucursal.idubicacion, objSucursal.sucursal_strdireccion, null]
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

module.exports.ActualizarSucursalEstado = async function (idSucursal, blEstado) {
  var sentencia;
  sentencia = 'SELECT * FROM central.f_central_empresa_sucursal($1, $2, $3, $4, $5 ,$6,$7,$8)'
  var listaParametros = ['UPE', idSucursal, null, null, null, null, null, blEstado]
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


module.exports.ListadoSucursalActivos = async function (idEmpresa) {
  var sentencia;
  sentencia = 'SELECT * FROM central.f_central_empresa_sucursal($1, $2, $3, $4, $5 ,$6,$7,$8)'
  var listaParametros = ['LISTEMP', null, idEmpresa, null, null, null, null, true]
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

module.exports.ActualizarCitaEmpresa = async function (client, idSolicitud, strCita) {
  var sentencia;
  sentencia = 'SELECT * FROM central.f_central_solicitud_empresa($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)'
  var listaParametros = ['UP', idSolicitud, null, null, null, strCita, null, null, null, null, null]
  try {

    if (sentencia != "") {
      const resp = await execTransaccion(client, sentencia, listaParametros, "Cita actualizada", "No se pudo actualizar la cita");
      return (resp)
    } else {
      return { data: "vacio sql" }
    }
  } catch (error) {
    return { data: "Error al actualizar la cita de la empresa: " + error }
  }
}


module.exports.ActualizarEstadoLogicoSolicitudEmpresa = async function (idSolicitud, blEstado) {
  var sentencia;
  sentencia = 'SELECT * FROM central.f_central_solicitud_empresa($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)'
  var listaParametros = ['UPEST', idSolicitud, null, null, null, null, null, null, null, blEstado, null]
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
