const express = require('express');
const router = express.Router();
const Request = require("request");
const fs = require("fs");
const modelocentral = require('../../modelo/persona/central');
const procesocentral = require('../../procesos/central');

router.get('/ListadoPersonaTodos/', async (req, res) => {

    try {
        var listado = await modelocentral.ListadoPersonaTodos();
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

router.get('/EncontrarPersonaDadoCedula/:cedula', async (req, res) => {
    const cedula = req.params.cedula;

    try {

        var listado = await modelocentral.EncontrarPersonaDadoCedula(cedula);
        if (listado.data.length > 0) {
            return res.json({
                success: true,
                message: "Cédula registrada",
                datos: listado.data
            });
        }
        else {
            return res.json({
                success: true,
                message: "Cédula no registrada",
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
router.get('/ObtenerPersonaId/:idpersona', async (req, res) => {
    const idpersona = req.params.idpersona;
    try {

        var listado = await modelocentral.EncontrarPersonaDadoId(idpersona);
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
router.get('/ObtenerPersonaFoto/:idpersona', async (req, res) => {
    const idpersona = req.params.idpersona;
    try {

        var listado = await modelocentral.ObtenerFotoDadoId(idpersona);
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


router.post('/IngresarPersona', async function (req, res) {

    console.log("Ingresando persona:", req.body.objPersona);
    console.log("BODY COMPLETO:", req.body);
console.log("HEADERS:", req.headers["content-type"]);


    const objPersona = req.body.objPersona;
    let client = null;
    try {

       
        
        const resultado = await modelocentral.IngresarPersona(client, objPersona);

        
        if (resultado.data.length > 0) {
            return res.json({
                success: true,
                datos: resultado.data
            });
        } else {
            return res.json({
                success: true,
                datos: []
            });
        }
    } catch (err) {

        return res.json({
            success: false,
            datos: []
        });
    }
});



router.post('/IngresarPersonaFoto', async function (req, res) {
    try {
        const objPersona = req.body.objPersona;

        
        const personaExistente = await modelocentral.EncontrarPersonaDadoCedula(objPersona.documento);

        if (personaExistente && personaExistente.count > 0) {
            return res.status(400).json({
                success: false,
                mensaje: "Este documento ya está registrado",
                datos: personaExistente
            });
        }

        
        const resultado = await procesocentral.guardarPersonaConFoto(objPersona);
        if (resultado.success) {
            return res.status(201).json({
                success: true,
                mensaje: "Registro exitoso de la persona",
                datos: resultado
            });
        } else {
            return res.status(500).json({
                success: false,
                mensaje: "Error en el registro de la persona y su foto",
                error: resultado.error
            });
        }
    } catch (err) {
        console.error("Error en la ruta /IngresarPersonaFoto:", err);
        return res.status(500).json({
            success: false,
            mensaje: "Error interno del servidor",
            error: err.message
        });
    }
});

router.put('/ActualizarPersona/', async (req, res) => {
    const objPersona = req.body.objPersona;
    let client = null;
    try {
        var listado = await modelocentral.ActualizarPersona(client, objPersona);
        if (listado.success && listado.data && listado.data.length > 0) {
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


router.put('/ActualizarPersonaFoto', async function (req, res) {
    try {
        const objPersona = req.body.objPersona;

        
        const resultado = await procesocentral.actualizarPersonaConFoto(objPersona);
        if (resultado.success) {
            return res.status(201).json({
                success: true,
                mensaje: "Actualización exitosa de la persona",
                datos: resultado
            });
        } else {
            return res.status(500).json({
                success: false,
                mensaje: "Error en el registro de la persona y su foto",
                error: resultado.error
            });
        }
    } catch (err) {
        console.error("Error en la ruta /ActualizarPersonaFoto:", err);
        return res.status(500).json({
            success: false,
            mensaje: "Error interno del servidor",
            error: err.message
        });
    }
});

router.get('/ActualizarPersonaEstado/:idPersona/:blEstado', async (req, res) => {
    const idPersona = req.params.idPersona;
    const blEstado = req.params.blEstado;
    console.log("idPersona:", idPersona, "blEstado:", blEstado);
    try {

        var listado = await modelocentral.ActualizarPersonaEstado(idPersona, blEstado);
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
