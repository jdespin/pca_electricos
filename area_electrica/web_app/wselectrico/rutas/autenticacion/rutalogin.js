const express = require('express');
const router = express.Router();
const Request = require("request");
const modelologin = require('../../modelo/autenticacion/login');

router.get('/Login/:Usuario/:Password', async (req, res) => {
    try {
        const nombreUsuario = req.params.Usuario;
        const passwordUsuario = req.params.Password;
        const resultadoLogin = await modelologin.ValidarCredenciales(nombreUsuario, passwordUsuario);
        return res.json({
            success: resultadoLogin.success,
            idUsuario: resultadoLogin.idUsuario,
            mensaje: resultadoLogin.mensaje
        });
    } catch (err) {
        return res.json({
            success: false,
            mensaje: "Error en el proceso de login"
        });
    }
});


router.get('/LoginApp/:Usuario/:Password/:AppType', async (req, res) => {
    try {
        const nombreUsuario = req.params.Usuario;
        const passwordUsuario = req.params.Password;
        const appType = req.params.AppType;

        const resultado = await modelologin.ValidarCredencialesApp(nombreUsuario, passwordUsuario, appType);
        return res.json({
            success: resultado.success,
            idUsuario: resultado.idUsuario ?? null,
            nombre:   resultado.nombre   ?? '',
            apellido: resultado.apellido ?? '',
            correo:   resultado.correo   ?? '',
            roles: resultado.roles ?? [],
            mensaje: resultado.mensaje
        });
    } catch (err) {
        return res.json({
            success: false,
            idUsuario: null,
            roles: [],
            mensaje: "Error en el proceso de login"
        });
    }
});

router.get('/EncriptarToken/:token', async (req, res) => {
    try {
        const token = decodeURIComponent(req.params.token); 
        const TokenEncryptado = await modelologin.EncriptarToken(token); 
        return res.json(TokenEncryptado);
    } catch (error) {
        return res.status(500).json({
            success: false,
            mensaje: "Error en la encriptación del token"
        });
    }
});

router.get('/DesencriptarToken/:token', async (req, res) => {
    try {
        const { token } = req.params;
        if (!token) {
            return res.status(400).json({
                success: false,
                mensaje: "El token proporcionado es inválido o está vacío."
            });
        }
        const TokenDesencryptado = await modelologin.DesencriptarToken(token);
        return res.json(TokenDesencryptado);
    } catch (error) {
        return res.status(500).json({
            success: false,
            mensaje: "Error en la desencriptación del token"
        });
    }
});

module.exports = router;
