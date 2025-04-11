const express = require('express');
const router = express.Router();
const { createUser, getAllUsers, getUserById, getProfile, updateUser } = require('../controllers/user.controller');
const verifyToken = require('../middleware/auth');
const { requireSuperadmin } = require('../middleware/roles');

router.post('/usuarios', createUser);
router.get('/usuarios', verifyToken, requireSuperadmin, getAllUsers);
router.get('/usuarios/:id', verifyToken, getUserById);
router.get('/usuario/perfil', verifyToken, getProfile);
router.put('/usuario', verifyToken, updateUser);

module.exports = router;
