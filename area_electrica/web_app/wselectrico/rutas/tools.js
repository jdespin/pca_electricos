const pathimage = require('path');
const fs = require("fs");
const moment = require('moment');
require('moment/locale/es');
const pdf = require('html-pdf');

const puppeteer = require('puppeteer');

function imageToBase64(imagePath) {
  const imageData = fs.readFileSync(imagePath);
  return Buffer.from(imageData).toString('base64');
}

function FechaActual() {
  var date = new Date();
  var hour = date.getHours();
  hour = (hour < 10 ? "0" : "") + hour;
  var min = date.getMinutes();
  min = (min < 10 ? "0" : "") + min;
  var sec = date.getSeconds();
  sec = (sec < 10 ? "0" : "") + sec;
  var year = date.getFullYear();
  var month = date.getMonth() + 1;
  month = (month < 10 ? "0" : "") + month;
  var day = date.getDate();
  day = (day < 10 ? "0" : "") + day;
  const currentDate = new Date().toLocaleDateString();
  return currentDate;
}


function calcularAlturaEncabezado(contenidoEncabezado) {
  
  if (!contenidoEncabezado || contenidoEncabezado.trim() === "") {
    return "4.5cm";
  }

  const lineasDeTexto = contenidoEncabezado.split('\n').length; 

  
  if (lineasDeTexto === 18) {
    return "4.5cm";
  }

  const alturaPorLinea = 0.10; 
  const alturaCalculada = lineasDeTexto * alturaPorLinea + 2.5;

  return `${alturaCalculada}cm`; 
}



module.exports.encabezadoOcultoHtml = async function () {
  const imagenheader = pathimage.join(__dirname, '../public/imagenes/logobar2.png');

  try {
    
    const datosOrganizacion = "HOLA";

    
    const contactosHtml = (!datosOrganizacion || !datosOrganizacion.data || datosOrganizacion.data.length === 0)
      ? `<p style="margin: 0; font-size: 11px;">Riobamba - Kilómetro 1 ½ vía a Chambo - 032 626 182</p>` 
      : datosOrganizacion.data.map(organizacion => `
              <p style="margin: 0; font-size: 11px;">
                  ${organizacion.organizacion_strnombre}: ${organizacion.organizacion_strdireccion} - ${organizacion.organizacion_strtelefono}
              </p>
          `).join('');

    
    const base64Image = imageToBase64(imagenheader);

    
    const headerHtml2 = `
          <div style="width: 100%; background-color: #fff;  display: none;"> 
              <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                      <td style="text-align: left; vertical-align: middle; width: 50%; padding: 10px; border: 1px">
                          <img src="data:image/jpeg;base64,${base64Image}" 
                              alt="Header Image" 
                              style="width: 145px; height: auto; border: 1px; padding: 5px; border-radius: 4px;">
                      </td>
                      <td style="text-align: right; vertical-align: middle; width: 50%;">
                          ${contactosHtml}
                      </td>
                  </tr>
                  <tr>
                  <td colspan="2" style="height: 5px; background-color: #a8c263; padding: 0;"></td>
                  </tr>
                </table>
          </div>
      `;

    return headerHtml2;

  } catch (error) {
    console.error('Error obteniendo los datos de la organización o imagen:', error);

    
    const base64Image = imageToBase64(imagenheader); 
    return `
          <div style="width: 100%; background-color: #fff;"> 
              <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                      <td style="text-align: left; vertical-align: middle; width: 50%; padding: 10px; border: 1px">
                          <img src="data:image/jpeg;base64,${base64Image}" 
                              alt="Header Image" 
                              style="width: 145px; height: auto; border: 1px; padding: 5px; border-radius: 4px;">
                      </td>
                      <td style="text-align: right; vertical-align: middle; width: 50%;">
                          <p style="margin: 0; font-size: 11px;">Error obteniendo datos de la organización.</p>
                      </td>
                  </tr>
                  <tr>
                  <td colspan="2" style="height: 5px; background-color: #a8c263; padding: 0;"></td>
                  </tr>
              </table>
          </div>
      `;
  }
};

module.exports.encabezadoHtml = async function () {
  const imagenheader = pathimage.join(__dirname, '../public/imagenes/logobar2.png');

  try {
    
    const datosOrganizacion = "HOLA";

    
    const contactosHtml = (!datosOrganizacion || !datosOrganizacion.data || datosOrganizacion.data.length === 0)
      ? `<p style="margin: 0; font-size: 11px;">Riobamba - Kilómetro 1 ½ vía a Chambo - 032 626 182</p>` 
      : datosOrganizacion.data.map(organizacion => `
                <p style="margin: 0; font-size: 11px;">
                    ${organizacion.organizacion_strnombre}: ${organizacion.organizacion_strdireccion} - ${organizacion.organizacion_strtelefono}
                </p>
            `).join('');

    
    const base64Image = imageToBase64(imagenheader);

    
    const headerHtml2 = `
            <div style="width: 100%; background-color: #fff;"> 
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="text-align: left; vertical-align: middle; width: 50%; padding: 10px; border: 1px">
                            <img src="data:image/jpeg;base64,${base64Image}" 
                                alt="Header Image" 
                                style="width: 145px; height: auto; border: 1px; padding: 5px; border-radius: 4px;">
                        </td>
                        <td style="text-align: right; vertical-align: middle; width: 50%;">
                            ${contactosHtml}
                        </td>
                    </tr>
                    <tr>
                    <td colspan="2" style="height: 5px; background-color: #a8c263; padding: 0;"></td>
                    </tr>
                </table>
            </div>
        `;

    return headerHtml2;

  } catch (error) {
    console.error('Error obteniendo los datos de la organización o imagen:', error);

    
    const base64Image = imageToBase64(imagenheader); 
    return `
            <div style="width: 100%; background-color: #fff;"> 
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="text-align: left; vertical-align: middle; width: 50%; padding: 10px; border: 1px">
                            <img src="data:image/jpeg;base64,${base64Image}" 
                                alt="Header Image" 
                                style="width: 145px; height: auto; border: 1px; padding: 5px; border-radius: 4px;">
                        </td>
                        <td style="text-align: right; vertical-align: middle; width: 50%;">
                            <p style="margin: 0; font-size: 11px;">Error obteniendo datos de la organización.</p>
                        </td>
                    </tr>
                    <tr>
                    <td colspan="2" style="height: 5px; background-color: #a8c263; padding: 0;"></td>
                    </tr>
                </table>
            </div>
        `;
  }
};


