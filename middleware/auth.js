// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token requerido' });

  console.log(token);
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log(decoded);
    
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token inválido' });
  }
}

module.exports = verifyToken;