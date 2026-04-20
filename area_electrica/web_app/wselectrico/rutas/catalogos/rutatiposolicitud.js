const express = require('express');
const router = express.Router();
const Request = require("request");
const modeloproceso = require('../../modelo/catalogos/tiposolicitud.js');



router.get('/ListadoTipoSolicitud/', async (req, res) => {

    try {

        var listado = await modeloproceso.ListadoTipoSolicitud();
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

router.get('/ObtenerTipoSolicitudDadoId/:idTipo', async (req, res) => {
    const idTipo = req.params.idTipo;
    try {

        var listado = await modeloproceso.ObtenerTipoSolicitudDadoId(idTipo);
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

router.get('/CrearTipoSolicitud/:strNombre', async (req, res) => {
    const strNombre = req.params.strNombre;
    try {

        var listado = await modeloproceso.CrearTipoSolicitud(strNombre);
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

router.get('/ActualizarTipoSolicitud/:idTipo/:strNombre', async (req, res) => {
    const idTipo = req.params.idTipo;
    const strNombre = req.params.strNombre;
    try {

        var listado = await modeloproceso.ActualizarTipoSolicitud(idTipo, strNombre);
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

router.get('/ActualizarTipoSolicitudEstado/:idTipo/:blEstado', async (req, res) => {
    const idTipo = req.params.idTipo;
    const blEstado = req.params.blEstado;
    try {

        var listado = await modeloproceso.ActualizarTipoSolicitudEstado(idTipo, blEstado);
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
