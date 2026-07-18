'use strict'

const { Op } = require('sequelize')
const { v4: uuidv4 } = require('uuid')
const { clinicalCases } = require('../data/demo-clinical-cases')

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    for (const clinicalCase of clinicalCases) {
      if (clinicalCase.clues.length !== 5) {
        throw new Error(
          `${clinicalCase.name} harus memiliki tepat lima clue`
        )
      }
    }

    const [vignettes] = await queryInterface.sequelize.query(
      `
            SELECT
               quiz_vignettes.id,
               quiz_vignettes.variant_name,
               diseases.icd_code
            FROM quiz_vignettes
            INNER JOIN diseases
               ON diseases.id = quiz_vignettes.disease_id
            WHERE diseases.icd_code IN (:icdCodes)
         `,
      {
        replacements: {
          icdCodes: clinicalCases.map(
            (clinicalCase) => clinicalCase.icdCode
          )
        }
      }
    )

    const vignetteByCode = new Map(
      vignettes.map((vignette) => [vignette.icd_code, vignette])
    )

    const missingCodes = clinicalCases
      .filter((clinicalCase) => !vignetteByCode.has(clinicalCase.icdCode))
      .map((clinicalCase) => clinicalCase.icdCode)

    if (missingCodes.length > 0) {
      throw new Error(
        `Vignette untuk clue tidak ditemukan: ${missingCodes.join(', ')}`
      )
    }

    const now = new Date()

    const clues = clinicalCases.flatMap((clinicalCase) => {
      const vignette = vignetteByCode.get(clinicalCase.icdCode)

      return clinicalCase.clues.map((clue, index) => ({
        id: uuidv4(),
        vignette_id: vignette.id,
        clue_number: index + 1,
        content: clue.content,
        type: clue.type,
        created_at: now,
        updated_at: now
      }))
    })

    await queryInterface.bulkInsert('clues', clues, {
      ignoreDuplicates: true
    })
  },

  async down(queryInterface) {
    const [vignettes] = await queryInterface.sequelize.query(
      `
            SELECT quiz_vignettes.id
            FROM quiz_vignettes
            INNER JOIN diseases
               ON diseases.id = quiz_vignettes.disease_id
            WHERE diseases.icd_code IN (:icdCodes)
         `,
      {
        replacements: {
          icdCodes: clinicalCases.map(
            (clinicalCase) => clinicalCase.icdCode
          )
        }
      }
    )

    const vignetteIds = vignettes.map((vignette) => vignette.id)

    if (vignetteIds.length === 0) return

    await queryInterface.bulkDelete(
      'clues',
      {
        vignette_id: {
          [Op.in]: vignetteIds
        }
      },
      {}
    )
  }
}