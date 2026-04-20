const express = require('express');
const router = express.Router();
const modeloTurno = require('../../modelo/admin/turno');

router.get('/ListadoTurnoTodos', async (req, res) => {
  try {
    const resp = await modeloTurno.ListadoTurnoTodos();
    return res.json({ success: true, datos: resp?.data ?? [] });
  } catch {
    return res.json({ success: false, datos: [] });
  }
});

router.post('/CrearTurno', async (req, res) => {
  const { objTurno } = req.body;
  if (!objTurno?.strturno)
    return res.json({ success: false, mensaje: 'El nombre del turno es requerido' });
  try {
    const resp = await modeloTurno.CrearTurno(objTurno);
    return res.json({ success: true, dato: resp?.data?.[0] ?? null });
  } catch {
    return res.json({ success: false, mensaje: 'Error al crear turno' });
  }
});

router.put('/ActualizarTurno', async (req, res) => {
  const { objTurno } = req.body;
  if (!objTurno?.idturno)
    return res.json({ success: false, mensaje: 'ID de turno requerido' });
  try {
    const resp = await modeloTurno.ActualizarTurno(objTurno);
    return res.json({ success: true, dato: resp?.data?.[0] ?? null });
  } catch {
    return res.json({ success: false, mensaje: 'Error al actualizar turno' });
  }
});

router.put('/ActualizarTurnoEstado/:idTurno/:blEstado', async (req, res) => {
  const { idTurno, blEstado } = req.params;
  try {
    await modeloTurno.ActualizarTurnoEstado(idTurno, blEstado === 'true');
    return res.json({ success: true });
  } catch {
    return res.json({ success: false });
  }
});

module.exports = router;
