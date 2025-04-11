const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    nombre: DataTypes.STRING,
    email: DataTypes.STRING,
    rol: DataTypes.STRING,
    password: DataTypes.STRING,
    token: {
      type: DataTypes.STRING,
      defaultValue: () => require('uuid').v4(),
    },
    linkId: {
      type: DataTypes.STRING,
      unique: true,
      defaultValue: () => Math.random().toString(36).substring(2, 8),
    },
  });

  User.beforeCreate(async (user) => {
    if (user.password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(user.password, salt);
    }
  });

  User.associate = (models) => {
    User.hasMany(models.Evento, { foreignKey: { allowNull: false } }); // ✅ aquí el cambio
    User.hasMany(models.Foto); // opcional
  };

  return User;
};
