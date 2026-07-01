const Controller = require('./controller')
const router = require('express').Router()

router.get('/', Controller.listUser)
router.post('/', Controller.createUser)
router.get('/:user_id', Controller.showUser)
router.put('/:user_id', Controller.updateUser)
router.delete('/:user_id', Controller.deleteUser)
router.put('/:user_id/access', Controller.updateUserAccess)
router.post('/:user_id/reset-password', Controller.resetPassword)

module.exports = router
