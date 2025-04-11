const { Foto, User, Evento } = require('../models');
const path = require('path');
const fs = require('fs');
const { emitToToken } = require('../socket');

// Obtener todas las fotos del usuario autenticado
exports.getFotosUsuario = async (req, res) => {
  const fotos = await Foto.findAll({
    where: { UserId: req.user.id },
    order: [['createdAt', 'DESC']]
  });
  res.json({ fotos });
};

// Subir fotos generales (por token)
exports.uploadFotos = async (req, res) => {
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
};

// Subir fotos a un evento específico
// controllers/foto.controller.js
exports.uploadFotosToEvento = async (req, res) => {
  console.log('req.files:', req.files);
  console.log('req.body:', req.body);

  const { eventoId } = req.params;
  const files = req.files;

  if (!files || files.length === 0) {
    return res.status(400).json({ error: 'No se recibieron archivos' });
  }

  try {
    const evento = await Evento.findByPk(eventoId);
    if (!evento) return res.status(404).json({ error: 'Evento no encontrado' });

    const usuario = await User.findByPk(evento.UserId);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    const resultados = [];

    for (const file of files) {
      const nuevaFoto = await Foto.create({
        url: `/uploads/${file.filename}`,
        UserId: usuario.id,
        EventoId: evento.id
      });
      resultados.push(nuevaFoto);
    }

    res.json({ message: 'Fotos subidas', fotos: resultados });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al subir fotos al evento' });
  }
};

// Eliminar foto (usuario autenticado)
exports.deleteFoto = async (req, res) => {
  const foto = await Foto.findByPk(req.params.id);
  if (!foto) return res.status(404).json({ error: 'Foto no encontrada' });

  const usuario = await User.findByPk(req.user.id);
  if (foto.UserId !== req.user.id && usuario.rol !== 'superadmin') {
    return res.status(403).json({ error: 'No autorizado' });
  }

  const filepath = path.join(__dirname, '..', foto.url);
  if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
  await foto.destroy();
  res.json({ message: 'Foto eliminada' });
};

// Eliminar foto (admin)
exports.deleteFotoAdmin = async (req, res) => {
  const foto = await Foto.findByPk(req.params.id);
  if (!foto) return res.status(404).json({ error: 'Foto no encontrada' });

  const filepath = path.join(__dirname, '..', foto.url);
  if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
  await foto.destroy();
  res.json({ message: 'Foto eliminada por admin' });
};
