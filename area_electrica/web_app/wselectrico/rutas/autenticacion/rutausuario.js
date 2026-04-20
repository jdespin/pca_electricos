const express = require('express');
const router = express.Router();
const Request = require("request");
const modelousuario=require('../../modelo/autenticacion/usuario');
const procesousuarioperfil = require('../../procesos/usuarioperfil');
router.get('/ListadoUsuarioTodos/', async (req, res) => {

    try {

        var listado = await modelousuario.ListadoUsuarioTodos();
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

router.get('/ListadoUsuarioPersonaTodos/', async (req, res) => {

    try {

        var listado = await modelousuario.ListadoUsuarioPersonaTodos();
        const filas = Array.isArray(listado?.data) ? listado.data : [];
        console.log('[RUTA ListadoUsuarioPersonaTodos] filas:', filas.length, '| success en listado:', listado?.success);
        return res.json({
            success: true,
            datos: filas
        });

    } catch (err) {
        console.error('[RUTA ListadoUsuarioPersonaTodos] error:', err);
        return res.json(
            {
                success: false,
                datos: []
            }
        );
    }
});

router.post('/CrearUsuario', async (req, res) => {
  try {
    const objUsuario = req.body?.objUsuario;

    if (!objUsuario) {
      return res.status(400).json({ success: false, error: 'Falta objUsuario', datos: [] });
    }

    const ingresoUsuario = await procesousuarioperfil.guardarPersonaPerfil(objUsuario);

    
    if (ingresoUsuario?.success !== true) {
      return res.status(400).json({
        success: false,
        error: ingresoUsuario?.error ?? 'Error en transacción',
        datos: []
      });
    }

    
    return res.status(200).json({
      success: true,
      mensaje: ingresoUsuario?.mensaje ?? 'Guardado correctamente',
      datos: {
        persona: ingresoUsuario?.persona ?? [],
        usuario: ingresoUsuario?.usuario ?? []
      }
    });

  } catch (err) {
    console.error('Error /CrearUsuario:', err);
    return res.status(500).json({ success: false, error: err.message ?? 'Error interno', datos: [] });
  }
});



router.put('/ActualizarUsuarioCompleto', async (req, res) => {
  try {
    const objUsuario = req.body?.objUsuario;
    if (!objUsuario) return res.status(400).json({ success: false, error: 'Falta objUsuario' });

    const resultado = await procesousuarioperfil.actualizarUsuarioCompleto(objUsuario);

    if (resultado?.success !== true) {
      return res.status(400).json({ success: false, error: resultado?.error ?? 'Error en transacción' });
    }
    return res.status(200).json({ success: true, mensaje: resultado.mensaje });
  } catch (err) {
    console.error('Error /ActualizarUsuarioCompleto:', err);
    return res.status(500).json({ success: false, error: err.message ?? 'Error interno' });
  }
});

router.put('/ActualizarUsuario', async (req, res) => {
    
    const objUsuario = req.body.objUsuario;
    try {

        var actualizarUsuario = await modelousuario.ActualizarUsuario(objUsuario);
        if (actualizarUsuario.data.length > 0) {
            return res.json({
                success: true,
                datos: actualizarUsuario.data
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

router.put('/ActualizarUsuarioEstado/:idUsuario/:blEstado', async (req, res) => {
    const idUsuario = req.params.idUsuario;
    const blEstado = req.params.blEstado;
    try {

        var listado = await modelousuario.ActualizarUsuarioEstado(idUsuario, blEstado);
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

router.get('/ObtenerUsuarioDadoId/:idUsuario', async (req, res) => {
    const idUsuario = req.params.idUsuario;
    try {

        var listado = await modelousuario.ObtenerUsuarioDadoId(idUsuario);
        if (listado.data.length > 0) {
            return res.json({
                success: true,
                datos: listado.data
            });
        }
        else {
            return res.json({
                success: true,
                mensaje: "No existe el Usuario",
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

router.get('/ObtenerUsuarioDadoNombreUsuario/:nombreUsuario', async (req, res) => {
    const nombreUsuario = req.params.nombreUsuario;
    try {

        var listado = await modelousuario.ObtenerUsuarioDadoNombreUsuario(nombreUsuario);
        if (listado.data.length > 0) {
            return res.json({
                success: true,
                datos: listado.data
            });
        }
        else {
            return res.json({
                success: true,
                mensaje: "No existe el Usuario",
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
router.get('/ObtenerUsuarioDadoCorreoUsuario/:correoUsuario', async (req, res) => {
    const correoUsuario = req.params.correoUsuario;
    try {

        var listado = await modelousuario.ObtenerUsuarioDadoCorreoUsuario(correoUsuario);
        if (listado.data.length > 0) {
            return res.json({
                success: true,
                datos: listado.data
            });
        }
        else {
            return res.json({
                success: true,
                mensaje: "No existe el correo asociado",
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
router.delete('/EliminarRegistroUsuario/:idUsuario', async (req, res) => {
    const idUsuario = req.params.idUsuario;
    try {

        var listado = await modelousuario.EliminarRegistroUsuario(idUsuario);
        if (listado.data.length > 0) {
            return res.json({
                success: true,
                datos: listado.data
            });
        }
        else {
            return res.json({
                success: true,
                mensaje: "Usuario Borrado",
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

router.get('/RolesUsuario/:idUsuario', async (req, res) => {
    try {
        const idUsuario = req.params.idUsuario;

        
        const listadoRoles = await modelousuario.ObtenerRolesDadoId(idUsuario);

        
        if (Array.isArray(listadoRoles.data) && listadoRoles.data.length > 0) {
            return res.json({
                success: true,
                roles: listadoRoles.data
            });
        } else {
            return res.json({
                success: false,
                roles: [] 
            });
        }

    } catch (err) {
        
        return res.json({
            success: false,
            roles: [],
            mensaje: "Error al obtener los roles"
        });
    }
});

router.get('/PerfilUsuario/:idusuario', async (req, res) => {
    try {
        const { idusuario } = req.params;
        const perfil = await modelousuario.ObtenerPerfilCompleto(idusuario);
        const dato = perfil?.data?.[0] ?? null;
        if (!dato) return res.json({ success: false, dato: null });
        return res.json({ success: true, dato });
    } catch (err) {
        return res.json({ success: false, dato: null });
    }
});

router.post('/CambiarPassword', async (req, res) => {
    try {
        const { idusuario, passwordActual, passwordNueva } = req.body;
        if (!idusuario || !passwordActual || !passwordNueva) {
            return res.json({ success: false, mensaje: 'Datos incompletos' });
        }
        const resultado = await modelousuario.CambiarPassword(idusuario, passwordActual, passwordNueva);
        return res.json(resultado);
    } catch (err) {
        return res.json({ success: false, mensaje: 'Error interno del servidor' });
    }
});

module.exports = router;
