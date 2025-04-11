// backend/routes/index.js
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User, Foto, Galeria } = require('../models');
const verifyToken = require('../middleware/auth');
const { JWT_SECRET } = require('../config');
const { emitToToken } = require('../socket');
const { obtenerGaleriaPaginada } = require('../controllers/galeria.controller');
const upload = require('../middleware/multer');


// Middleware para superadmin
const requireSuperadmin = async (req, res, next) => {
  const user = await User.findByPk(req.user.id);
  if (!user || user.rol !== 'superadmin') {
    return res.status(403).json({ error: 'Solo el superadmin puede realizar esta acción.' });
  }
  next();
};





// ========== AUTENTICACIÓN ==========
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
      id: usuario.id, nombre: usuario.nombre, email: usuario.email,
      rol: usuario.rol, linkId: usuario.linkId, token: usuario.token
    }
  });
});

// ========== USUARIOS ==========
router.post('/usuarios', async (req, res) => {
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
  res.json({ link: `/galeria/${usuario.linkId}`, token: usuario.token });
});

router.get('/usuarios', verifyToken, requireSuperadmin, async (req, res) => {
  const usuarios = await User.findAll({
    attributes: ['id', 'nombre', 'email', 'rol', 'linkId', 'createdAt', 'token']
  });
  res.json({ usuarios });
});

router.get('/usuarios/:id', verifyToken, async (req, res) => {
  try {
    const usuario = await User.findByPk(req.params.id, {
      attributes: ['id', 'nombre', 'email', 'rol', 'linkId', 'token', 'createdAt']
    });
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    const galerias = await Galeria.findAll({
      where: { UserId: usuario.id },
      include: [Foto],
      order: [['createdAt', 'DESC']]
    });

    res.json({ usuario, galerias });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener la información del usuario' });
  }
});

// ========== PERFIL ==========
router.get('/usuario/perfil', verifyToken, async (req, res) => {
  const usuario = await User.findByPk(req.user.id, {
    attributes: ['id', 'nombre', 'email', 'rol', 'linkId', 'token']
  });
  if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json({ usuario });
});

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
  res.json({ message: 'Usuario actualizado', usuario });
});

// ========== GALERÍAS ==========
router.get('/galeria/:linkId', obtenerGaleriaPaginada);

router.post('/usuarios/:id/galerias', verifyToken, upload.single('portada'), async (req, res) => {
  try {
    const usuario = await User.findByPk(req.params.id);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    const { titulo, descripcion, fechaEvento } = req.body;
    const portadaUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const galeria = await Galeria.create({
      titulo, descripcion, fechaEvento, portadaUrl, UserId: usuario.id
    });

    res.status(201).json({ galeria });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear galería' });
  }
});

router.put('/galeria/:galeriaId/portada/:fotoId', verifyToken, async (req, res) => {
  try {
    const { galeriaId, fotoId } = req.params;
    const galeria = await Galeria.findByPk(galeriaId);
    const foto = await Foto.findByPk(fotoId);
    if (!galeria || !foto || foto.GaleriaId !== galeria.id) {
      return res.status(404).json({ error: 'Galería o foto no encontrada' });
    }

    galeria.portadaUrl = foto.url;
    await galeria.save();
    res.json({ message: 'Portada actualizada', galeria });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al establecer portada' });
  }
});

// ========== FOTOS ==========
router.get('/usuario/fotos', verifyToken, async (req, res) => {
  const fotos = await Foto.findAll({
    where: { UserId: req.user.id },
    order: [['createdAt', 'DESC']]
  });
  res.json({ fotos });
});

router.post('/upload', verifyToken, async (req, res) => {
  console.log('verifyToken');
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

router.post('/galerias/:galeriaId/fotos', verifyToken, async (req, res) => {
  const { galeriaId } = req.params;
  const files = req.files?.image;

  try {
    const galeria = await Galeria.findByPk(galeriaId);
    if (!galeria) return res.status(404).json({ error: 'Galería no encontrada' });

    const usuario = await User.findByPk(galeria.UserId);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    const subirArchivo = async (file) => {
      const filename = `${Date.now()}_${file.name}`;
      const filepath = path.join(__dirname, '../uploads', filename);
      await file.mv(filepath);
      return await Foto.create({ url: `/uploads/${filename}`, UserId: usuario.id, GaleriaId: galeria.id });
    };

    const archivos = Array.isArray(files) ? files : [files];
    const resultados = [];
    for (const archivo of archivos) {
      const resultado = await subirArchivo(archivo);
      resultados.push(resultado);
    }

    res.json({ message: 'Fotos subidas', fotos: resultados });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al subir fotos' });
  }
});

router.delete('/foto/:id', verifyToken, async (req, res) => {
  const foto = await Foto.findByPk(req.params.id);
  if (!foto) return res.status(404).json({ error: 'Foto no encontrada' });

  const usuario = await User.findByPk(req.user.id);
  if (foto.UserId !== req.user.id && usuario.rol !== 'superadmin') {
    return res.status(403).json({ error: 'No autorizado' });
  }

  const filepath = path.join(__dirname, '../', foto.url);
  if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
  await foto.destroy();
  res.json({ message: 'Foto eliminada' });
});

router.delete('/foto/:id/admin', verifyToken, requireSuperadmin, async (req, res) => {
  const foto = await Foto.findByPk(req.params.id);
  if (!foto) return res.status(404).json({ error: 'Foto no encontrada' });

  const filepath = path.join(__dirname, '../', foto.url);
  if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
  await foto.destroy();
  res.json({ message: 'Foto eliminada por admin' });
});


router.put('/galeria/:id', verifyToken, async (req, res) => {
  try {
    const galeria = await Galeria.findByPk(req.params.id);
    if (!galeria) return res.status(404).json({ error: 'Galería no encontrada' });

    const { titulo, descripcion, fechaEvento } = req.body;
    galeria.titulo = titulo || galeria.titulo;
    galeria.descripcion = descripcion || galeria.descripcion;
    galeria.fechaEvento = fechaEvento || galeria.fechaEvento;
    await galeria.save();

    res.json({ message: 'Galería actualizada', galeria });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar galería' });
  }
});

router.delete('/galerias/:id', verifyToken, async (req, res) => {
  try {
    const galeria = await Galeria.findByPk(req.params.id, {
      include: [Foto]
    });

    if (!galeria) return res.status(404).json({ error: 'Galería no encontrada' });

    // Eliminar las fotos físicas del disco (si están)
    galeria.Fotos.forEach((foto) => {
      const filepath = path.join(__dirname, '..', foto.url);
      if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
    });

    // Eliminar las fotos de la base de datos
    await Foto.destroy({ where: { GaleriaId: galeria.id } });

    // Eliminar la galería
    await galeria.destroy();

    res.json({ message: 'Galería y fotos asociadas eliminadas' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar galería' });
  }
});




module.exports = router;
