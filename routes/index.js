// backend/routes/index.js
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User, Foto } = require('../models');
const { emitToToken } = require('../socket');
const { JWT_SECRET } = require('../config');
const verifyToken = require('../middleware/auth');

// Middleware: verificar rol superadmin
const requireSuperadmin = async (req, res, next) => {
  const user = await User.findByPk(req.user.id);
  if (!user || user.rol !== 'superadmin') {
    return res.status(403).json({ error: 'Solo el superadmin puede realizar esta acción.' });
  }
  next();
};

// Crear usuario (permite crear superadmin sin token solo si no hay ninguno)
router.post('/usuarios', async (req, res) => {
  const { nombre, email, rol, password } = req.body;

  if (rol !== 'superadmin') {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
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
  res.json({
    link: `/galeria/${usuario.linkId}`,
    token: usuario.token,
  });
});

// Obtener todos los usuarios (solo superadmin)
router.get('/usuarios', verifyToken, requireSuperadmin, async (req, res) => {
  const usuarios = await User.findAll({ attributes: ['id', 'nombre', 'email', 'rol', 'linkId', 'createdAt', 'token'] });
  res.json({ usuarios });
});

// Login usuario
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const usuario = await User.findOne({ where: { email } });

  if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

  const match = await bcrypt.compare(password, usuario.password);
  if (!match) return res.status(401).json({ error: 'Contraseña incorrecta' });

  const authToken = jwt.sign({ id: usuario.id, rol: usuario.rol }, JWT_SECRET, { expiresIn: '7d' });

  res.json({
    message: 'Login exitoso',
    token: authToken,
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      linkId: usuario.linkId,
      token: usuario.token,
    },
  });
});

// Subir una o varias imágenes (protegida)
router.post('/upload', verifyToken, async (req, res) => {
  const { token } = req.body;
  const files = req.files?.image;
  if (!files || !token) return res.status(400).send('Faltan datos');

  const usuario = await User.findOne({ where: { token } });
  if (!usuario) return res.status(404).send('Token inválido');

  const subirArchivo = async (file) => {
    const filename = `${Date.now()}_${file.name}`;
    const filepath = path.join(__dirname, '../uploads', filename);

    await file.mv(filepath);
    const nuevaFoto = await Foto.create({ url: `/uploads/${filename}`, UserId: usuario.id });
    emitToToken(token, nuevaFoto);
    return nuevaFoto;
  };

  const archivos = Array.isArray(files) ? files : [files];
  const resultados = [];

  for (const archivo of archivos) {
    const resultado = await subirArchivo(archivo);
    resultados.push(resultado);
  }

  res.json({ message: 'Fotos subidas', fotos: resultados });
});

// Obtener galería pública (ordenada por fecha descendente)
router.get('/galeria/:linkId', async (req, res) => {
  const usuario = await User.findOne({ where: { linkId: req.params.linkId } });
  if (!usuario) return res.status(404).send('Galería no encontrada');

  const fotos = await Foto.findAll({ where: { UserId: usuario.id }, order: [['createdAt', 'DESC']] });
  res.json({ usuario, fotos });
});

// Ruta protegida - ver perfil
router.get('/usuario/perfil', verifyToken, async (req, res) => {
  const usuario = await User.findByPk(req.user.id, { attributes: ['id', 'nombre', 'email', 'rol', 'linkId', 'token'] });
  if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json({ usuario });
});

// Ruta protegida - ver mis fotos (ordenadas por fecha descendente)
router.get('/usuario/fotos', verifyToken, async (req, res) => {
  const fotos = await Foto.findAll({ where: { UserId: req.user.id }, order: [['createdAt', 'DESC']] });
  res.json({ fotos });
});

// Ruta protegida - eliminar foto (usuario puede borrar sus fotos o superadmin cualquiera)
router.delete('/foto/:id', verifyToken, async (req, res) => {
  const foto = await Foto.findByPk(req.params.id);

  if (!foto) return res.status(404).json({ error: 'Foto no encontrada' });

  const usuario = await User.findByPk(req.user.id);

  if (foto.UserId !== req.user.id && usuario.rol !== 'superadmin') {
    return res.status(403).json({ error: 'No autorizado para eliminar esta foto' });
  }

  const filepath = path.join(__dirname, '../', foto.url);
  if (fs.existsSync(filepath)) fs.unlinkSync(filepath);

  await foto.destroy();
  res.json({ message: 'Foto eliminada' });
});

// Ruta protegida - eliminar foto (como admin) por id de usuario
router.delete('/foto/:id/admin', verifyToken, requireSuperadmin, async (req, res) => {
  const foto = await Foto.findByPk(req.params.id);
  if (!foto) return res.status(404).json({ error: 'Foto no encontrada' });

  const filepath = path.join(__dirname, '../', foto.url);
  if (fs.existsSync(filepath)) fs.unlinkSync(filepath);

  await foto.destroy();
  res.json({ message: 'Foto eliminada por admin' });
});

// Ruta protegida - actualizar usuario
router.put('/usuario', verifyToken, async (req, res) => {
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
  res.json({ message: 'Usuario actualizado', usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email } });
});

module.exports = router;
