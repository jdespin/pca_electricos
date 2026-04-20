const sql = require('pg')
const { Client } = require('pg');
const { execCentralizadaProcedimientos } = require('../../config/execSQLCentralizada.helper');


module.exports.ListarUbicacion = async function (op, idPadre) {
  var sentencia = 'SELECT * FROM central.f_central_ubicacion($1, $2)';
  var listaParametros = [op,idPadre];

  try {
      if (sentencia !== "") {
          const resp = await execCentralizadaProcedimientos(sentencia, listaParametros, "OK", "OK");
        return (resp)
      } else {
          return { data: "vacio sql" };
      }
  } catch (error) {
      console.error("Error al listar ubicaciones:", error.message);
      return { data: "Error: " + error.message };
  }
};


module.exports. DetalleUbicacion= async function (idPadre) {
  var sentencia = 'SELECT * FROM central.f_central_ubicacion($1, $2)';
  var listaParametros = ['JERARQUIA',idPadre];

  try {
      if (sentencia !== "") {
          const resp = await execCentralizadaProcedimientos(sentencia, listaParametros, "OK", "OK");
        return (resp)
      } else {
          return { data: "vacio sql" };
      }
  } catch (error) {
      console.error("Error al listar ubicaciones:", error.message);
      return { data: "Error: " + error.message };
  }
};
