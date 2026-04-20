const { execCentralizadaProcedimientos, execTransaccion } = require('../../config/execSQLCentralizada.helper');

module.exports.IngresarCertificado = async function (client, objCertificado) {
  const sentencia =
    'SELECT * FROM proceso.f_central_certificado_calibracion($1,$2,$3,$4,$5,$6,$7,$8)';
  const listaParametros = [
    'IN',
    null,
    objCertificado.idequipointerno,
    objCertificado.strcertificado,
    objCertificado.dtfechaemision,
    objCertificado.dtfechavencimiento,
    objCertificado.strdescripcion,
    null,
  ];

  try {
    if (client) {
      return await execTransaccion(client, sentencia, listaParametros, "Certificado Registrado", "No se pudo registrar certificado");
    }
    return await execCentralizadaProcedimientos(sentencia, listaParametros, "OK", "OK");
  } catch (error) {
    return { success: false, mensaje: error.message };
  }
};

// SQL directo — funciona sin necesidad de migrar el stored proc
module.exports.ActualizarCertificado = async function (client, objCertificado) {
  const sentencia = `
    UPDATE proceso.tb_certificado_calibracion SET
      strcertificado     = COALESCE(NULLIF($1::TEXT, ''), strcertificado),
      dtfechaemision     = $2::DATE,
      dtfechavencimiento = $3::DATE,
      strdescripcion     = $4
    WHERE idcertificado = (
      SELECT idcertificado
        FROM proceso.tb_certificado_calibracion
       WHERE idequipointerno = $5
       ORDER BY idcertificado DESC
       LIMIT 1
    )
    RETURNING idcertificado
  `;
  const listaParametros = [
    objCertificado.strcertificado || null,
    objCertificado.dtfechaemision,
    objCertificado.dtfechavencimiento,
    objCertificado.strdescripcion,
    objCertificado.idequipointerno,
  ];

  return await execTransaccion(
    client, sentencia, listaParametros,
    "Certificado actualizado",
    "No se encontró certificado para actualizar",
    "Error al actualizar certificado"
  );
};
