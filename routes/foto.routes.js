const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const { requireSuperadmin } = require('../middleware/roles');
const {
  getFotosUsuario, uploadFotos, uploadFotosToEvento,
  deleteFoto, deleteFotoAdmin
} = require('../controllers/foto.controller');
const upload = require('../middleware/multer');

router.get('/usuario/fotos', verifyToken, getFotosUsuario);
router.post('/upload', verifyToken, uploadFotos);
router.post('/eventos/:eventoId/fotos', verifyToken, upload.array('image'), uploadFotosToEvento);
router.delete('/foto/:id', verifyToken, deleteFoto);
router.delete('/foto/:id/admin', verifyToken, requireSuperadmin, deleteFotoAdmin);

module.exports = router;
