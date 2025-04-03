// backend/models/index.js
const sequelize = require('./sequelize');
const UserModel = require('./User');
const FotoModel = require('./Foto');

const User = UserModel(sequelize);
const Foto = FotoModel(sequelize);

User.hasMany(Foto);
Foto.belongsTo(User);

module.exports = {
  sequelize,
  User,
  Foto,
};