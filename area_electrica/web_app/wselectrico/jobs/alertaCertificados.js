const { execCentralizadaProcedimientos } = require('../config/execSQLCentralizada.helper');

async function verificarCertificados() {
  try {
    const certSQL = `
      SELECT c.idcertificado, c.idequipointerno, c.dtfechavencimiento,
             e.strmarca, e.strmodelo
      FROM proceso.tb_certificado_calibracion c
      JOIN proceso.tb_equipo_interno e ON e.idequipointerno = c.idequipointerno
      WHERE c.dtfechavencimiento BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
        AND e.blestado = true
    `;
    const certs = await execCentralizadaProcedimientos(certSQL, [], 'OK', 'Error');

    if (!certs.data || certs.data.length === 0) {
      console.log('[AlertaCertificados] Sin certificados próximos a vencer.');
      return;
    }

    const usersSQL = `
      SELECT DISTINCT u.idusuario
      FROM seguridad.tb_usuario u
      CROSS JOIN LATERAL seguridad.f_central_obtener_roles_usuario(u.idusuario) r
      WHERE u.usuario_blestado = true
        AND (LOWER(r.rol_nombre) IN ('administrador', 'supervisor')
             OR LOWER(r.rol_strnombre) IN ('administrador', 'supervisor'))
    `;
    const users = await execCentralizadaProcedimientos(usersSQL, [], 'OK', 'Error');

    if (!users.data || users.data.length === 0) {
      console.log('[AlertaCertificados] No se encontraron supervisores activos.');
      return;
    }

    let enviadas = 0;
    for (const cert of certs.data) {
      const dias = Math.ceil(
        (new Date(cert.dtfechavencimiento) - new Date()) / (1000 * 60 * 60 * 24)
      );
      const equipo = [cert.strmarca, cert.strmodelo].filter(Boolean).join(' ');
      const titulo = 'Certificado de calibración próximo a vencer';
      const mensaje = `El certificado del equipo "${equipo}" [cert:${cert.idcertificado}] vence en ${dias} día(s). Gestiona su renovación a tiempo.`;

      for (const user of users.data) {
        const checkSQL = `
          SELECT 1 FROM public.tb_notificacion
          WHERE idusuario = $1
            AND strtitulo = $2
            AND strmensaje LIKE $3
            AND dtfechacreacion >= CURRENT_DATE
          LIMIT 1
        `;
        const existe = await execCentralizadaProcedimientos(
          checkSQL,
          [user.idusuario, titulo, `%[cert:${cert.idcertificado}]%`],
          'OK', 'Error'
        );

        if (!existe.data || existe.data.length === 0) {
          await execCentralizadaProcedimientos(
            `INSERT INTO public.tb_notificacion (idusuario, strtitulo, strmensaje) VALUES ($1, $2, $3)`,
            [user.idusuario, titulo, mensaje],
            'OK', 'Error'
          );
          enviadas++;
        }
      }
    }

    console.log(`[AlertaCertificados] ${enviadas} notificación(es) enviadas para ${certs.data.length} certificado(s).`);
  } catch (err) {
    console.error('[AlertaCertificados] Error:', err.message);
  }
}

function programarAlertaDiaria() {
  const ahora = new Date();
  const proximas8am = new Date();
  proximas8am.setHours(8, 0, 0, 0);
  if (proximas8am <= ahora) proximas8am.setDate(proximas8am.getDate() + 1);

  const msHasta8am = proximas8am - ahora;

  setTimeout(() => {
    verificarCertificados();
    setInterval(verificarCertificados, 24 * 60 * 60 * 1000);
  }, msHasta8am);

  console.log(
    `[AlertaCertificados] Programado para las 08:00 (en ${Math.round(msHasta8am / 60000)} minutos).`
  );
}

module.exports = { programarAlertaDiaria };
