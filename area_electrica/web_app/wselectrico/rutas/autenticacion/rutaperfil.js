const express = require('express');
const router = express.Router();
const Request = require("request");
const modeloperfil = require('../../modelo/autenticacion/perfil');
const modelousuario = require('../../modelo/autenticacion/usuario');


router.get('/ListadoPerfilTodos/', async (req, res) => {

    try {
        var listado = await modeloperfil.ListadoPerfilTodos();
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

router.get('/ListadoPerfilUsuarioRoles/:idusuario', async (req, res) => {

    try {
        const idusuario = req.params.idusuario;
        var listado = await modeloperfil.ListadoPerfilUsuarioRoles(idusuario);
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
router.post('/CrearPerfil', async (req, res) => {
    

    const objPerfil = req.body.objPerfil;

    try {

        var ingresoPerfil = await modeloperfil.CrearPerfil(objPerfil);

        
        if (ingresoPerfil.data.length > 0) {
            return res.json({
                success: true,
                datos: ingresoPerfil.data
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

router.put('/ActualizarPerfil', async (req, res) => {

    const objPerfil = req.body.objPerfil;
    try {

        var actualizarPerfil = await modeloperfil.ActualizarPerfil(objPerfil);
        if (actualizarPerfil.data.length > 0) {
            return res.json({
                success: true,
                datos: actualizarPerfil.data
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

router.put('/ActualizarPerfilEstado', async (req, res) => {
    try {
        const cambios = req.body; 

        const rolesEstado = await modeloperfil.ActualizarPerfilesEstado(cambios);
        if (rolesEstado.success) {
            return res.status(200).json({
                success: true,
                datos: rolesEstado.datos,
            });
        } else {
            return res.status(200).json({
                success: false,
                datos: [],
            });
        }
    } catch (err) {
        console.error('Error:', err);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
        });
    }
});
module.exports = router;