module.exports.piepaginaHtml = function () {
  var imagenfooter = pathimage.join(__dirname, '../public/imagenes/logobar.png');
  const footerHtml = `<div style="text-align: center;">
        <img src="data:image/jpeg;base64,${imageToBase64(imagenfooter)}" alt="Footer Image" style="width: 300px;height: 30px">
        <p style='text-align: right;font-size: 10px;'>Fecha impresión : <strong>${FechaActual()} </strong> </p>
    
    </div> `;
  return footerHtml
}
module.exports.piepaginaOcultoHtml = function () {
  var imagenfooter = pathimage.join(__dirname, '../public/imagenes/logobar.png');
  const footerHtml2 = `<div style="text-align: center;display:none">
        <img src="data:image/jpeg;base64,${imageToBase64(imagenfooter)}" alt="Footer Image" style="width: 300px;height: 30px">
        <p style='text-align: right;font-size: 11px;'> Fecha impresión : <strong>${FechaActual()} </strong> </p>
       
    </div>`;
  return footerHtml2
}

module.exports.convertirfechaformato = function (fecha) {
  let day = fecha.getDate()
  let month = fecha.getMonth() + 1
  let year = fecha.getFullYear()
  var fecha = "";
  if (month < 10) {
    month = "0" + month
  }
  if (day < 10) {
    day = "0" + day
  }
  var fechaformato = year + "-" + month + "-" + day
  return fechaformato
}

module.exports.ConvertirFormatoFecha = function (fechaStr) {
  
  const fecha = moment(fechaStr);

  
  const nombreDiaSemana = fecha.format("dddd");

  
  const diaMes = fecha.format("DD");

  
  const nombreMes = fecha.format("MMMM");

  
  const año = fecha.format("YYYY");

  
  let hora = fecha.format("hh");
  const minuto = fecha.format("mm");

  
  const amPm = fecha.format("a");

  
  if (hora === '00') {
    hora = '12';
  }

  
  const fechaFormateada = `${nombreDiaSemana} ${diaMes} de ${nombreMes} del ${año} hora ${hora}:${minuto}${amPm}`;

  return fechaFormateada;
}


module.exports.CalcularDiferenciaEnAniosYMeses = function (fechaInicio, fechaFin) {
    
    if (!fechaInicio || !fechaFin) {
        console.error("Una de las fechas no es válida:", fechaInicio, fechaFin);
        return { años: NaN, meses: NaN };
    }

    const startDate = new Date(fechaInicio);
    const endDate = new Date(fechaFin);

    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.error("Error al crear las fechas:", startDate, endDate);
        return { años: NaN, meses: NaN };
    }

    let años = endDate.getFullYear() - startDate.getFullYear();
    let meses = endDate.getMonth() - startDate.getMonth();

    
    if (meses < 0) {
        años--;
        meses += 12;
    }

    return { años, meses };
};

module.exports.Generarpdfhtml = function (htmlCompleto, options) {
  return new Promise((resolve, reject) => {
    pdf.create(htmlCompleto, options).toFile("reportes1.pdf", function (err, res) {
      if (err) {
        reject(err);
      } else {
        fs.readFile(res.filename, (err, data) => {
          if (err) {
            reject(err);
          } else {
            const base64Data = Buffer.from(data).toString('base64');
            fs.unlink(res.filename, (err) => {
              if (err) {
                console.error('Error al eliminar el archivo PDF:', err);
              } else {
                console.log('Archivo PDF eliminado.');
              }
            });

            
            resolve(base64Data);
          }
        });
      }
    });
  });
}

module.exports.Generarpdfhtml = async function (htmlCompleto, options = {}) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'], 
  });

  try {
    const page = await browser.newPage();
    await page.setContent(htmlCompleto, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: options.format || 'A4',
      printBackground: true,
      ...options,
    });

    await browser.close();

    
    const base64Data = pdfBuffer.toString('base64');
    return base64Data;
  } catch (error) {
    await browser.close();
    throw error;
  }
};

module.exports.calcularAlturaEncabezado = calcularAlturaEncabezado;

module.exports.FechaActual = FechaActual;
