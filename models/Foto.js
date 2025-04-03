// backend/models/Foto.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Foto = sequelize.define('Foto', {
    url: DataTypes.STRING,
  });

  return Foto;
};