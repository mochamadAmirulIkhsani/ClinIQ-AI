'use strict'

const { Op } = require('sequelize')
const { v4: uuidv4 } = require('uuid')
const { clinicalCases } = require('../data/demo-clinical-cases')

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date()

    const diseases = clinicalCases.map((clinicalCase) => ({
      id: uuidv4(),
      icd_code: clinicalCase.icdCode,
      name: clinicalCase.name,
      description: clinicalCase.description,
      created_at: now,
      updated_at: now
    }))

    await queryInterface.bulkInsert('diseases', diseases, {
      ignoreDuplicates: true
    })
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete(
      'diseases',
      {
        icd_code: {
          [Op.in]: clinicalCases.map(
            (clinicalCase) => clinicalCase.icdCode
          )
        }
      },
      {}
    )
  }
}