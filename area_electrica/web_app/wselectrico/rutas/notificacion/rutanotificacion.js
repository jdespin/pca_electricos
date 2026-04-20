const express = require('express');
const router = express.Router();
const modeloOrden = require('../../modelo/orden/orden');
const { MarcarTodasNotificacionesLeidas } = require('../../modelo/orden/orden');

router.get('/NotificacionesUsuario/:idUsuario', async (req, res) => {
  try {
    const idUsuario = parseInt(req.params.idUsuario);
    if (!idUsuario) {
      return res.status(400).json({ success: false, datos: [] });
    }
    const resultado = await modeloOrden.ObtenerNotificacionesUsuario(idUsuario);
    return res.json(resultado);
  } catch (err) {
    console.error('Error en /NotificacionesUsuario:', err);
    return res.status(500).json({ success: false, datos: [], mensaje: err.message });
  }
});

router.put('/MarcarLeida/:idnotificacion', async (req, res) => {
  try {
    const idnotificacion = parseInt(req.params.idnotificacion);
    const resultado = await modeloOrden.MarcarNotificacionLeida(idnotificacion);
    return res.json(resultado);
  } catch (err) {
    console.error('Error en /MarcarLeida:', err);
    return res.status(500).json({ success: false, mensaje: err.message });
  }
});

router.put('/MarcarTodasLeidas/:idUsuario', async (req, res) => {
  try {
    const idUsuario = parseInt(req.params.idUsuario);
    const resultado = await MarcarTodasNotificacionesLeidas(idUsuario);
    return res.json(resultado);
  } catch (err) {
    console.error('Error en /MarcarTodasLeidas:', err);
    return res.status(500).json({ success: false, mensaje: err.message });
  }
});

module.exports = router;
