const express = require('express');
const router = express.Router();
const modelo = require('../../modelo/admin/tecnicoturno');

router.get('/ObtenerTurnosTecnicosHoy', async (_req, res) => {
  try {
    const result = await modelo.ObtenerTurnosTecnicosHoy();
    const datos = (result?.data ?? []).map(r => ({
      idusuario: r.idusuario,
      strtipo:   r.strtipo ?? 'TRABAJO',
    }));
    return res.json({ success: true, datos });
  } catch (err) {
    console.error('[GET ObtenerTurnosTecnicosHoy]', err);
    return res.json({ success: false, datos: [] });
  }
});

router.get('/ObtenerTurnosTecnico/:idusuario', async (req, res) => {
  try {
    const { idusuario } = req.params;
    const result = await modelo.ObtenerTurnosTecnico(idusuario);
    console.log('[ObtenerTurnosTecnico] result:', JSON.stringify(result));
    const datos = (result?.data ?? []).map(r => ({ dtfecha: r.dtfecha, strtipo: r.strtipo ?? 'TRABAJO' }));
    return res.json({ success: true, datos });
  } catch (err) {
    console.error('[GET ObtenerTurnosTecnico]', err);
    return res.json({ success: false, datos: [] });
  }
});

router.post('/GuardarTurnosTecnico', async (req, res) => {
  try {
    const { idusuario, dias } = req.body;
    if (!idusuario) return res.json({ success: false, error: 'idusuario requerido.' });
    const result = await modelo.GuardarTurnosTecnico(idusuario, dias ?? []);
    return res.json(result);
  } catch (err) {
    console.error('[POST GuardarTurnosTecnico]', err);
    return res.json({ success: false, error: err.message });
  }
});

module.exports = router;
