module.exports = (sequelize, DataTypes) => {
  const Evento = sequelize.define('Evento', {
    titulo: DataTypes.STRING,
    descripcion: DataTypes.TEXT,
    fechaEvento: DataTypes.DATEONLY,
    portadaUrl: DataTypes.STRING,
    linkPublico: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    }
  });

  Evento.associate = (models) => {
    Evento.hasMany(models.Foto);
    Evento.belongsTo(models.User);
  };

  Evento.beforeCreate(async (evento, options) => {
    if (!evento.linkPublico) {
      const User = sequelize.models.User;
      const usuario = await User.findByPk(evento.UserId);

      const nombre = usuario?.nombre || 'anonimo';
      const partes = nombre.trim().split(' ');
      const iniciales = partes.map(p => p[0].toLowerCase()).join('').slice(0, 2);

      const aleatorio = [...Array(4)].map(() =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('');

      evento.linkPublico = `${iniciales}-${aleatorio}`;
    }
  });

  return Evento;
};
