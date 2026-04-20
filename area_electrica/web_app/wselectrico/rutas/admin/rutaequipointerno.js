const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require("fs");
const procesoequipo = require('../../procesos/equipointerno');
const modeloequipointerno = require('../../modelo/admin/equipointerno');
const modelodisponibilidad = require('../../modelo/admin/disponibilidad');

router.post('/IngresarEquipoInternoCertificado', async function (req, res) {
    try {
        const objEquipo = req.body.objEquipo;
        const objCertificado = req.body.objCertificado;

        if (objEquipo.archivoImagen?.base64) {
            const imgsDir = path.join(__dirname, '../../public/imagenes_equipos');
            if (!fs.existsSync(imgsDir)) {
                fs.mkdirSync(imgsDir, { recursive: true });
            }
            const ext = (objEquipo.archivoImagen.nombre ?? 'imagen').split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '') || 'jpg';
            const filename = `img_${Date.now()}.${ext}`;
            fs.writeFileSync(
                path.join(imgsDir, filename),
                Buffer.from(objEquipo.archivoImagen.base64, 'base64')
            );
            objEquipo.strimagen = filename;
        }
        delete objEquipo.archivoImagen;

        if (objCertificado.archivoPDF?.base64) {
            const uploadsDir = path.join(__dirname, '../../public/certificados');
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }
            const nombreOriginal = (objCertificado.archivoPDF.nombre ?? 'certificado')
                .replace(/[^a-zA-Z0-9_\-\.]/g, '_')
                .replace(/\.pdf$/i, '');
            const filename = `cert_${Date.now()}_${nombreOriginal}.pdf`;
            fs.writeFileSync(
                path.join(uploadsDir, filename),
                Buffer.from(objCertificado.archivoPDF.base64, 'base64')
            );
            objCertificado.strcertificado = filename;
        }
        delete objCertificado.archivoPDF;

        if (objEquipo.strdisponibilidad && !objEquipo.iddisponibilidad) {
            const listaDisp = await modelodisponibilidad.ListadoDisponibilidadActivos();
            const keyword = objEquipo.strdisponibilidad.toLowerCase();
            const match = (listaDisp.data ?? []).find(d =>
                (d.strdisponibilidad ?? '').toLowerCase().includes(keyword) ||
                keyword.includes((d.strdisponibilidad ?? '').toLowerCase())
            );
            objEquipo.iddisponibilidad = match?.iddisponibilidad ?? null;
        }

        const resultado = await procesoequipo.guardarEquipoCertificado(objEquipo, objCertificado);
        if (resultado.success) {
            return res.status(201).json({
                success: true,
                mensaje: "Registro exitoso del equipo interno y su certificado",
                datos: resultado
            });
        } else {
            return res.status(500).json({
                success: false,
                mensaje: "Error en el registro del equipo interno y su certificado",
                error: resultado.error
            });
        }
    } catch (err) {
        console.error("Error en la ruta /IngresarEquipoInternoCertificado:", err);
        return res.status(500).json({
            success: false,
            mensaje: "Error interno del servidor",
            error: err.message
        });
    }
});


router.get('/ListadoEquiposInternos/', async (req, res) => {
    try {
        await modeloequipointerno.ActualizarEquiposVencidos();
        var listado = await modeloequipointerno.ListadoEquiposInternos();
        return res.json({
            success: true,
            datos: listado.data ?? []
        });
    } catch (err) {
        return res.json({ success: false, datos: [] });
    }
});

router.get('/ListadoEquipoPorPrueba/:idtipoprueba', async (req, res) => {
    const { idtipoprueba } = req.params;
    try {
        await modeloequipointerno.ActualizarEquiposVencidos();
        var listado = await modeloequipointerno.ListadoEquipoPorPrueba(idtipoprueba);
        return res.json({
            success: true,
            datos: listado.data ?? []
        });
    } catch (err) {
        return res.json({ success: false, datos: [] });
    }
});

router.get('/EquiposLibres', async (req, res) => {
    try {
        const resultado = await modeloequipointerno.EquiposLibres();
        return res.json({ success: true, datos: resultado.data ?? [] });
    } catch (err) {
        return res.json({ success: false, datos: [] });
    }
});

router.get('/MiEquipoActivo/:idusuario', async (req, res) => {
    const { idusuario } = req.params;
    try {
        const resultado = await modeloequipointerno.MiEquipoActivo(idusuario);
        return res.json({ success: true, datos: resultado.data ?? [] });
    } catch (err) {
        return res.json({ success: false, datos: [] });
    }
});

