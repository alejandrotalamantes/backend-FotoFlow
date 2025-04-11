const { User } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const usuario = await User.findOne({ where: { email } });
  if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

  const match = await bcrypt.compare(password, usuario.password);
  if (!match) return res.status(401).json({ error: 'Contraseña incorrecta' });

  const token = jwt.sign({ id: usuario.id, rol: usuario.rol }, JWT_SECRET, { expiresIn: '7d' });

  res.json({
    message: 'Login exitoso',
    token,
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      linkId: usuario.linkId,
      token: usuario.token
    }
  });
};
