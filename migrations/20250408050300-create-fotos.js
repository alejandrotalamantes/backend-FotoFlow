'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Fotos', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      url: { type: Sequelize.STRING },
      calificacion: { type: Sequelize.INTEGER },
      destacada: { type: Sequelize.BOOLEAN, defaultValue: false }, // opcional si la tienes
      UserId: {
        type: Sequelize.INTEGER,
        references: { model: 'Users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      EventoId: { // ✅ este campo reemplaza GaleriaId
        type: Sequelize.INTEGER,
        references: { model: 'Eventos', key: 'id' }, // ✅ relación correcta
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Fotos');
  }
};