router.post('/ReservarEquipo', async (req, res) => {
    const { idequipointerno, idusuario, strnombretecnico } = req.body;
    try {
        const resultado = await modeloequipointerno.CambiarDisponibilidad(
            idequipointerno, 'Ocupado', idusuario, strnombretecnico
        );

        try {
            const equipoResp = await modeloequipointerno.QueryLibre(
                `SELECT strequipo FROM proceso.tb_equipo_interno WHERE idequipointerno = $1`,
                [idequipointerno]
            );
            const nombreEquipo = equipoResp.data?.[0]?.strequipo ?? `Equipo #${idequipointerno}`;

            const supsResp = await modeloequipointerno.QueryLibre(
                `SELECT DISTINCT u.idusuario
                   FROM seguridad.tb_usuario u
                   JOIN seguridad.tb_perfil p ON p.idusuario = u.idusuario
                   JOIN seguridad.tb_rol r ON r.idrol = p.idrol
                  WHERE LOWER(r.rol_strnombre) LIKE '%supervis%'
                    AND u.usuario_blestado = TRUE`,
                []
            );

            for (const sup of (supsResp.data ?? [])) {
                await modeloequipointerno.QueryLibre(
                    `INSERT INTO public.tb_notificacion (idusuario, idequipointerno, strtitulo, strmensaje)
                     VALUES ($1, $2, $3, $4)`,
                    [
                        sup.idusuario,
                        idequipointerno,
                        'Equipo solicitado',
                        `${strnombretecnico} ha solicitado el equipo "${nombreEquipo}".`
                    ]
                );
            }
        } catch (_) {}

        return res.json({ success: resultado.success ?? true });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

router.post('/DevolverEquipo', async (req, res) => {
    const { idequipointerno, idusuario } = req.body;
    try {
        const resultado = await modeloequipointerno.CambiarDisponibilidad(
            idequipointerno, 'Libre', idusuario, null
        );

        try {
            const [equipoResp, tecnicoResp] = await Promise.all([
                modeloequipointerno.QueryLibre(
                    `SELECT strequipo FROM proceso.tb_equipo_interno WHERE idequipointerno = $1`,
                    [idequipointerno]
                ),
                modeloequipointerno.QueryLibre(
                    `SELECT TRIM(COALESCE(p.strnombres,'') || ' ' || COALESCE(p.strapellidos,'')) AS nombre
                       FROM seguridad.tb_usuario u
                       JOIN central.tb_persona p ON p.idpersona = u.usuario_idpersona
                      WHERE u.idusuario = $1`,
                    [idusuario]
                ),
            ]);

            const nombreEquipo = equipoResp.data?.[0]?.strequipo ?? `Equipo #${idequipointerno}`;
            const nombreTecnico = tecnicoResp.data?.[0]?.nombre ?? `Usuario #${idusuario}`;

            const supsResp = await modeloequipointerno.QueryLibre(
                `SELECT DISTINCT u.idusuario
                   FROM seguridad.tb_usuario u
                   JOIN seguridad.tb_perfil p ON p.idusuario = u.idusuario
                   JOIN seguridad.tb_rol r ON r.idrol = p.idrol
                  WHERE LOWER(r.rol_strnombre) LIKE '%supervis%'
                    AND u.usuario_blestado = TRUE`,
                []
            );

            for (const sup of (supsResp.data ?? [])) {
                await modeloequipointerno.QueryLibre(
                    `INSERT INTO public.tb_notificacion (idusuario, idequipointerno, strtitulo, strmensaje)
                     VALUES ($1, $2, $3, $4)`,
                    [
                        sup.idusuario,
                        idequipointerno,
                        'Equipo devuelto',
                        `${nombreTecnico} ha devuelto el equipo "${nombreEquipo}".`
                    ]
                );
            }
        } catch (_) {}

        return res.json({ success: resultado.success ?? true });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

router.post('/CambiarDisponibilidad', async (req, res) => {
    const { idequipointerno, strdisponibilidad } = req.body;
    try {
        const estadoActual = await modeloequipointerno.GetEstadoEquipo(idequipointerno);
        const dispActual = (estadoActual.data?.[0]?.strdisponibilidad ?? '').toLowerCase();
        if (dispActual.includes('ocup')) {
            return res.json({ success: false, mensaje: 'No puede cambiar el estado de un equipo que está siendo utilizado por un técnico.' });
        }

        const resultado = await modeloequipointerno.CambiarDisponibilidad(
            idequipointerno, strdisponibilidad, null, null
        );

        if ((strdisponibilidad ?? '').toLowerCase() === 'mantenimiento') {
            await modeloequipointerno.SetEstadoEquipo(idequipointerno, false);
        }

        return res.json({ success: resultado.success ?? true });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

router.post('/ToggleEstadoEquipo', async (req, res) => {
    const { idequipointerno, blestado } = req.body;
    try {
        const estadoActual = await modeloequipointerno.GetEstadoEquipo(idequipointerno);
        const dispActual = (estadoActual.data?.[0]?.strdisponibilidad ?? '').toLowerCase();

        if (blestado === false && dispActual.includes('ocup')) {
            return res.json({ success: false, mensaje: 'No se puede desactivar un equipo que está siendo utilizado por un técnico.' });
        }
        if (blestado === true && dispActual.includes('ocup')) {
            return res.json({ success: false, mensaje: 'No se puede activar un equipo con estado Ocupado.' });
        }

        await modeloequipointerno.SetEstadoEquipo(idequipointerno, blestado);
        return res.json({ success: true });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

router.get('/ReporteUsoEquipo', async (req, res) => {
    const { desde, hasta } = req.query;
    try {
        const sentencia = `
            SELECT u.iduso,
                   u.strnombretecnico,
                   e.strequipo,
                   e.strserie,
                   e.strmarca,
                   e.strmodelo,
                   u.dtfechainicio,
                   u.dtfechafin,
                   u.blactivo
              FROM proceso.tb_uso_equipo u
              JOIN proceso.tb_equipo_interno e ON e.idequipointerno = u.idequipointerno
             WHERE ($1::DATE IS NULL OR u.dtfechainicio::DATE >= $1::DATE)
               AND ($2::DATE IS NULL OR u.dtfechainicio::DATE <= $2::DATE)
             ORDER BY u.dtfechainicio DESC
        `;
        const resultado = await modeloequipointerno.QueryLibre(sentencia, [desde ?? null, hasta ?? null]);
        return res.json({ success: true, datos: resultado.data ?? [] });
    } catch (err) {
        return res.json({ success: false, datos: [] });
    }
});

module.exports = router;
