const express = require('express');
const helmet  = require('helmet');
const path    = require('path');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');


const rutarol = require('./rutas/autenticacion/rutarol');
const rutausuario = require('./rutas/autenticacion/rutausuario');
const rutalogin = require('./rutas/autenticacion/rutalogin');
const rutaperfil = require('./rutas/autenticacion/rutaperfil');
const rutarecuperarpassword = require('./rutas/autenticacion/rutarecuperarpassword');



const rutaturno = require('./rutas/admin/rutaturno');
const rutatecnicoturno = require('./rutas/admin/rutatecnicoturno');
const rutadisponibilidad = require('./rutas/admin/rutadisponibilidad');
const rutatipoprueba = require('./rutas/admin/rutatipoprueba');
const rutaequipointerno = require('./rutas/admin/rutaequipointerno');
const rutatipoequipo = require('./rutas/admin/rutatipoequipo');
const rutaequipoexterno = require('./rutas/admin/rutaequipoexterno');



const rutasituacionlaboral = require('./rutas/catalogos/rutasituacionlaboral');
const rutatipoempresa = require('./rutas/catalogos/rutatipoempresa');
const rutatiposolicitud = require('./rutas/catalogos/rutatiposolicitud');


const rutaenviarcorreo = require('./rutas/compartido/rutaenviarcorreo');
const rutamensajesolicitud = require('./rutas/compartido/rutamensajesolicitud');
const rutaubicacion = require('./rutas/compartido/rutaubicacion');



const rutaempresa = require('./rutas/empresa/rutaempresa');


const rutapersonas = require('./rutas/persona/rutacentralpersona');


const rutareportes = require('./rutas/reporte/rutareportes');


const rutaorden = require('./rutas/orden/rutaorden');
const rutanotificacion = require('./rutas/notificacion/rutanotificacion');





const cors = require('cors');
const app = express();
var fs = require('fs');
var http = require('http');
var https = require('https');

const port = 3001;
const url = '/wselectricos'


app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
    next();
});




app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));

const corsEstáticos = (req, res, next) => { res.header('Access-Control-Allow-Origin', '*'); next(); };
app.use(url + '/certificados', corsEstáticos, express.static(path.join(__dirname, 'public/certificados')));
app.use(url + '/imagenes_equipos', corsEstáticos, express.static(path.join(__dirname, 'public/imagenes_equipos')));


app.use(url + '/rutarol', rutarol);
app.use(url + '/rutausuario', rutausuario);
app.use(url + '/rutalogin', rutalogin);
app.use(url + '/rutaperfil', rutaperfil);
app.use(url + '/rutarecuperarpassword', rutarecuperarpassword);



app.use(url + '/rutaturno', rutaturno);
app.use(url + '/rutatecnicoturno', rutatecnicoturno);
app.use(url + '/rutadisponibilidad', rutadisponibilidad);
app.use(url + '/rutatipoprueba', rutatipoprueba);
app.use(url + '/rutaequipointerno', rutaequipointerno);
app.use(url + '/rutatipoequipo', rutatipoequipo);
app.use(url + '/rutaequipoexterno', rutaequipoexterno);


app.use(url + '/rutasituacionlaboral', rutasituacionlaboral);
app.use(url + '/rutatipoempresa', rutatipoempresa);
app.use(url + '/rutatiposolicitud', rutatiposolicitud);


app.use(url + '/rutaenviarcorreo', rutaenviarcorreo);
app.use(url + '/rutamensajesolicitud', rutamensajesolicitud);
app.use(url + '/rutaubicacion', rutaubicacion);




app.use(url + '/rutaempresa', rutaempresa);


app.use(url + '/rutapersonas', rutapersonas);


app.use(url + '/rutareportes', rutareportes);


app.use(url + '/rutaorden', rutaorden);


app.use(url + '/rutanotificacion', rutanotificacion);


const rutareportetecnico = require('./rutas/reporte/rutareporte');
app.use(url + '/rutareportetecnico', rutareportetecnico);

const { programarAlertaDiaria } = require('./jobs/alertaCertificados');
programarAlertaDiaria();




app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false }));

http.createServer(app.listen(port, () => {
    console.log("Servicios Company PCA ejecutado con exito: ", port)
}))
