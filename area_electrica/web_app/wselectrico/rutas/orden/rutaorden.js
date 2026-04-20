const express = require('express');
const router = express.Router();
const modeloOrden = require('../../modelo/orden/orden');

router.post('/CrearOrden', async (req, res) => {
  try {
    const objOrden = req.body.objOrden;
    if (!objOrden) {
      return res.status(400).json({ success: false, mensaje: 'Datos de orden requeridos' });
    }
    const resultado = await modeloOrden.CrearOrdenTrabajo(objOrden);
    if (resultado.success) {
      return res.status(201).json(resultado);
    }
    return res.status(400).json(resultado);
  } catch (err) {
    console.error('Error en /CrearOrden:', err);
    return res.status(500).json({ success: false, mensaje: err.message });
  }
});

router.get('/ListarOrdenes', async (req, res) => {
  try {
    const resultado = await modeloOrden.ObtenerOrdenes(null);
    return res.status(200).json(resultado);
  } catch (err) {
    console.error('Error en /ListarOrdenes:', err);
    return res.status(500).json({ success: false, mensaje: err.message });
  }
});

router.get('/ListarOrdenes/:estado', async (req, res) => {
  try {
    const resultado = await modeloOrden.ObtenerOrdenes(req.params.estado);
    return res.status(200).json(resultado);
  } catch (err) {
    console.error('Error en /ListarOrdenes/:estado:', err);
    return res.status(500).json({ success: false, mensaje: err.message });
  }
});

router.get('/DetalleOrden/:idorden', async (req, res) => {
  try {
    const resultado = await modeloOrden.DetalleOrden(Number(req.params.idorden));
    return res.status(200).json(resultado);
  } catch (err) {
    console.error('Error en /DetalleOrden:', err);
    return res.status(500).json({ success: false, mensaje: err.message });
  }
});

router.put('/CambiarEstado/:idorden', async (req, res) => {
  try {
    const { nuevoEstado, calificacion, observacion } = req.body;
    if (!nuevoEstado) return res.status(400).json({ success: false, mensaje: 'Estado requerido' });
    const resultado = await modeloOrden.CambiarEstadoOrden(Number(req.params.idorden), nuevoEstado, calificacion ?? null, observacion ?? null);
    return res.status(200).json(resultado);
  } catch (err) {
    console.error('Error en /CambiarEstado:', err);
    return res.status(500).json({ success: false, mensaje: err.message });
  }
});

router.delete('/EliminarOrden/:idorden', async (req, res) => {
  try {
    const resultado = await modeloOrden.EliminarOrden(Number(req.params.idorden));
    return res.status(200).json(resultado);
  } catch (err) {
    console.error('Error en /EliminarOrden:', err);
    return res.status(500).json({ success: false, mensaje: err.message });
  }
});

router.put('/ActualizarOrden/:idorden', async (req, res) => {
  try {
    const { objOrden } = req.body;
    if (!objOrden) return res.status(400).json({ success: false, mensaje: 'Datos de orden requeridos' });
    const resultado = await modeloOrden.ActualizarOrden(Number(req.params.idorden), objOrden);
    return res.status(resultado.success ? 200 : 400).json(resultado);
  } catch (err) {
    console.error('Error en /ActualizarOrden:', err);
    return res.status(500).json({ success: false, mensaje: err.message });
  }
});

router.get('/OrdenesUsuario/:idusuario/:estado', async (req, res) => {
  try {
    const resultado = await modeloOrden.ObtenerOrdenesUsuario(req.params.idusuario, req.params.estado);
    return res.status(200).json(resultado);
  } catch (err) {
    return res.status(500).json({ success: false, mensaje: err.message });
  }
});

router.get('/OrdenesEvaluadas/:idusuario', async (req, res) => {
  try {
    const resultado = await modeloOrden.ObtenerOrdenesEvaluadasUsuario(req.params.idusuario);
    return res.status(200).json(resultado);
  } catch (err) {
    return res.status(500).json({ success: false, mensaje: err.message });
  }
});

module.exports = router;
