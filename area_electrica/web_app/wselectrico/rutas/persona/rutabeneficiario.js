const express = require('express');
const router = express.Router();
const Request = require("request");
const fs = require("fs");
const modelobeneficiario = require('../../modelo/persona/beneficiario');

router.get('/ListadoTipoBono/', async (req, res) => {

    try {

        var listado = await modelobeneficiario.ListadoTipoBono();
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
