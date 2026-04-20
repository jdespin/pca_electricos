const { iniciarTransaccion, commitTransaccion, rollbackTransaccion } = require('./transacciones');
const modeloequipointerno = require('../modelo/admin/equipointerno');
const modelocertificado = require('../modelo/admin/certificado');

module.exports.guardarEquipoCertificado = async function (objEquipo, objCertificado) {
    const isEdit = !!(objEquipo.idequipoint || objEquipo.idequipointerno);
    const idEquipoInterno = objEquipo.idequipoint ?? objEquipo.idequipointerno;

    if (!isEdit) {
        const client = await iniciarTransaccion();
        try {
            const equipoResp = await modeloequipointerno.IngresarEquipoInterno(client, objEquipo);
            if (!equipoResp || equipoResp.count === 0) {
                throw new Error("Error al insertar el equipo interno");
            }

            const idNuevo = equipoResp.data[0].idequipointerno;
            objCertificado.idequipointerno = idNuevo;

            const certResp = await modelocertificado.IngresarCertificado(client, objCertificado);
            if (!certResp || certResp.count === 0) {
                throw new Error("Error al insertar el certificado del equipo interno");
            }

            await commitTransaccion(client);

            await modeloequipointerno.ActualizarEquiposVencidos();
            return { success: true };

        } catch (error) {
            await rollbackTransaccion(client);
            console.error("Error en la transacción (crear):", error);
            return { success: false, error: error.message };
        }

    } else {
        const client = await iniciarTransaccion();
        try {
            objCertificado.idequipointerno = idEquipoInterno;

            const certResp = await modelocertificado.ActualizarCertificado(client, objCertificado);
            if (!certResp || certResp.count === 0) {
                throw new Error("No se encontró el certificado para actualizar.");
            }

            await commitTransaccion(client);

        } catch (error) {
            await rollbackTransaccion(client);
            console.error("Error en la transacción (editar):", error);
            return { success: false, error: error.message };
        }

        await modeloequipointerno.RestaurarEquipoCertificado(idEquipoInterno);

        if (objEquipo.strimagen) {
            const imgResp = await modeloequipointerno.ActualizarEquipoImagen(idEquipoInterno, objEquipo.strimagen);
            if (!imgResp || imgResp.count === 0) {
                console.warn("strimagen no actualizada");
            }
        }

        return { success: true };
    }
};
