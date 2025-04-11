const Sequelize = require('sequelize');
const sequelize = require('./sequelize');
const UserModel = require('./User');
const FotoModel = require('./Foto');
const EventoModel = require('./Evento'); // <- asegúrate de usar el nombre correcto

const User = UserModel(sequelize);
const Foto = FotoModel(sequelize);
const Evento = EventoModel(sequelize, Sequelize.DataTypes); // ✅ AQUI defines Evento

// Relaciones
User.hasMany(Foto);
Foto.belongsTo(User);

User.hasMany(Evento);
Evento.belongsTo(User);

Evento.hasMany(Foto, { foreignKey: 'EventoId' });
Foto.belongsTo(Evento, { foreignKey: 'EventoId' });


module.exports = {
  sequelize,
  User,
  Foto,
  Evento,
};
