const crypto = require('crypto');
const emailService = require('../compartido/enviarcorreo'); 

module.exports.RecuperarPassword = async function (receptor) {
    try {
        if (!receptor) {
            throw new Error('El correo del receptor es obligatorio.');
        }

        
        const codigoRecuperacion = crypto.randomInt(100000, 999999).toString(); 

        
        const plantillaHTML = `
            <html>
            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        background-color: #f4f4f4;
                        margin: 0;
                        padding: 20px;
                    }
                    .email-container {
                        max-width: 600px;
                        margin: 0 auto;
                        background-color: #ffffff;
                        border-radius: 8px;
                        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                        overflow: hidden;
                    }
                    .header {
                        background-color: #4fd124;
                        color: #ffffff;
                        padding: 20px;
                        text-align: center;
                    }
                    .logo {
                        width: 50px;
                        height: 50px;
                        margin-bottom: 10px;
                    }
                    .app-title {
                        font-size: 22px;
                        margin: 0;
                    }
                    .content {
                        padding: 20px;
                        color: #333333;
                        line-height: 1.6;
                    }
                    .footer {
                        background-color: #f4f4f4;
                        text-align: center;
                        padding: 10px;
                        font-size: 12px;
                        color: #666666;
                    }
                </style>
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <h1 class="app-title">Banco de Alimentos Riobamba</h1>
                    </div>
                    <div class="content">
                        <center> <h2> Recuperación de Contraseña</h2>  </center>
                        <p>Hola,</p>
                        <p>Recibimos una solicitud para restablecer tu contraseña. Usa el siguiente código para completar el proceso:</p>
                        <h2 style="text-align: center; color: #4fd124;">${codigoRecuperacion}</h2>
                        <p>Si no realizaste esta solicitud, ignora este correo.</p>
                    </div>
                    <div class="footer">
                        <p>Este correo es generado automáticamente, por favor no respondas.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        
        const resultado = await emailService.EnviarCorreo({
            strAsunto: 'Recuperación de Contraseña',
            strBody: Buffer.from(plantillaHTML).toString('base64'),
            lstArchivosAdjuntos: [],
            lstReceptores: [{ email: receptor }]
        });

        if (!resultado.success) {
            throw new Error(resultado.mensaje);
        }

        
        return {
            success: true,
            mensaje: 'Correo enviado correctamente.',
            codigo: codigoRecuperacion
        };
    } catch (error) {
        console.error('Error en la recuperación de contraseña:', error.message);
        return {
            success: false,
            mensaje: 'Error: ' + error.message
        };
    }
};
