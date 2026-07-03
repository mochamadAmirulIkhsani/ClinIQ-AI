const Controller = require('./controller')
const router = require('express').Router()
const { authentication } = require('../../../middleware/auth')

router.post('/login', Controller.loginUser)
router.post('/logout', authentication, Controller.logoutUser)
router.put('/change-password', authentication, Controller.changePassword)
router.get('/me', authentication, Controller.getMe)
router.post('/', Controller.registerUser)

module.exports = router
