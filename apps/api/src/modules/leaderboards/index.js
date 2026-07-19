/**
 * @swagger
 * /v1/leaderboards/global:
 *   get:
 *     tags: [Leaderboards]
 *     summary: Get the global leaderboard
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 25
 *     responses:
 *       200: { description: Global rankings }
 *
 * /v1/leaderboards/group/{group_id}:
 *   get:
 *     tags: [Leaderboards]
 *     summary: Get a study group leaderboard
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: group_id
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 25
 *     responses:
 *       200: { description: Group rankings }
 *       403: { description: User is not a member }
 *       404: { description: Group not found }
 */
const Controller = require('./controller')
const router = require('express').Router()
const { authentication } = require('../../middleware/auth')

router.get('/global', authentication, Controller.getGlobal)
router.get('/group/:group_id', authentication, Controller.getByGroup)

module.exports = router
