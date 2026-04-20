const express = require('express');
const router = express.Router();
const Request = require("request");
const fs = require("fs");
const modeloequipoexterno = require('../../modelo/admin/equipoexterno');

router.post('/VerificarIdentificadorEquipoExterno', async function (req, res) {
  try {
    const stridentificador = req.body.stridentificador;
    const idequipoext = req.body.idequipoext ?? null;

    const resultado = await modeloequipoexterno.VerificarIdentificadorEquipoExterno(
      null,
      stridentificador,
      idequipoext
    );

    if (resultado.success) {
      return res.status(200).json(resultado);
    }

    return res.status(400).json(resultado);
  } catch (err) {
    console.error('Error en la ruta /VerificarIdentificadorEquipoExterno:', err);

    return res.status(500).json({
      success: false,
      mensaje: err?.message || 'Error interno del servidor'
    });
  }
});

router.post('/IngresarEquipoExterno', async function (req, res) {
  try {
    const objEquipo = req.body.objEquipo;

    const resultado = await modeloequipoexterno.IngresarEquipoExterno(null, objEquipo);

    if (resultado.success) {
      return res.status(201).json({
        success: true,
        mensaje: resultado.mensaje,
        datos: resultado.datos
      });
    }

    return res.status(resultado.code === '23505' ? 409 : 400).json({
      success: false,
      mensaje: resultado.mensaje
    });
  } catch (err) {
    console.error("Error en la ruta /IngresarEquipoExterno:", err);

    return res.status(500).json({
      success: false,
      mensaje: err?.message || 'Error interno del servidor'
    });
  }
});

router.get('/ListadoEquiposExternos/', async (req, res) => {

    try {

        var listado = await modeloequipoexterno.ListadoEquiposExternos();
        if (listado.data.length > 0) {
            return res.json({
                success: true,
                datos: listado.data
            });
        }
        else {
            return res.json({
                success: true,
                datos: []
            });
        }

    } catch (err) {
        
        return res.json(
            {
                success: false,
                datos: []
            }
        );
    }
});


router.get('/EquipoExternoIdentificador/:identificador', async (req, res) => {
    const { identificador } = req.params;

    try {

        var listado = await modeloequipoexterno.EquipoExternoIdentificador(identificador);
        if (listado.data.length > 0) {
            return res.json({
                success: true,
                datos: listado.data
            });
        }
        else {
            return res.json({
                success: true,
                datos: []
            });
        }

    } catch (err) {
        
        return res.json(
            {
                success: false,
                datos: []
            }
        );
    }
});

module.exports = router;
