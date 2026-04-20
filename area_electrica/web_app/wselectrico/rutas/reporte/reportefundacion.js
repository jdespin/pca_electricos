const express = require('express');
const router = express.Router();
const reportesprocesos = require('./reportesprocesos');



router.post('/pdfDonacionPrevisualizacion', async function (req, res) {
    try {
        const objPrevisualizacion = req.body.objPrevisualizacion;

        var pdfSolicitud = await reportesprocesos.PdfReporteDonacion(objPrevisualizacion);
        if (pdfSolicitud != "") {
            return res.json({
                success: true,
                ingreso: true,
                mensaje: "pdf base 64generado",
                datos: pdfSolicitud
            });
        } else {
            return res.json({
                success: false,
                ingreso: true,
                mensaje: "pdf base 64 vacio",
                datos: ""
            });
        }
    } catch (err) {
        console.log('Error: ' + err)
    }
});

router.post('/PdfActaEntrega', async function (req, res) {
    try {
        const { usuarioLogeado, objFundacion, objDetalleKits, objDetalleContenedor } = req.body.objPrevisualizacion;

        console.log("DATOS",usuarioLogeado, objFundacion, objDetalleKits, objDetalleContenedor  )
        var pdfDonacion = await reportesprocesos.PdfActaEntrega(usuarioLogeado, objFundacion,  objDetalleKits, objDetalleContenedor);
        if (pdfDonacion != "") {
            return res.json({
                success: true,
                ingreso: true,
                mensaje: "pdf base 64generado",
                datos: pdfDonacion
            });
        } else {
            return res.json({
                success: true,
                ingreso: true,
                mensaje: "pdf base 64 vacio",
                datos: ""
            });
        }
    } catch (err) {
        console.log('Error: ' + err)
    }
});

module.exports = router;
