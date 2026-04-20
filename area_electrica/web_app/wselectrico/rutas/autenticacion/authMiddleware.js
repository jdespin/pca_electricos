const jwt = require('jsonwebtoken');
const jwt_decode = require('jwt-decode');
const serviciosAcademicos = require('../modelo/academico');


async function authenticateToken(req, res, next) {
  var token = req.header('Authorization');
  if (!token) {
    return res.status(401).json({ message: 'El servicio web no tiene token en la cabecera.' });
  }
  token = token.replace('Bearer ', '')
  var decoded = jwt_decode(token);
  var date = new Date(decoded.exp * 1000);
  let now = new Date();

  if (date.getTime() > now.getTime()) {
    var tokenConsulta = await serviciosAcademicos.validartoken(token, decoded.userconsumo);
    if (tokenConsulta.data.length == 0) {
      return res.json({
        success: false,
        error: 'Token Invalido',
      });
    } else {
      
      next();
    }

  } else {
    return res.json({
      success: false,
      error: 'Token Expirado',
    });
  }

}


module.exports = authenticateToken;
