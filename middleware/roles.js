const { User } = require('../models');

exports.requireSuperadmin = async (req, res, next) => {
  const user = await User.findByPk(req.user.id);
  if (!user || user.rol !== 'superadmin') {
    return res.status(403).json({ error: 'Solo el superadmin puede realizar esta acción.' });
  }
  next();
};
