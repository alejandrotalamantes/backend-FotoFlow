'use strict';
const bcrypt = require('bcrypt');



module.exports = {
  async up(queryInterface, Sequelize) {
    const hashedPassword = bcrypt.hashSync('123456', 10); // puedes cambiar la contraseña
    await queryInterface.bulkInsert('Users', [
      {
        nombre: 'Admin',
        email: 'admin@admin.com',
        rol: 'superadmin',
        password: hashedPassword, // 👈 importante: asegúrate de hashear si tu modelo lo hace automáticamente
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      // más usuarios...
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Users', null, {});
  }
};
