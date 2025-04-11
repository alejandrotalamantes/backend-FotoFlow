'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Users', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      nombre: { type: Sequelize.STRING },
      email: { type: Sequelize.STRING, unique: true },
      password: { type: Sequelize.STRING },
      rol: { type: Sequelize.STRING },
      linkId: { type: Sequelize.STRING, unique: true },
      token: { type: Sequelize.STRING, unique: true },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('Users');
  }
};
