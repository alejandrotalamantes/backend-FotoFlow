const { Evento, Foto } = require('../models');

const obtenerFotosPublicas = async (req, res) => {
  const { linkPublico } = req.params;
  const { page = 1, limit = 15 } = req.query;
  const offset = (page - 1) * limit;

  try {
    const evento = await Evento.findOne({ where: { linkPublico } });
    if (!evento) return res.status(404).json({ error: 'Evento no encontrado' });

    const fotos = await Foto.findAll({
      where: { EventoId: evento.id },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({ fotos });
  } catch (error) {
    console.error('Error al obtener fotos públicas:', error);
    res.status(500).json({ error: 'Error al obtener fotos' });
  }
};

module.exports = { obtenerFotosPublicas };
