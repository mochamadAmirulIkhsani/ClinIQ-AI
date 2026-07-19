'use strict'

const { Op } = require('sequelize')
const { v4: uuidv4 } = require('uuid')
const { clinicalCases } = require('../data/demo-clinical-cases')

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const [users] = await queryInterface.sequelize.query(
      `
            SELECT id
            FROM users
            ORDER BY created_at ASC
            LIMIT 3
         `
    )

    const [vignettes] = await queryInterface.sequelize.query(
      `
            SELECT
               quiz_vignettes.id,
               diseases.icd_code,
               diseases.name AS disease_name
            FROM quiz_vignettes
            INNER JOIN diseases
               ON diseases.id = quiz_vignettes.disease_id
            WHERE diseases.icd_code IN (:icdCodes)
            ORDER BY diseases.icd_code ASC
         `,
      {
        replacements: {
          icdCodes: clinicalCases.map(
            (clinicalCase) => clinicalCase.icdCode
          )
        }
      }
    )

    if (users.length === 0 || vignettes.length === 0) return

    const now = new Date()
    const attemptDate = now.toISOString().slice(0, 10)
    const attempts = []

    users.forEach((user, userIndex) => {
      vignettes.forEach((vignette, vignetteIndex) => {
        const cluesRevealed = ((userIndex + vignetteIndex) % 5) + 1
        const isCorrect = (userIndex + vignetteIndex) % 2 === 0

        attempts.push({
          id: uuidv4(),
          user_id: user.id,
          vignette_id: vignette.id,
          is_correct: isCorrect,
          submitted_diagnosis: isCorrect
            ? vignette.disease_name
            : 'Diagnosis banding lain',
          clues_revealed: cluesRevealed,
          score: isCorrect ? (6 - cluesRevealed) * 100 : 0,
          attempt_date: attemptDate,
          created_at: now,
          updated_at: now
        })
      })
    })

    await queryInterface.bulkInsert('quiz_attempts', attempts, {
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
      'quiz_attempts',
      {
        vignette_id: {
          [Op.in]: vignetteIds
        }
      },
      {}
    )
  }
}