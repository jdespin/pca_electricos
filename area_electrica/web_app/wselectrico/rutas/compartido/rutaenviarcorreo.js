const express = require('express');
const router = express.Router();
const emailService = require('../../modelo/compartido/enviarcorreo');


router.post('/enviarCorreo', async (req, res) => {
    try {
        const { strAsunto, strBody, lstArchivosAdjuntos, lstReceptores } = req.body;

        const resultado = await emailService.EnviarCorreo({
            strAsunto,
            strBody,
            lstArchivosAdjuntos,
            lstReceptores
        });

        if (resultado.success) {
            return res.json({ success: true, mensaje: 'Correo enviado correctamente.' });
        } else {
            return res.status(500).json({ success: false, mensaje: resultado.mensaje });
        }
    } catch (error) {
        return res.status(500).json({ success: false, mensaje: 'Error: ' + error.message });
    }
});

module.exports = router;
