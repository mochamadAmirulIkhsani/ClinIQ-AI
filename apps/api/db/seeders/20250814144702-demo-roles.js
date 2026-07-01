'use strict'

/** @type {import('sequelize-cli').Migration} */
const uuid = require('uuid')

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      'roles',
      [
        {
          id: uuid.v4(),
          name: 'Superadmin',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: uuid.v4(),
          name: 'Admin',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: uuid.v4(),
          name: 'User',
          created_at: new Date(),
          updated_at: new Date()
        }
      ],
      {}
    )
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('roles', null, {})
  }
}
