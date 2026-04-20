const express = require('express');
const router = express.Router();
const Request = require("request");
const modelotipoequipo = require('../../modelo/admin/tipoequipo.js');



router.get('/ListadoTipoEquipoActivo/', async (req, res) => {

    try {

        var listado = await modelotipoequipo.ListadoTipoEquipoActivo();
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
