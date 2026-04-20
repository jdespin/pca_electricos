const express = require('express');
const router = express.Router();
const Request = require("request");
const modelorol=require('../../modelo/autenticacion/rol');

router.get('/ListadoRolTodos/', async (req, res) => {

    try {

        var listado = await modelorol.ListadoRolTodos();
        console.log(listado);
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

router.get('/ListadoRolActivos/', async (req, res) => {

    try {

        var listado = await modelorol.ListadoRolActivos();
        console.log(listado);
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


router.post('/CrearRol', async (req, res) => {
    const objRol = req.body.objRol;
    try {
   
        var ingresoRol = await modelorol.CrearRol(objRol);

        if (ingresoRol.data.length > 0) {
            return res.json({
                success: true,
                datos: ingresoRol.data
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


router.put('/ActualizarRol', async (req, res) => {
  
    const objRol = req.body.objRol;
    try {

        var actualizarRol = await modelorol.ActualizarRol(objRol);
        if (actualizarRol.data.length > 0) {
            return res.json({
                success: true,
                datos: actualizarRol.data
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

router.put('/ActualizarRolEstado/:idRol/:blEstado', async (req, res) => {
    const idRol = req.params.idRol;
    const blEstado = req.params.blEstado;
    try {

        var listado = await modelorol.ActualizarRolEstado(idRol, blEstado);
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

router.get('/ObtenerRolDadoId/:idRol', async (req, res) => {
    const idRol = req.params.idRol;
    try {

        var listado = await modelorol.ObtenerRolDadoId(idRol);
        if (listado.data.length > 0) {
            return res.json({
                success: true,
                datos: listado.data
            });
        }
        else {
            return res.json({
                success: true,
                mensaje: "No existe el Rol",
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

router.delete('/EliminarRegistroRol/:idRol', async (req, res) => {
    const idRol = req.params.idRol;
    try {

        var listado = await modelorol.EliminarRegistroRol(idRol);
        if (listado.data.length > 0) {
            return res.json({
                success: true,
                datos: listado.data
            });
        }
        else {
            return res.json({
                success: true,
                mensaje: "Rol Eliminado",
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
