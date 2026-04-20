const express = require('express');
const router = express.Router();
const Request = require("request");
const modelodisponibilidad = require('../../modelo/admin/disponibilidad');



router.get('/ListadoDisponibilidadActivos/', async (req, res) => {

    try {

        var listado = await modelodisponibilidad.ListadoDisponibilidadActivos();
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
