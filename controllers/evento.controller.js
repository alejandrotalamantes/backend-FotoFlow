const { Evento, Foto, User } = require('../models');
const path = require('path');
const fs = require('fs');

const generarLinkPublico = () => Math.random().toString(36).substring(2, 10);

// Obtener evento público
exports.obtenerEventoPublico = async (req, res) => {
  try {
    const evento = await Evento.findOne({
      where: { linkPublico: req.params.linkPublico },
      include: [Foto]
    });

    if (!evento) return res.status(404).json({ error: 'Evento no encontrado' });

    res.json({ evento });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener evento público' });
  }
};

// Obtener evento paginado (para perfil público tipo scroll infinito)
exports.obtenerEventoPaginado = async (req, res) => {
  const { linkId } = req.params;
  const { page = 1, limit = 12 } = req.query;

  try {
    const usuario = await User.findOne({ where: { linkId } });
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    const offset = (page - 1) * limit;

    const fotos = await Foto.findAndCountAll({
      where: { UserId: usuario.id },
      order: [['createdAt', 'DESC']],
      offset: parseInt(offset),
      limit: parseInt(limit)
    });

    res.json({
      fotos: fotos.rows,
      total: fotos.count,
      page: parseInt(page),
      totalPages: Math.ceil(fotos.count / limit)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener fotos del evento' });
  }
};

// Crear evento
exports.createEventoForUser = async (req, res) => {
  try {
    const usuario = await User.findByPk(req.params.id);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    const { titulo, descripcion, fechaEvento } = req.body;

    let portadaUrl = null;
    if (req.file) {
      portadaUrl = `/uploads/${req.file.filename}`;
    }

    const evento = await Evento.create({
      titulo,
      descripcion,
      fechaEvento,
      portadaUrl,
      UserId: usuario.id,
      linkPublico: generarLinkPublico()
    });

    res.status(201).json({ evento });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear evento' });
  }
};

// Actualizar evento
// controllers/evento.controller.js


exports.updateEvento = async (req, res) => {
  try {
    console.log('Body recibido:', req.body);
    console.log('Archivo recibido:', req.file?.filename);

    const evento = await Evento.findByPk(req.params.id);
    if (!evento) return res.status(404).json({ error: 'Evento no encontrado' });

    const { titulo, descripcion, fechaEvento } = req.body;

    evento.titulo = titulo || evento.titulo;
    evento.descripcion = descripcion || evento.descripcion;
    evento.fechaEvento = fechaEvento || evento.fechaEvento;

    if (req.file) {
      evento.portadaUrl = `/uploads/${req.file.filename}`;
    }

    await evento.save();

    res.json({ message: 'Evento actualizado', evento });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar evento' });
  }
};


// Eliminar evento y sus fotos
exports.deleteEvento = async (req, res) => {
  try {
    const evento = await Evento.findByPk(req.params.id, { include: [Foto] });
    if (!evento) return res.status(404).json({ error: 'Evento no encontrado' });

    evento.Fotos.forEach((foto) => {
      const filepath = path.join(__dirname, '..', foto.url);
      if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
    });

    await Foto.destroy({ where: { EventoId: evento.id } });
    await evento.destroy();

    res.json({ message: 'Evento y fotos asociadas eliminadas' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar evento' });
  }
};

// Establecer foto como portada
exports.setPortada = async (req, res) => {
  try {
    const { eventoId, fotoId } = req.params;
    const evento = await Evento.findByPk(eventoId);
    const foto = await Foto.findByPk(fotoId);
    if (!evento || !foto || foto.EventoId !== evento.id) {
      return res.status(404).json({ error: 'Evento o foto no encontrada' });
    }

    evento.portadaUrl = foto.url;
    await evento.save();
    res.json({ message: 'Portada actualizada', evento });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al establecer portada' });
  }
};


// Obtener fotos públicas de un evento
exports.getEventoPublico = async (req, res) => {
  const { linkPublico } = req.params;
  const { page = 1, limit = 15 } = req.query;
  const offset = (page - 1) * limit;

  try {
    const evento = await Evento.findOne({
      where: { linkPublico },
    });

    if (!evento) return res.status(404).json({ error: 'Evento no encontrado' });

    const fotos = await Foto.findAll({
      where: { EventoId: evento.id },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      id: evento.id,
      titulo: evento.titulo,
      descripcion: evento.descripcion,
      fechaEvento: evento.fechaEvento,
      portadaUrl: evento.portadaUrl,
      fotos,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener evento público' });
  }
};

exports.getFotosPublicasEvento = async (req, res) => {
  const { linkPublico } = req.params;
  const { page = 1, limit = 15 } = req.query;
  const offset = (page - 1) * limit;

  try {
    const evento = await Evento.findOne({
      where: { linkPublico },
    });

    if (!evento) return res.status(404).json({ error: 'Evento no encontrado' });

    const fotos = await Foto.findAll({
      where: { EventoId: evento.id },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({ fotos });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener fotos del evento' });
  }
};
