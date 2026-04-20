const { Pool } = require('pg');
const CONFIGCENTRALIZADA = require('./../config/databaseCentral');
const { Client } = require('pg');



const iniciarBancoAlimentosPool = async (db) => {
  try {
    var conex = { ...CONFIGCENTRALIZADA, database: db };
    const pool = new Pool(conex);
    return pool;
  } catch (error) {
    console.error("Error al inicializar el pool:", error);
    throw error;
  }
};



const execTransaccion = async (client, SQL, listaParametros = [], OK = "", msgVacio = "", msgError = null) => {
  try {
    console.log('***********************************');
    console.log(SQL);
    console.log(listaParametros);
    const result = await client.query(SQL, listaParametros);
    return buildResponse(result, OK, msgVacio, msgError);
  } catch (error) {
    console.log("Error en transacción:", error);
    throw new Error(`${msgError ?? 'Error en transacción'}: ${error.message}`);
  }
};


const execCentralizada = async (SQL, OK = "", msgVacio = "", msgError = null) => {
  var conex = CONFIGCENTRALIZADA;
  var client = new Client(conex);
  try {
    client.connect();
    console.log('***********************************')
    console.log(SQL)
    const result = await client.query(SQL);
    return buildResponse(result, OK, msgVacio, msgError);
  } catch (err) {
    console.log("Error conexion Base Centralizada:" + err);
    return handleDatabaseError(err, msgError);
  } finally {
    if (client) {
      await client.end();
    }
  }

};

const execCentralizadaProcedimientos = async (
  SQL,
  listaParametros,
  OK = '',
  msgError = null,
  msgVacio = ''
) => {
  const conex = CONFIGCENTRALIZADA;
  const client = new Client(conex);

  try {
    await client.connect();

    console.log('***********************************');
    console.log(SQL);
    console.log(listaParametros);

    const result = await client.query(SQL, listaParametros);
    return buildResponse(result, OK, msgVacio, msgError);
  } catch (err) {
    console.error('Error conexion Base Centralizada:', err);
    return handleDatabaseError(err, msgError);
  } finally {
    await client.end();
  }
};

const buildResponse = (res, OK, msgVacio, msgError) => {
  const count = res.rowCount == undefined ? 0 : res.rowCount;
  const message = res.rowCount > 0 ? OK : msgVacio;
  const data = res.rows ?? [];
  return { count, message, data };
};

function handleDatabaseError(error, msgError = null) {
  console.error('handleDatabaseError:', error);

  const code = error?.code || 'ERROR_BD';
  const constraint = error?.constraint || null;
  const detail = error?.detail || '';
  const column = error?.column || null;
  const routine = error?.routine || null;

  const response = {
    success: false,
    code,
    constraint,
    mensaje: msgError || 'Error en base de datos.',
    detalle: detail || null,
    columna: column,
    rutina: routine
  };

  const constraintMessages = {
    tb_equipo_externo_stridentificador_key: 'El equipo ya está registrado. El identificador ya existe.',
    tb_equipo_interno_strserie_key: 'Ya existe un equipo con la misma serie.',
    tb_persona_numdocumento_key: 'Ya existe un registro con ese número de documento.'
  };

  if (constraint && constraintMessages[constraint]) {
    response.mensaje = constraintMessages[constraint];
    return response;
  }

  switch (code) {
    case '23505': {
      response.mensaje = 'Ya existe un registro duplicado.';

      if (detail.includes('Key')) {
        const match = detail.match(/\((.*?)\)=\((.*?)\)/);
        if (match) {
          const campo = match[1];
          const valor = match[2];
          response.mensaje = `Ya existe un registro con el valor '${valor}' en el campo '${campo}'.`;
        }
      }

      return response;
    }

    case '23503':
      response.mensaje = 'No se puede guardar o actualizar porque existe una referencia inválida o relacionada.';
      return response;

    case '23502':
      response.mensaje = column
        ? `El campo '${column}' es obligatorio.`
        : 'Faltan campos obligatorios para guardar el registro.';
      return response;

    case '23514':
      response.mensaje = 'Uno de los valores no cumple las reglas permitidas del registro.';
      return response;

    case '22001':
      response.mensaje = column
        ? `El valor ingresado en '${column}' excede la longitud permitida.`
        : 'Uno de los valores excede la longitud permitida.';
      return response;

    case '22P02':
      response.mensaje = 'Uno de los valores ingresados tiene un formato inválido.';
      return response;

    case '22003':
      response.mensaje = 'Uno de los valores numéricos está fuera del rango permitido.';
      return response;

    case '22007':
    case '22008':
      response.mensaje = 'La fecha u hora ingresada no tiene un formato válido.';
      return response;

    case '42883':
      response.mensaje = 'La función o procedimiento SQL no existe o no coincide con los parámetros enviados.';
      return response;

    case '42P01':
      response.mensaje = 'La tabla consultada no existe en la base de datos.';
      return response;

    case '42703':
      response.mensaje = column
        ? `La columna '${column}' no existe en la consulta.`
        : 'Una de las columnas consultadas no existe.';
      return response;

    case '08001':
    case '08006':
      response.mensaje = 'No fue posible establecer conexión con la base de datos.';
      return response;

    case '57014':
      response.mensaje = 'La operación fue cancelada por tiempo de espera o interrupción.';
      return response;

    default:
      response.mensaje =
        msgError ||
        error?.message ||
        'Ocurrió un error inesperado en la base de datos.';
      return response;
  }
}


module.exports = { execCentralizada, execCentralizadaProcedimientos, execTransaccion, iniciarBancoAlimentosPool };
