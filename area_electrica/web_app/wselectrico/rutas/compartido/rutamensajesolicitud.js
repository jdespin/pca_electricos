const express = require('express');
const router = express.Router();
const procesoguardarmensajedonante = require('../../procesos/donantepersona');
const procesoguardarsolicitudmensaje = require('../../procesos/empresa');

router.post('/mensajeSolicitud', async (req, res) => {
    try {

        const objSolicitud = req.body;
        const resultado = await procesoguardarsolicitudmensaje.GuardarSolicitudMensaje(objSolicitud);
        
        if (resultado.success) {
            res.json(resultado); 
        } else {
            res.status(500).json(resultado);
        }
    } catch (error) {
        res.status(500).json({ success: false, mensaje: 'Error interno del servidor.' });
    }
});

router.post('/mensajeSolicitudDonante', async (req, res) => {
    try {

        const objSolicitud = req.body;
        const resultado = await procesoguardarmensajedonante.GuardarSolicitudMensajeDonante(objSolicitud);
        
        if (resultado.success) {
            res.json(resultado); 
        } else {
            res.status(500).json(resultado);
        }
    } catch (error) {
        res.status(500).json({ success: false, mensaje: 'Error interno del servidor.' });
    }
});


module.exports = router;
