const express = require('express');
const router = express.Router();
const tools = require('../tools'); 
const modelocentral = require('../../modelo/persona/central');



function replacePlaceholders(template, replacements) {
    return template.replace(/\+([A-Z_]+)\+/g, (_, key) => {
        return replacements[key] || `+${key}+`;
    });
}

module.exports.PrevisualizacionpdfContrato = async function (objPrevisualizacion) {
    try {
        var pdfConvenio = await pdfContratoP(objPrevisualizacion);
        return pdfConvenio
    } catch (error) {
        console.log(error);
    }
};

async function pdfContratoP(objPrevisualizacion) {
  try {
    if (!objPrevisualizacion) {
      console.warn('Generando PDF con datos incompletos, verifique los campos.');
    }

    const encabezadoHtml = await tools.encabezadoOcultoHtml();
    const alturaEncabezado = tools.calcularAlturaEncabezado(encabezadoHtml);

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          @font-face {
            font-family: 'Calibri';
            src: local('Calibri');
          }

          body {
            font-family: 'Calibri', sans-serif;
            font-size: 16px;
            color: #000000;
            text-align: justify;
            line-height: 1.15;
            box-sizing: border-box;
          }

          .container {
            max-width: 100%;
            padding: 20px;
            margin-top: 0;
          }

          h3, h2 {
            font-weight: bold;
            margin: 0;
            padding: 0;
            color: #000000;
            text-align: justify;
          }

          .clause-title {
            margin-top: 20px;
            text-align: justify;
            font-weight: bold;
          }

          .subclause-title {
            margin-left: 1cm;
            text-align: justify;
            font-weight: bold;
          }


          ul.items {
            margin-left: 1.2cm;
            padding-left: 1.5cm;
            list-style-position: outside;
            text-align: justify;
          }

          ul.items li {
            text-align: justify;
            text-indent: 0cm;
            padding-left: 0.2cm;
            margin-bottom: 8px;
          }

          .subclause-title,
          .subclause > p,
          .subclause .items {
            margin-left: 0cm;
            text-align: justify;
          }

          p {
            text-align: justify;
            margin-bottom: 8px;
          }

          .firma-table {
            width: 100%;
            margin-top: 50px;
            border-collapse: collapse;
          }

          .firma-line {
            border-top: 1.5px solid #000;
            width: 75%;         /* más corta que el 95% anterior */
            margin: 10px auto;   /* centrada y con menos espacio */
          }


          .firma-content p {
            margin: 5px 0;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h3>${objPrevisualizacion.contrato_strtitulo || ''}</h3>
          <p>${objPrevisualizacion.contrato_strdescripcion || ''}</p>

          ${objPrevisualizacion.clausulas.map(clausula => {
            return `
              <div class="clause">
                <p class="clause-title">${clausula.clausula_titulo || ''} .-</p>
                ${clausula.clausula_descripcion ? `<p>${clausula.clausula_descripcion}</p>` : ''}

                ${clausula.subclausulas.map(subclausula => {
                  
                  const contieneLi = subclausula.items.some(item =>
                    (item.item_titulo && item.item_titulo.includes('<li')) ||
                    (item.item_descripcion && item.item_descripcion.includes('<li'))
                  );

                  let itemsHtml = '';

                  if (contieneLi) {
                    itemsHtml = `
                      <ul class="items">
                        ${subclausula.items.map(item => {
                          const titulo = item.item_titulo || '';
                          const descripcion = item.item_descripcion || '';
                          return `${titulo}${descripcion}`;
                        }).join('')}
                      </ul>
                    `;
                  } else {
                    itemsHtml = `
                      <div class="items">
                        ${subclausula.items.map(item => {
                          const titulo = item.item_titulo || '';
                          const descripcion = item.item_descripcion || '';
                          return (titulo || descripcion)
                            ? `<p>${titulo} ${descripcion}</p>`
                            : '';
                        }).join('')}
                      </div>
                    `;
                  }
                  return `
                    <div class="subclause">
                      ${subclausula.subclausula_titulo?.includes('<li>')
                        ? `<ul class="items">${subclausula.subclausula_titulo}</ul>`
                        : `<p class="subclause-title">${subclausula.subclausula_titulo || ''}</p>`
                      }
                      ${subclausula.subclausula_descripcion ? `<p>${subclausula.subclausula_descripcion}</p>` : ''}
                      ${itemsHtml}
                    </div>
                  `;
                }).join('')}
              </div>
            `;
          }).join('')}

          <div style="margin-top: 10em;">
            <table class="firma-table" style="width: 100%; table-layout: fixed;">
              <tr>
                <td style="width: 50%;">
                  <div class="firma-content">
                    <div class="firma-line"></div>
                    <p>Presidente Fundación Banco de Alimentos</p>
                    <p>Riobamba "BAR"</p>
                  </div>
                </td>
                <td style="width: 50%;">
                  <div class="firma-content">
                    <div class="firma-line"></div>
                    <p>Nombre del</p>
                    <p>Representante</p>
                  </div>
                </td>
              </tr>
            </table>
          </div>
        </div>
      </body>
      </html>
    `;

    const htmlCompleto = encabezadoHtml + htmlContent + tools.piepaginaOcultoHtml();

    const options = {
      format: 'A4',
      border: {
        top: '0cm',
        right: '3cm',
        bottom: '1.5cm',
        left: '1.5cm',
      },
      header: {
        height: alturaEncabezado,
        contents: await tools.encabezadoHtml(),
      },
      footer: {
        height: '1.5cm',
        contents: tools.piepaginaHtml(),
      },
    };

    const base64 = await tools.Generarpdfhtml(htmlCompleto, options);
    return base64;

  } catch (error) {
    console.error('Error en la generación del PDF:', error);
    return 'ERROR';
  }
}

module.exports.pdfContratoGenerar = async function (objPrevisualizacion) {
    try {
        var pdfConvenio = await pdfContratoGenerar(objPrevisualizacion);
        return pdfConvenio
    } catch (error) {
        console.log(error);
    }
};

async function pdfContratoGenerar(objPrevisualizacion) {
  try {
    if (!objPrevisualizacion) {
      console.warn('Generando PDF con datos incompletos, verifique los campos.');
    }

    const encabezadoHtml = await tools.encabezadoOcultoHtml();
    const alturaEncabezado = tools.calcularAlturaEncabezado(encabezadoHtml);

    function reemplazarVariables(texto, datos) {
      return texto
        .replace(/\+NOMBRE_EMPRESA\+/g, datos.NOMBRE_EMPRESA || '')
        .replace(/\+NOMBRE_GERENTE\+/g, datos.NOMBRE_GERENTE || '')
        .replace(/\+VIGENCIA\+/g, datos.VIGENCIA || '')
        .replace(/\+NOMBRE_COORDINADOR\+/g, datos.NOMBRE_COORDINADOR || '')
        .replace(/\+NOMBRE_REPRESENTANTE\+/g, datos.NOMBRE_REPRESENTANTE || '')
        .replace(/\+DIRRECION_EMPRESA\+/g, datos.DIRECCION_EMPRESA || '')
        .replace(/\+TELEFONO_EMPRESA\+/g, datos.TELEFONO_EMPRESA || '')
        .replace(/\+EMAIL_EMPRESA\+/g, datos.EMAIL_EMPRESA || '')
        .replace(/\+WEB_EMPRESA\+/g, datos.WEB_EMPRESA || '')
        .replace(/\+CIUDAD_EMPRESA\+/g, datos.CIUDAD_EMPRESA || '')
        .replace(/\+FECHA_ACTUAL\+/g, datos.FECHA_ACTUAL || '')
        .replace(/\+DIRRECION_BAR\+/g, datos.DIRECCION_BAR || '')
        .replace(/\+TELEFONO_BAR\+/g, datos.TELEFONO_BAR || '')
        .replace(/\+EMAIL_BAR\+/g, datos.EMAIL_BAR || '')
        .replace(/\+WEB_BAR\+/g, datos.WEB_BAR || '')
        .replace(/\+CIUDAD_BAR\+/g, datos.CIUDAD_BAR || '');
    }

    const datos = objPrevisualizacion;

    const { años, meses } = tools.CalcularDiferenciaEnAniosYMeses(
      datos?.objConvenioEmpresa.ouconvenio_dtfechainicio,
      datos?.objConvenioEmpresa.ouconvenio_dtfechafin
    );

    const datosCoordinadoBar = "HOLA 1";
    const datosOrganizacion = "HOLA 2";
    const valores = {
      NOMBRE_EMPRESA: datos?.objConvenioEmpresa.empresa?.empresa_strnombre || '',
      NOMBRE_GERENTE: `${datos?.objConvenioEmpresa.representante?.ourepresentante_nombres} ${datos?.objConvenioEmpresa.representante?.ourepresentante_apellidos}` || '',
      VIGENCIA: `${años} años y ${meses} meses`,
      NOMBRE_REPRESENTANTE: `${datos?.objConvenioEmpresa.representante?.ourepresentante_nombres} ${datos?.objConvenioEmpresa.representante?.ourepresentante_apellidos}` || '',
      DIRECCION_EMPRESA: datos?.objConvenioEmpresa.empresa?.empresa_strdireccion,
      TELEFONO_EMPRESA: datos?.objConvenioEmpresa.empresa?.empresa_strcelular1,
      EMAIL_EMPRESA: datos?.objConvenioEmpresa.empresa?.empresa_strcorreo1,
      WEB_EMPRESA: datos?.objConvenioEmpresa.empresa?.empresa_strcorreo2,
      CIUDAD_EMPRESA: datos?.objConvenioEmpresa.empresa?.empresa_strdireccion,
      FECHA_ACTUAL: (() => {
        const fecha = new Date(datos?.objConvenioEmpresa?.ouconvenio_dtfechainicio);
        const dia = fecha.getDate();
        const mes = fecha.toLocaleString('es-ES', { month: 'long' });
        const anio = fecha.getFullYear();
        return `${dia} de ${mes} del año ${anio}`;
      })(),
      NOMBRE_COORDINADOR: `${datosCoordinadoBar?.data?.[0]?.ounombres} ${datosCoordinadoBar?.data?.[0]?.ouapellidos}`,
      DIRECCION_BAR: organizacion?.organizacion_strdireccion,
      TELEFONO_BAR: organizacion?.organizacion_strtelefono,
      EMAIL_BAR: organizacion?.organizacion_strcorreo,
      WEB_BAR: organizacion?.organizacion_strdireccion_web,
      CIUDAD_BAR: organizacion?.organizacion_strciudad,
    };

    const contratoTitulo = reemplazarVariables(datos.contrato_strtitulo || '', valores);
    const contratoDescripcion = reemplazarVariables(datos.contrato_strdescripcion || '', valores);

    const clausulasProcesadas = datos.clausulas.map(clausula => ({
      ...clausula,
      clausula_titulo: reemplazarVariables(clausula.clausula_titulo, valores),
      clausula_descripcion: reemplazarVariables(clausula.clausula_descripcion, valores),
      subclausulas: clausula.subclausulas.map(sub => ({
        ...sub,
        subclausula_titulo: reemplazarVariables(sub.subclausula_titulo, valores),
        subclausula_descripcion: reemplazarVariables(sub.subclausula_descripcion, valores),
        items: sub.items.map(item => ({
          ...item,
          item_titulo: reemplazarVariables(item.item_titulo, valores),
          item_descripcion: reemplazarVariables(item.item_descripcion, valores)
        }))
      }))
    }));

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          @font-face {
            font-family: 'Calibri';
            src: local('Calibri');
          }

          body {
            font-family: 'Calibri', sans-serif;
            font-size: 16px;
            color: #000000;
            text-align: justify;
            line-height: 1.15;
            box-sizing: border-box;
          }

          .container {
            max-width: 100%;
            padding: 20px;
            margin-top: 0;
          }

          h3 {
            font-weight: bold;
            margin: 0;
            padding: 0;
            color: #000000;
            text-align: center;
          }

          .clause-title {
            margin-top: 20px;
            text-align: justify;
            font-weight: bold;
          }

          .subclause-title {
            margin-left: 1cm;
            text-align: justify;
            font-weight: bold;
          }

          ul.items {
            margin-left: 1.2cm;
            padding-left: 1.5cm;
            list-style-position: outside;
            text-align: justify;
          }

          ul.items li {
            text-align: justify;
            text-indent: 0cm;
            padding-left: 0.2cm;
            margin-bottom: 8px;
          }

          .subclause-title,
          .subclause > p,
          .subclause .items {
            margin-left: 0cm;
            text-align: justify;
          }

          p {
            text-align: justify;
            margin-bottom: 8px;
          }

          .firma-table {
            width: 100%;
            margin-top: 50px;
            border-collapse: collapse;
          }

          .firma-line {
            border-top: 1.5px solid #000;
            width: 75%;
            margin: 10px auto;
          }

          .firma-content p {
            margin: 5px 0;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h3>${contratoTitulo}</h3>
          <p>${contratoDescripcion}</p>

          ${clausulasProcesadas.map(clausula => `
            <div class="clause">
              <p class="clause-title">${clausula.clausula_titulo} .-</p>
              ${clausula.clausula_descripcion ? `<p>${clausula.clausula_descripcion}</p>` : ''}
              ${clausula.subclausulas.map(subclausula => {
                const contieneLi = subclausula.items.some(item =>
                  (item.item_titulo && item.item_titulo.includes('<li')) ||
                  (item.item_descripcion && item.item_descripcion.includes('<li'))
                );

                const itemsHtml = contieneLi
                  ? `<ul class="items">${subclausula.items.map(item => `${item.item_titulo || ''}${item.item_descripcion || ''}`).join('')}</ul>`
                  : `<div class="items">${subclausula.items.map(item =>
                      (item.item_titulo || item.item_descripcion)
                        ? `<p>${item.item_titulo || ''} ${item.item_descripcion || ''}</p>`
                        : ''
                    ).join('')}</div>`;

                return `
                  <div class="subclause">
                    ${subclausula.subclausula_titulo?.includes('<li>')
                      ? `<ul class="items">${subclausula.subclausula_titulo}</ul>`
                      : `<p class="subclause-title">${subclausula.subclausula_titulo || ''}</p>`}
                    ${subclausula.subclausula_descripcion ? `<p>${subclausula.subclausula_descripcion}</p>` : ''}
                    ${itemsHtml}
                  </div>
                `;
              }).join('')}
            </div>
          `).join('')}

          <div style="margin-top: 10em;">
            <table class="firma-table">
              <tr>
                <td style="width: 50%;">
                  <div class="firma-content">
                    <div class="firma-line"></div>
                    <p>Presidente Fundación Banco de Alimentos</p>
                    <p>Riobamba "BAR"</p>
                  </div>
                </td>
                <td style="width: 50%;">
                  <div class="firma-content">
                    <div class="firma-line"></div>
                    <p>${valores.NOMBRE_GERENTE}</p>
                    <p>Representante Empresa</p>
                  </div>
                </td>
              </tr>
            </table>
          </div>
        </div>
      </body>
      </html>
    `;

    const htmlCompleto = encabezadoHtml + htmlContent + tools.piepaginaOcultoHtml();

    const options = {
      format: 'A4',
      border: {
        top: '0cm',
        right: '1.5cm',
        bottom: '1.5cm',
        left: '1.5cm',
      },
      header: {
        height: alturaEncabezado,
        contents: await tools.encabezadoHtml(),
      },
      footer: {
        height: '1.5cm',
        contents: tools.piepaginaHtml(),
      },
    };

    const base64 = await tools.Generarpdfhtml(htmlCompleto, options);
    return base64;

  } catch (error) {
    console.error('Error en la generación del PDF:', error);
    return 'ERROR';
  }
}
