const express = require('express');
const router = express.Router();
const Request = require("request");
const modelotipo = require('../../modelo/catalogos/tipoempresa.js');



router.get('/ListadoTipoEmpresaActivos/', async (req, res) => {

    try {

        var listado = await modelotipo.ListadoTipoEmpresaActivos();
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

router.get('/ListadoTipoEmpresa/', async (req, res) => {

    try {

        var listado = await modelotipo.ListadoTipoEmpresa();
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

router.get('/ObtenerTipoEmpresaDadoId/:idTipoempresa', async (req, res) => {
    const idTipoempresa = req.params.idTipoempresa;
    try {

        var listado = await modelotipo.ObtenerTipoEmpresaDadoId(idTipoempresa);
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

router.get('/CrearTipoEmpresa/:strNombre', async (req, res) => {
    const strNombre = req.params.strNombre;
    try {

        var listado = await modelotipo.CrearTipoEmpresa(strNombre);
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

router.get('/ActualizarTipoEmpresa/:idTipoempresa/:strNombre', async (req, res) => {
    const idTipoempresa = req.params.idTipoempresa;
    const strNombre = req.params.strNombre;
    try {

        var listado = await modelotipo.ActualizarTipoEmpresa(idTipoempresa, strNombre);
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

router.get('/ActualizarTipoEmpresaEstado/:idTipoempresa/:blEstado', async (req, res) => {
    const idTipoempresa = req.params.idTipoempresa;
    const blEstado = req.params.blEstado;
    try {

        var listado = await modelotipo.ActualizarTipoEmpresaEstado(idTipoempresa, blEstado);
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
