'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Asegúrate de eliminar primero cualquier constraint previo con el nombre anterior si existía
    await queryInterface.removeConstraint('Fotos', 'Fotos_EventoId_fkey').catch(() => {});

    await queryInterface.addConstraint('Fotos', {
      fields: ['EventoId'], // ✅ Nuevo campo correcto
      type: 'foreign key',
      name: 'Fotos_EventoId_fkey', // ✅ Nombre del constraint
      references: {
        table: 'Eventos', // ✅ Nombre correcto de la tabla
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('Fotos', 'Fotos_EventoId_fkey');

    // Podrías volver a agregar otra constraint si decides revertir el modelo
  },
};
