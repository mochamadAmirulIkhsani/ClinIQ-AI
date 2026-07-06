const router = require('express').Router()
const express = require('express')
const { authentication } = require('../src/middleware/auth')

router.use(express.json())
router.use(express.urlencoded({ extended: true }))

router.get('/status', (req, res) => {
   res.send('Running ⚡')
})

// DASHBOARD
router.use('/dashboard/auth', require('./modules/dashboard/auth'))
router.use(
   '/dashboard/user',
   authentication,
   require('./modules/dashboard/users')
)
router.use('/dashboard/master', authentication)

module.exports = router
