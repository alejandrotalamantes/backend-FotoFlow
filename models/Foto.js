module.exports = (sequelize) => {
  const Foto = sequelize.define('Foto', {
    url: {
      type: sequelize.Sequelize.STRING,
    },
    calificacion: {
      type: sequelize.Sequelize.INTEGER,
      allowNull: true,
    },
    destacada: {
      type: sequelize.Sequelize.BOOLEAN,
      defaultValue: false,
    },
  });

  Foto.associate = (models) => {
    Foto.belongsTo(models.User);
    Foto.belongsTo(models.Evento, {
      foreignKey: 'EventoId', // ✅ asegúrate que sea EventoId, no GaleriaId
    });
  };

  return Foto;
};
