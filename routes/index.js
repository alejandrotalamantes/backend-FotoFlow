const express = require('express');
const router = express.Router();

router.use(require('./auth.routes'));
router.use(require('./user.routes'));
router.use(require('./evento.routes'));
router.use(require('./foto.routes'));

module.exports = router;
