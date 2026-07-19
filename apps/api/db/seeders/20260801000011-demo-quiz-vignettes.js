'use strict'

const { Op } = require('sequelize')
const { v4: uuidv4 } = require('uuid')
const { clinicalCases } = require('../data/demo-clinical-cases')

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const [diseases] = await queryInterface.sequelize.query(
      `
            SELECT id, icd_code
            FROM diseases
            WHERE icd_code IN (:icdCodes)
         `,
      {
        replacements: {
          icdCodes: clinicalCases.map(
            (clinicalCase) => clinicalCase.icdCode
          )
        }
      }
    )

    const diseaseByCode = new Map(
      diseases.map((disease) => [disease.icd_code, disease])
    )

    const missingCodes = clinicalCases
      .filter((clinicalCase) => !diseaseByCode.has(clinicalCase.icdCode))
      .map((clinicalCase) => clinicalCase.icdCode)

    if (missingCodes.length > 0) {
      throw new Error(
        `Penyakit untuk vignette tidak ditemukan: ${missingCodes.join(', ')}`
      )
    }

    const now = new Date()

    const vignettes = clinicalCases.map((clinicalCase) => ({
      id: uuidv4(),
      disease_id: diseaseByCode.get(clinicalCase.icdCode).id,
      variant_name: clinicalCase.variantName,
      created_at: now,
      updated_at: now
    }))

    await queryInterface.bulkInsert('quiz_vignettes', vignettes, {
      ignoreDuplicates: true
    })
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete(
      'quiz_vignettes',
      {
        variant_name: {
          [Op.in]: clinicalCases.map(
            (clinicalCase) => clinicalCase.variantName
          )
        }
      },
      {}
    )
  }
}