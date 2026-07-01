const { HttpStatusCode } = require('axios')
const JWT = require('../utils/jwt')
const { user: User } = require('../../db/models')
const { api } = require('../utils/api')

const authentication = async (req, res, next) => {
  try {
    const reqToken = req.cookies?.token || null

    if (!reqToken) {
      throw {
        code: HttpStatusCode.Unauthorized,
        message: 'Unauthorized, token not found'
      }
    }

    const token = reqToken
    const decodedToken = JWT.verifyToken(token)

    let me = null
    if (!me) {
      const user = await User.findOne({
        where: { id: decodedToken.id }
      })

      if (!user) {
        throw {
          code: HttpStatusCode.Unauthorized,
          message: 'Unauthorized, Invalid Token'
        }
      }

      if (!user.is_active) {
        throw {
          code: HttpStatusCode.Unauthorized,
          message: 'Unauthorized, Account is not active'
        }
      }

      me = user
    }

    req.user = {
      id: me.id,
      name: me.name,
      email: me.email,
      is_superadmin: decodedToken.is_superadmin
    }

    next()
  } catch (err) {
    console.error(err)
    err.code = err.code ?? HttpStatusCode.InternalServerError

    if (err.name === 'JsonWebTokenError') {
      err = {
        message: 'Unauthorized, invalid token',
        code: HttpStatusCode.Unauthorized
      }
    }

    if (err.name === 'TokenExpiredError') {
      err = {
        message: 'Unauthorized, token expired',
        code: HttpStatusCode.Unauthorized
      }
    }

    res.status(err.code).json(api(null, err.code, { err }))
  }
}

module.exports = { authentication }
