const express = require('express');
const router = express.Router();
const Request = require("request");
const modeloproceso = require('../../modelo/catalogos/situacionlaboral');



router.get('/ListadoSituacionLaboral/', async (req, res) => {

    try {
        var listado = await modeloproceso.ListadoSituacionLaboral();
        if (listado.data.length >0) {
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
router.get('/ObtenerSituacionLaboralDadoId/:idSituacion', async (req, res) => {
    const idSituacion = req.params.idSituacion;
    try {

        var listado = await modeloproceso.ObtenerSituacionLaboralDadoId(idSituacion);
        if (listado.data.length >0) {
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
router.get('/CrearSituacionLaboral/:strNombre', async (req, res) => {
    const strNombre = req.params.strNombre;
    try {

        var listado = await modeloproceso.CrearSituacionLaboral(strNombre);
        if (listado.data.length >0) {
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
router.get('/ActualizarSituacionLaboral/:idSituacion/:strNombre', async (req, res) => {
    const idSituacion = req.params.idSituacion;
    const strNombre = req.params.strNombre;
    try {

        var listado = await modeloproceso.ActualizarSituacioLaboral(idSituacion,strNombre);
        if (listado.data.length >0) {
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
router.get('/ActualizarSituacionLaboralEstado/:idSituacion/:blEstado', async (req, res) => {
    const idSituacion = req.params.idSituacion;
    const blEstado = req.params.blEstado;
    try {

        var listado = await modeloproceso.ActualizarSituacionLaboralEstado(idSituacion,blEstado);
        if (listado.data.length >0) {
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
