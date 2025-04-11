const { User, Evento, Foto } = require('../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { JWT_SECRET } = require('../config');

// Crear usuario (solo superadmin)
exports.createUser = async (req, res) => {
  const { nombre, email, rol, password } = req.body;

  if (rol !== 'superadmin') {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token requerido' });

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const creador = await User.findByPk(decoded.id);
      if (!creador || creador.rol !== 'superadmin') {
        return res.status(403).json({ error: 'Solo el superadmin puede crear usuarios.' });
      }
    } catch {
      return res.status(403).json({ error: 'Token inválido' });
    }
  }

  const usuario = await User.create({ nombre, email, rol, password });
  res.json({ link: `/evento/${usuario.linkId}`, token: usuario.token });
};

// Obtener todos los usuarios (solo superadmin)
exports.getAllUsers = async (req, res) => {
  const usuarios = await User.findAll({
    attributes: ['id', 'nombre', 'email', 'rol', 'linkId', 'createdAt', 'token']
  });
  res.json({ usuarios });
};

// Obtener un usuario con sus galerías y fotos
exports.getUserById = async (req, res) => {
  try {
    const usuario = await User.findByPk(req.params.id, {
      attributes: ['id', 'nombre', 'email', 'rol', 'linkId', 'token', 'createdAt']
    });
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    const eventos  = await Evento.findAll({
      where: { UserId: usuario.id },
      include: [Foto],
      order: [['createdAt', 'DESC']]
    });

    res.json({ usuario, eventos });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener la información del usuario' });
  }
};

// Obtener perfil del usuario autenticado
exports.getProfile = async (req, res) => {
  const usuario = await User.findByPk(req.user.id, {
    attributes: ['id', 'nombre', 'email', 'rol', 'linkId', 'token']
  });
  if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json({ usuario });
};

// Actualizar perfil del usuario autenticado
exports.updateUser = async (req, res) => {
  const { nombre, email, password } = req.body;
  const usuario = await User.findByPk(req.user.id);
  if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

  if (nombre) usuario.nombre = nombre;
  if (email) usuario.email = email;
  if (password) {
    const salt = await bcrypt.genSalt(10);
    usuario.password = await bcrypt.hash(password, salt);
  }

  await usuario.save();
  res.json({ message: 'Usuario actualizado', usuario });
};
