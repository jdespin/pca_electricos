const sql = require('pg')
var os = require('os');
const { Client } = require('pg');
const { execCentralizada, execCentralizadaProcedimientos, execTransaccion } = require('../../config/execSQLCentralizada.helper');


module.exports.ListadoPersonaTodos = async function () {
  var sentencia;
  sentencia = `SELECT p.*, u.idusuario
               FROM central.tb_persona p
               LEFT JOIN seguridad.tb_usuario u ON u.usuario_idpersona = p.idpersona
               WHERE p.blestado = true
               ORDER BY p.strapellidos, p.strnombres`

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


module.exports.EncontrarPersonaDadoCedula = async function (cedula) {
  var sentencia;
  sentencia = "  SELECT p.idpersona AS idpersona, p.strcedula as cedula, p.strnombres as nombres,p.strapellidos as apellidos,p.strcorreo1 as correo1,p.strcelular1 as celular1, p.strtiposangre as tiposangre  FROM central.tb_persona as p WHERE p.strcedula='" + cedula + "'  and p.blestado=true"

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

module.exports.EncontrarPersonaDadoId = async function (idPersona) {
  var sentencia;
  sentencia = "SELECT * FROM central.tb_persona_documento as pd INNER JOIN central.tb_persona as p on p.idpersona=pd.idpersona INNER JOIN central.tb_etnia as e on e.id=p.idetnia INNER JOIN central.tb_estado_civil as ec on ec.id=p.idestadocivil INNER JOIN central.tb_tipo_documento as tp on tp.iddocumento=pd.idtipodocumento WHERE pd.idpersona=" + Number(idPersona) + " and pd.estado=true"
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


module.exports.IngresarPersona = async function (client, objPersona) {
  const sentencia =
    'SELECT * FROM central.f_central_persona($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)';
  const listaParametros = [
    'IN',
    null,
    objPersona.strnombres,
    objPersona.strapellidos,
    objPersona.strcedula,
    objPersona.strcorreo1,
    objPersona.strcelular1,
    objPersona.strtiposangre,
    null,
    objPersona.dtfechamodificacion,
  ];

  try {
    if (client) {
      
      return await execTransaccion(client, sentencia, listaParametros, "Persona Registrada", "No se pudo registar persona");
    }
    if (!client && sentencia != "") {
      const resp = await execCentralizadaProcedimientos(sentencia, listaParametros, "OK", "OK");
      return (resp)
    }
  } catch (error) {
    await rollbackTransaccion(client);
    console.error("Error en la transacción:", error.message || error);

    return {
      success: false,
      mensaje: `Error en la transacción: ${error.message || "Error desconocido"}`
    };
  }
};


module.exports.InsertarPersonaFoto = async function (client, idPersona, strfoto) {
  const sentencia = "INSERT INTO central.tb_persona_foto (idpersona, strfoto) VALUES ($1, $2)";
  const parametros = [idPersona, strfoto];

  try {
    return await execTransaccion(client, sentencia, parametros, "Foto insertada", "No se pudo insertar la foto");
  } catch (error) {
    await rollbackTransaccion(client);
    console.error("Error en la transacción:", error.message || error);

    return {
      success: false,
      mensaje: `Error en la transacción: ${error.message || "Error desconocido"}`
    };
  }

};


module.exports.ActualizarPersona = async function (client, objPersona) {
  const sentencia = 'SELECT * FROM central.f_central_persona($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)';
  const listaParametros = [
    'UP',
    objPersona.idpersona,
    objPersona.strnombres,
    objPersona.strapellidos,
    objPersona.strcedula,
    objPersona.strcorreo1,
    objPersona.strcelular1,
    objPersona.strtiposangre,
    null,
    objPersona.dtfechamodificacion,
  ];

  try {
    if (client) {
      return await execTransaccion(client, sentencia, listaParametros, "Datos Actualizados de Persona ", "No se pudo actualizar los datos de persona");
    }
    if (!client && sentencia != "") {
      const resp = await execCentralizadaProcedimientos(sentencia, listaParametros, "OK", "OK");
      return (resp)
    }
  } catch (error) {
    await rollbackTransaccion(client);

    return {
      success: false,
      mensaje: `Error en la transacción: ${error.message || "Error desconocido"}`
    };
  }

};

module.exports.ActualizarFoto = async function (client, idPersona, strfoto) {

const sentencia = `
  UPDATE central.tb_persona_foto
  SET strfoto = $2,
      dtfechamodificacion = NOW()
  WHERE idpersona = $1
`;
const parametros = [idPersona, strfoto];

  try {
    return await execTransaccion(client, sentencia, parametros, "Foto insertada", "No se pudo insertar la foto");
  } catch (error) {
    await rollbackTransaccion(client);
    console.error("Error en la transacción:", error.message || error);

    return {
      success: false,
      mensaje: `Error en la transacción: ${error.message || "Error desconocido"}`
    };
  }

};

module.exports.ObtenerFotoDadoId = async function (idPersona) {
  var sentencia;
  sentencia = "select * from central.tb_persona_foto where idpersona=" + idPersona + ""
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

module.exports.ActualizarPersonaEstado = async function (idPersona,blEstado) {
   const sentencia =
    'SELECT * FROM central.f_central_persona($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)';
  const listaParametros = [
    'UPEST',
    idPersona,
    null,
    null,
    null,
    null,
    null,
    null,
    blEstado,
    null
  ]; try {

    if (sentencia != "") {
      const resp = await execCentralizadaProcedimientos( sentencia, listaParametros, "Estado actualizado", "No se pudo actualizar el estado de la persona");
      return (resp)
    } else {
      return { data: "vacio sql" }
    }
  } catch (error) {
    return { data: "Error al actualizar la cita del donante: " + error }
  }
}
