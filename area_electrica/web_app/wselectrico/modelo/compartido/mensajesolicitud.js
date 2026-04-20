const emailService = require('./enviarcorreo'); 

module.exports.mensajeSolicitud = async function (objSolicitud) {
    try {
        
        if (!Array.isArray(objSolicitud.correos) || objSolicitud.correos.length === 0) {
            throw new Error('El campo correos debe ser un array no vacío.');
        }

        const mensaje = objSolicitud.cuerpo; 
        const correos = objSolicitud.correos; 

        
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
            <center> <h2>Solicitud Recibida</h2> </center>
            <p>Hola,</p>
            <p>Hemos recibido la siguiente solicitud:</p>
            <p style="font-style: italic; font-size: 16px;">${mensaje}</p>
            <p>Te informaremos una vez que sea procesada.</p>
        </div>
        <div class="footer">
            <p>Este correo es generado automáticamente, por favor no respondas.</p>
        </div>
    </div>
</body>
</html>
`;

        const strBody = Buffer.from(plantillaHTML).toString('base64');

        
        const correoData = {
            strAsunto: "Solicitud Empresa",
            strBody: strBody,
            lstArchivosAdjuntos: [], 
            lstReceptores: correos.map(email => ({ email: email })) 
        };

        
        const resultado = await emailService.EnviarCorreo(correoData);

        if (!resultado.success) {
            throw new Error(resultado.mensaje);
        }

        return {
            success: true,
            mensaje: 'Correo enviado correctamente.',
            count: correos.length

        };
    } catch (error) {
        console.error('Error en el envío de solicitud:', error.message);
        return {
            success: false,
            mensaje: 'Error: ' + error.message
        };
    }
};
