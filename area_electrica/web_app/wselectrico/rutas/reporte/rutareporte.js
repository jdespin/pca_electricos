const express  = require('express');
const archiver = require('archiver');
const sharp    = require('sharp');
const router   = express.Router();
const {
  SincronizarReporte,
  ListarReportes,
  DetalleReporte,
  ObtenerFotoEquipo,
  ObtenerFotosOrden,
} = require('../../modelo/reporte/reporte');
const { GenerarPDFReporte } = require('../../modelo/reporte/generarPDF');

async function aplicarMarcaAgua(buffer) {
  const img  = sharp(buffer);
  const meta = await img.metadata();
  const w    = meta.width  || 800;
  const h    = meta.height || 600;

  const barH = Math.max(40, Math.round(h * 0.07));
  const fs   = Math.round(barH * 0.52);
  const py   = Math.round(barH * 0.5 + fs * 0.35);

  const svg = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
      <rect x="0" y="${h - barH}" width="${w}" height="${barH}" fill="rgba(9,62,128,0.80)"/>
      <text x="${Math.round(w / 2)}" y="${h - barH + py}"
        text-anchor="middle" font-family="Arial,sans-serif"
        font-size="${fs}" font-weight="bold" fill="white" letter-spacing="2">
        COMPANY PCA
      </text>
    </svg>`);

  return img
    .composite([{ input: svg, blend: 'over' }])
    .jpeg({ quality: 88 })
    .toBuffer();
}


router.post('/SincronizarReporte', async (req, res) => {
  try {
    const result = await SincronizarReporte(req.body);
    res.json(result);
  } catch (e) {
    console.error('POST /SincronizarReporte:', e);
    res.status(500).json({ success: false, mensaje: e.message });
  }
});


router.get('/ListarReportes', async (_req, res) => {
  try {
    const result = await ListarReportes();
    res.json(result);
  } catch (e) {
    res.status(500).json({ success: false, mensaje: e.message });
  }
});


router.get('/DetalleReporte/:idorden', async (req, res) => {
  try {
    const result = await DetalleReporte(Number(req.params.idorden));
    res.json(result);
  } catch (e) {
    res.status(500).json({ success: false, mensaje: e.message });
  }
});


router.get('/FotoEquipo/:idfotoequipo', async (req, res) => {
  try {
    const result = await ObtenerFotoEquipo(Number(req.params.idfotoequipo));
    res.json(result);
  } catch (e) {
    res.status(500).json({ success: false, mensaje: e.message });
  }
});


router.get('/GenerarPDF/:idorden', async (req, res) => {
  try {
    const result = await GenerarPDFReporte(Number(req.params.idorden));
    if (!result.success) return res.status(404).json(result);
    const buf = Buffer.isBuffer(result.buffer) ? result.buffer : Buffer.from(result.buffer);
    res.writeHead(200, {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${result.filename}"`,
      'Content-Length': buf.length,
    });
    res.end(buf);
  } catch (e) {
    console.error('GET /GenerarPDF:', e);
    res.status(500).json({ success: false, mensaje: e.message });
  }
});



router.get('/DescargarFotosZIP/:idorden', async (req, res) => {
  try {
    const idorden = Number(req.params.idorden);
    const { fotos } = await ObtenerFotosOrden(idorden);

    if (!fotos.length) {
      return res.status(404).json({ success: false, mensaje: 'No hay fotos para esta orden' });
    }

    res.writeHead(200, {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="fotos_orden_${idorden}.zip"`,
    });

    const archive = archiver('zip', { zlib: { level: 6 } });
    archive.pipe(res);

    const usados = new Map();
    for (const foto of fotos) {
      if (!foto.bytfoto) continue;
      const raw = Buffer.isBuffer(foto.bytfoto) ? foto.bytfoto : Buffer.from(foto.bytfoto);

      let processed;
      try {
        processed = await aplicarMarcaAgua(raw);
      } catch {
        processed = raw;
      }

      const carpeta = (foto.strtipoequipo || 'General').replace(/[/\\]/g, '_');
      let nombre    = (foto.strfilename   || `foto_${foto.idfotoequipo}.jpg`).replace(/[/\\]/g, '_');
      if (!nombre.match(/\.(jpe?g|png|webp)$/i)) nombre += '.jpg';

      const clave = `${carpeta}/${nombre}`;
      const count = usados.get(clave) ?? 0;
      usados.set(clave, count + 1);
      const entrada = count === 0 ? clave : `${carpeta}/${count}_${nombre}`;

      archive.append(processed, { name: entrada });
    }

    await archive.finalize();
  } catch (e) {
    console.error('GET /DescargarFotosZIP:', e);
    if (!res.headersSent) res.status(500).json({ success: false, mensaje: e.message });
  }
});

module.exports = router;
