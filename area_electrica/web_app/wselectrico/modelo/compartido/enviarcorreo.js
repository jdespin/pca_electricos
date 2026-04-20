const nodemailer = require('nodemailer');
require('dotenv').config();
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.REMITENTE,
        pass: process.env.PASSWORD_APPLICATION
    }
});
module.exports.EnviarCorreo = async function ({ strAsunto, strBody, lstArchivosAdjuntos, lstReceptores }) {
    try {
        
        const bodyDecoded = Buffer.from(strBody, 'base64').toString('utf-8');

        
        const attachments = lstArchivosAdjuntos.map((archivo) => ({
            filename: archivo.nombre,
            content: Buffer.from(archivo.contenidoBase64, 'base64') 
        }));

        
        const mailOptions = {
            from: process.env.REMITENTE,
            to: lstReceptores.map(receptor => receptor.email).join(','), 
            subject: strAsunto,
            html: bodyDecoded, 
            attachments
        };

    
        const info = await transporter.sendMail(mailOptions);
        return {
            success: true,
            mensaje: 'Correo enviado exitosamente',
            info: info
        };
    } catch (error) {
        console.error('Error al enviar el correo:', error.message);
        return {
            success: false,
            mensaje: 'Error al enviar el correo: ' + error.message
        };
    }
};
