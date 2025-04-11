const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const upload = require('../middleware/multer');
const {
  obtenerEventoPublico,
  obtenerEventoPaginado,
  createEventoForUser,
  updateEvento,
  deleteEvento,
  setPortada
} = require('../controllers/evento.controller');
const { obtenerFotosPublicas } = require('../controllers/eventoPublico.controller');
const { getEventoPublico } = require('../controllers/evento.controller');
const eventoController = require('../controllers/evento.controller');

router.get('/evento/:linkPublico', obtenerEventoPublico);
router.get('/eventos/:linkId', obtenerEventoPaginado);

router.post('/usuarios/:id/eventos', verifyToken, upload.single('portada'), createEventoForUser);

router.put('/eventos/:eventoId/portada/:fotoId', verifyToken, setPortada);
router.delete('/eventos/:id', verifyToken, deleteEvento);
router.get('/publico/:linkPublico/fotos', eventoController.getFotosPublicasEvento);
router.get('/eventos/publico/:linkPublico', getEventoPublico);
router.put('/eventos/:id', verifyToken, upload.single('portada'), updateEvento);
router.get('/:linkPublico/fotos', obtenerFotosPublicas);
module.exports = router;
