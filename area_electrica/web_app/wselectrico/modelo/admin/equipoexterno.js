const sql = require('pg')
var os = require('os');
const { Client } = require('pg');
const { execCentralizadaProcedimientos, execTransaccion, execCentralizada } = require('../../config/execSQLCentralizada.helper');
const { disponibilidad } = require('../../config/parametroConfigurable');

module.exports.VerificarIdentificadorEquipoExterno = async function (client, stridentificador, idequipoext = null) {
  const sentencia =
    'SELECT * FROM proceso.f_verificar_identificador_equipo_externo($1,$2,$3)';

  const listaParametros = ['VERIF', idequipoext, stridentificador ?? null];

  try {
    let resp;

    if (client) {
      resp = await execTransaccion(
        client,
        sentencia,
        listaParametros,
        'Consulta realizada correctamente.',
        'No se pudo verificar el identificador.'
      );
    } else {
      resp = await execCentralizadaProcedimientos(
        sentencia,
        listaParametros,
        'Consulta realizada correctamente.',
        'No se pudo verificar el identificador.'
      );
    }

    console.log('Respuesta cruda del helper:', resp);

    
    if (resp?.success === false) {
      return resp;
    }

    const fila = Array.isArray(resp?.data) ? resp.data[0] : null;

    return {
      success: true,
      mensaje: resp?.message || 'Consulta realizada correctamente.',
      datos: fila ?? {
        existe: false,
        idequipoext: null,
        idtipoequipo: null,
        stridentificador: null,
        strequipo: null,
        strserie: null,
        blestado: null,
        dtfecharegistro: null,
        dtfechamodificacion: null
      }
    };
  } catch (error) {
    console.error('Error al verificar identificador:', error);

    return {
      success: false,
      mensaje: error?.mensaje || error?.message || 'Error al verificar identificador.'
    };
  }
};

module.exports.IngresarEquipoExterno = async function (client, objEquipo) {
  const sentencia =
    'SELECT * FROM proceso.f_central_equipo_externo($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)';

  const listaParametros = [
    'IN',
    null,
    objEquipo.idtipoequipo,
    objEquipo.stridentificador,
    objEquipo.strserie,
    objEquipo.strconexion,
    objEquipo.strtipoclase,
    objEquipo.strplanoreferencia,
    objEquipo.strfabricante,
    objEquipo.strvoltajemegger,
    objEquipo.strequipo,
    objEquipo.strat,
    objEquipo.strbt,
    objEquipo.strcapacidad,
    objEquipo.strtipofluido,
    objEquipo.strpesoaceite,
    objEquipo.strpesototal,
    objEquipo.intanio,
    disponibilidad.SIN_ORDEN,
    objEquipo.strubicacion,
    null,
  ];

  try {
    let resp;

    if (client) {
      resp = await execTransaccion(
        client,
        sentencia,
        listaParametros,
        'Equipo externo registrado correctamente.',
        'No se pudo registrar el equipo externo'
      );
    } else {
      resp = await execCentralizadaProcedimientos(
        sentencia,
        listaParametros,
        'Equipo externo registrado correctamente.',
        'No se pudo registrar el equipo externo'
      );
    }

    if (resp?.success === false) {
      return resp;
    }

    return {
      success: true,
      mensaje: resp?.mensaje || 'Equipo externo registrado correctamente.',
      datos: resp?.datos ?? resp
    };
  } catch (error) {
    console.error('Error en la transacción:', error);

    return {
      success: false,
      mensaje: error?.mensaje || error?.message || 'Error desconocido al registrar el equipo.'
    };
  }
};

module.exports.ListadoEquiposExternos = async function () {
  let sentencia = '';
  sentencia = 'SELECT * FROM proceso.f_central_equipo_externo($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)';

  const listaParametros = [
    'TODO',
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null
  ];

  try {
    if (sentencia !== '') {
      const resp = await execCentralizadaProcedimientos(
        sentencia,
        listaParametros,
        'Consulta realizada correctamente.',
        'No se pudo listar los equipos externos.'
      );

      return resp;
    } else {
      return {
        success: false,
        mensaje: 'Consulta vacía.'
      };
    }
  } catch (error) {
    return {
      success: false,
      mensaje: 'Error: ' + (error?.message || error)
    };
  }
};

module.exports.EquipoExternoIdentificador = async function (stridentificador) {
  let sentencia = '';
  sentencia = 'SELECT * FROM proceso.f_central_equipo_externo($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)';

  const listaParametros = [
    'UNO',
    null,
    null,
    stridentificador,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    disponibilidad.SIN_ORDEN,
    null,
    null
  ];

  try {
    if (sentencia !== '') {
      const resp = await execCentralizadaProcedimientos(
        sentencia,
        listaParametros,
        'Consulta realizada correctamente.',
        'No se pudo listar los equipos externos.'
      );

      return resp;
    } else {
      return {
        success: false,
        mensaje: 'Consulta vacía.'
      };
    }
  } catch (error) {
    return {
      success: false,
      mensaje: 'Error: ' + (error?.message || error)
    };
  }
};
