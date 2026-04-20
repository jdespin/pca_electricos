const express = require('express');
const router = express.Router();
const Request = require("request");
const modeloempresa = require('../../modelo/empresa/empresa');
const procesoempresa = require('../../procesos/empresa');


router.get('/ListadoEmpresa/:idTipoSolicitud/:idTipoEntidad', async (req, res) => {
    const idTipoSolicitud = req.params.idTipoSolicitud;
    const idTipoEntidad = req.params.idTipoEntidad;
    try {

        var listado = await modeloempresa.ListadoEmpresa(idTipoSolicitud, idTipoEntidad);
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


router.get('/ListadoEmpresasAceptadasActivas/:idTipoSolicitud/:idTipoEntidad', async (req, res) => {
    const idTipoSolicitud = req.params.idTipoSolicitud;
    const idTipoEntidad = req.params.idTipoEntidad;
    try {

        var listado = await modeloempresa.ListadoEmpresasAceptadasActivas(idTipoSolicitud, idTipoEntidad);
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

router.get('/ListadoCargoEmpresaActivos/', async (req, res) => {

    try {

        var listado = await modeloempresa.ListadoCargoEmpresaActivos();
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

router.get('/ObtenerEmpresaRucSolicitudActivo/:strRuc/:idTipoEntidad/:idTipoSolicitud', async (req, res) => {
    const strRuc = req.params.strRuc;
    const idTipoEntidad = req.params.idTipoEntidad;
    const idTipoSolicitud = req.params.idTipoSolicitud;

    try {

        var listado = await modeloempresa.ObtenerEmpresaRucSolicitudActivo(strRuc, idTipoEntidad, idTipoSolicitud);

        if (listado.data.length > 0) {
            return res.json({
                success: true,
                datos: listado.data
            });
        }
        else {
            return res.json({
                success: true,
                mensaje: "No existe una solicitud con esta empresa",
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

router.get('/ObtenerEmpresaDadoRuc/:strRuc', async (req, res) => {
    const strRuc = req.params.strRuc;
    try {

        var listado = await modeloempresa.EncontrarEmpresaRuc(strRuc);
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

router.get('/ObtenerEmpresaDadoId/:idempresa', async (req, res) => {
    const idempresa = req.params.idempresa;
    try {

        var listado = await modeloempresa.ObtenerEmpresaId(idempresa);
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

router.get('/ObtenerAnexoDadoIdEmpresa/:idempresa', async (req, res) => {
    const idempresa = req.params.idempresa;
    try {

        var listado = await modeloempresa.ObtenerAnexoDadoIdEmpresa(idempresa);
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

router.get('/ListadoSucursalEmpresa/:idempresa', async (req, res) => {
    const idempresa = req.params.idempresa;
    try {

        var listado = await modeloempresa.ListadoSucursalEmpresa(idempresa);
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

router.get('/ListadoSucursalEmpresaActivos/:idempresa', async (req, res) => {
    const idempresa = req.params.idempresa;
    try {

        var listado = await modeloempresa.ListadoSucursalActivos(idempresa);
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

router.get('/ObtenerRepresentanteId/:idrepresentante/:idempresa/:idcargo', async (req, res) => {
    const idRepresentate = req.params.idrepresentante;
    const idEmpresa = req.params.idempresa;
    const idCargo = req.params.idcargo;
    try {

        var listado = await modeloempresa.ObtenerRepresentanteId(idRepresentate, idEmpresa, idCargo);
        if (listado.data.length > 0) {
            return res.json({
                success: true,
                datos: listado.data
            });
        }
        else {
            return res.json({
                success: true,
                mensaje: "No existe representante con este id",
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

router.get('/ObtenerRepresentanteAnonimo/:idpersona/:idempresa/:idcargo', async (req, res) => {
    const idPersona = req.params.idpersona;
    const idEmpresa = req.params.idempresa;
    const idCargo = req.params.idcargo;
    try {

        var listado = await modeloempresa.ObtenerRepresentanteIdPersona(idPersona, idEmpresa, idCargo);
        if (listado.data.length > 0) {
            return res.json({
                success: true,
                datos: listado.data
            });
        }
        else {
            return res.json({
                success: true,
                mensaje: "No existe representante Anónimo",
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

router.post('/IngresarEmpresaSolicitud', async (req, res) => {
    try {
        const { objPersona, objEmpresa, objEmpresaAnexo, objSolicitud } = req.body;

        
        const resultado = await procesoempresa.IngresarSolicitudEmpresa(objPersona, objEmpresa, objEmpresaAnexo, objSolicitud);

        
        if (!resultado.success) {
            return res.status(400).json({
                success: false,
                mensaje: resultado.mensaje
            });
        }

        
        return res.status(200).json({
            success: true,
            mensaje: resultado.mensaje
        });

    } catch (error) {
        console.error("Error inesperado en la ruta:", error.message || error);
        return res.status(500).json({
            success: false,
            mensaje: `Error inesperado: ${error.message || "Error desconocido"}`
        });
    }
});

router.post('/IngresarPersonalEmpresa', async (req, res) => {
    const objPersona = req.body.objPersona;

    try {

        
        const resultado = await procesoempresa.IngresarPersonalEmpresa(objPersona);

        
        if (!resultado.success) {
            return res.status(400).json({
                success: false,
                mensaje: resultado.mensaje,
            });
        }

        
        return res.status(200).json({
            success: true,
            mensaje: resultado.mensaje,
            datos: resultado.datos
        });

    } catch (error) {
        console.error("Error inesperado en la ruta:", error.message || error);
        return res.status(500).json({
            success: false,
            mensaje: `Error inesperado: ${error.message || "Error desconocido"}`
        });
    }
});

router.get('/IngresarAnonimoEmpresa/:idpersona/:idempresa/:idcargo', async (req, res) => {
    const idPersona = req.params.idpersona;
    const idEmpresa = req.params.idempresa;
    const idCargo = req.params.idcargo;
    let client = null;

    try {
        const listado = await modeloempresa.RegistrarRepresentante(client, idPersona, idEmpresa,idCargo);

        
        if (listado.data && listado.data.length > 0) {
            const posibleError = listado.data[0];

            
            if (typeof posibleError === 'string' && posibleError.toLowerCase().includes('error')) {
                console.error("Error en procedimiento SQL:", posibleError);
                return res.json({
                    success: false,
                    datos: listado.data
                });
            }

            
            return res.json({
                success: true,
                datos: listado.data
            });
        } else {
            
            return res.json({
                success: false,
                datos: []
            });
        }

    } catch (err) {
        console.error('Error inesperado en el backend:', err);
        return res.json({
            success: false,
            datos: [],
            mensaje: 'Error inesperado en el servidor'
        });
    }
});

router.post('/IngresarSucursal', async (req, res) => {
    

    const objSucursal = req.body.objSucursal;
    let client = null;
    try {

        var ingresoItem = await modeloempresa.CrearSucursal(client, objSucursal);

        
        if (ingresoItem.data.length > 0) {
            return res.json({
                success: true,
                datos: ingresoItem.data
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

router.get('/ActualizarEstadoEmpresa/:idempresa/:empresa_blestado', async (req, res) => {
    const idempresa = req.params.idempresa;
    const empresa_blestado = req.params.empresa_blestado;

    try {
        const listado = await modeloempresa.ActualizarEstadoEmpresa(idempresa, empresa_blestado);

        
        if (listado.data && listado.data.length > 0) {
            const posibleError = listado.data[0];

            
            if (typeof posibleError === 'string' && posibleError.toLowerCase().includes('error')) {
                console.error("Error en procedimiento SQL:", posibleError);
                return res.json({
                    success: false,
                    datos: listado.data
                });
            }

            
            return res.json({
                success: true,
                datos: listado.data
            });
        } else {
            
            return res.json({
                success: false,
                datos: []
            });
        }

    } catch (err) {
        console.error('Error inesperado en el backend:', err);
        return res.json({
            success: false,
            datos: [],
            mensaje: 'Error inesperado en el servidor'
        });
    }
});

router.get('/ActualizarEstadoSolicitudEmpresa/:idSolicitud/:idTipoSolicitud', async (req, res) => {
    const idSolicitud = req.params.idSolicitud;
    const idTipoSolicitud = req.params.idTipoSolicitud;
    try {
        var Informacion = await modeloempresa.ActualizarEstadoSolicitudEmpresa(idSolicitud, idTipoSolicitud);
        if (Informacion.data.length > 0) {

            return res.json({
                success: true,
                datos: Informacion.data
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

router.get('/ListadoRepresentantesEmpresaActivos/:idempresa', async (req, res) => {
    const idempresa = req.params.idempresa;
    try {

        var listado = await modeloempresa.ListadoRepresentantesEmpresaActivos(idempresa);
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

router.post('/IngresarFundacionSolicitud', async (req, res) => {
    try {
        const { objPersona, objCoordinador, objEmpresa, objEmpresaAnexo, objSolicitud } = req.body;

        
        const resultado = await procesoempresa.IngresarSolicitudFundacion(objPersona, objCoordinador, objEmpresa, objEmpresaAnexo, objSolicitud);

        
        if (!resultado.success) {
            return res.status(400).json({
                success: false,
                mensaje: resultado.mensaje
            });
        }

        
        return res.status(200).json({
            success: true,
            mensaje: resultado.mensaje
        });

    } catch (error) {
        console.error("Error inesperado en la ruta:", error.message || error);
        return res.status(500).json({
            success: false,
            mensaje: `Error inesperado: ${error.message || "Error desconocido"}`
        });
    }
});

router.get('/ActualizarEstadoLogicoSolicitudEmpresa/:idSolicitud/:blEstado', async (req, res) => {
    const idSolicitud = req.params.idSolicitud;
    const blEstado = req.params.blEstado;
    try {
        var Informacion = await modeloempresa.ActualizarEstadoLogicoSolicitudEmpresa(idSolicitud, blEstado);
        if (Informacion.data.length > 0) {

            return res.json({
                success: true,
                datos: Informacion.data
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

router.post('/ActualizarEmpresaRepresentante', async (req, res) => {
    try {
        const { objPersona, objEmpresa, objEmpresaAnexo } = req.body;

        
        const resultado = await procesoempresa.ActualizarEmpresaRepresentante(objPersona, objEmpresa, objEmpresaAnexo);

        
        if (!resultado.success) {
            return res.status(400).json({
                success: false,
                mensaje: resultado.mensaje
            });
        }

        
        return res.status(200).json({
            success: true,
            mensaje: resultado.mensaje
        });

    } catch (error) {
        console.error("Error inesperado en la ruta:", error.message || error);
        return res.status(500).json({
            success: false,
            mensaje: `Error inesperado: ${error.message || "Error desconocido"}`
        });
    }
});


module.exports = router;
