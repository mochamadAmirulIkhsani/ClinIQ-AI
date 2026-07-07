const api = require('../../../utils/api')
const db = require('../../../../db/models')
const bcrypt = require('../../../utils/bcrypt')
const JWT = require('../../../utils/jwt')
const { HttpStatusCode } = require('axios')
const { validateRequest } = require('../../../utils/validation')
const { LoginSchema, ChangePasswordSchema } = require('./schema')

class Controller {
   static async loginUser(req, res) {
      try {
         const data = validateRequest(LoginSchema, req)

         const user = await db.user.findOne({
            where: {
               email: data.email
            }
         })

         if (!user) {
            throw {
               code: HttpStatusCode.Unauthorized,
               message: 'User is not registered'
            }
         }

         const validatedPassword = bcrypt.compare(data.password, user.password)
         if (!validatedPassword) {
            throw {
               code: HttpStatusCode.Unauthorized,
               message: 'Invalid email or password'
            }
         }

         if (!user.status) {
            throw {
               code: HttpStatusCode.Unauthorized,
               message: 'User is not active'
            }
         }

         const role = await db.role.findByPk(user.role_id)
         if (!role) {
            throw {
               code: HttpStatusCode.Unauthorized,
               message: 'Role is not assigned'
            }
         }

         const result = {
            id: user.id,
            email: user.email,
            name: user.name,
            is_superadmin: role.is_superadmin
         }

         const token = JWT.generateToken(result)

         res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: 6 * 60 * 60 * 1000 // 6 hours
         })

         res
            .status(HttpStatusCode.Ok)
            .json(api.results(result, HttpStatusCode.Ok, { req }))
      } catch (err) {
         console.log(err)
         err.code =
        typeof err.code !== 'undefined' && err.code !== null
           ? err.code
           : HttpStatusCode.InternalServerError
         res.status(err.code).json(api.results(null, err.code, { err }))
      }
   }

   static async logoutUser(req, res) {
      try {
         res.clearCookie('token', {
            httpOnly: true,
            secure: true,
            sameSite: 'none'
         })

         res
            .status(HttpStatusCode.Ok)
            .json(api.results(true, HttpStatusCode.Ok, { req }))
      } catch (err) {
         console.log(err)
         err.code =
        typeof err.code !== 'undefined' && err.code !== null
           ? err.code
           : HttpStatusCode.InternalServerError
         res.status(err.code).json(api.results(null, err.code, { err }))
      }
   }

   static async changePassword(req, res) {
      try {
         const user = req.user
         const data = validateRequest(ChangePasswordSchema, req)

         const currentUser = await db.user.findByPk(user.id)
         const isValidOldPassword = bcrypt.compare(
            data.old_password,
            currentUser.password
         )
         if (!isValidOldPassword) {
            throw {
               code: HttpStatusCode.BadRequest,
               message: 'Old password is incorrect'
            }
         }

         const isValidNewPassword = bcrypt.compare(
            data.new_password,
            currentUser.password
         )
         if (isValidNewPassword) {
            throw {
               code: HttpStatusCode.BadRequest,
               message: 'New password must be different from old password'
            }
         }

         const newPasswordHash = bcrypt.hashPassword(data.new_password)
         await currentUser.update({
            password: newPasswordHash
         })

         res
            .status(HttpStatusCode.Ok)
            .json(api.results(true, HttpStatusCode.Ok, { req }))
      } catch (err) {
         console.log(err)
         err.code =
        typeof err.code !== 'undefined' && err.code !== null
           ? err.code
           : HttpStatusCode.InternalServerError
         res.status(err.code).json(api.results(null, err.code, { err }))
      }
   }

   static async getMe(req, res) {
      try {
         const user = await db.user.findByPk(req.user.id)

         if (!user) {
            throw {
               code: HttpStatusCode.NotFound,
               message: 'User not found'
            }
         }

         const result = {
            id: user.id,
            email: user.email,
            name: user.name,
            access: []
         }

         const access = await db.sequelize.query(
            `
            SELECT 
               m.id as menu_id,
               m.name as menu,
               m.code as module,
               ua.read as read_permission,
               ua.create as create_permission,
               ua.update as update_permission,
               ua.delete as delete_permission
            FROM menus m
            LEFT JOIN user_access ua ON ua.menu_id = m.id AND ua.user_id = :user_id
         `,
            {
               replacements: {
                  user_id: user.id
               },
               type: db.sequelize.QueryTypes.SELECT
            }
         )

         const accessFormatted = access.map((item) => ({
            menu_id: item.menu_id,
            module: item.module,
            name: item.menu,
            permissions: [
               {
                  action: 'read',
                  granted: Boolean(item.read_permission)
               },
               {
                  action: 'create',
                  granted: Boolean(item.create_permission)
               },
               {
                  action: 'update',
                  granted: Boolean(item.update_permission)
               },
               {
                  action: 'delete',
                  granted: Boolean(item.delete_permission)
               }
            ]
         }))

         result.access = accessFormatted

         res
            .status(HttpStatusCode.Ok)
            .json(api.results(result, HttpStatusCode.Ok, { req }))
      } catch (err) {
         console.log(err)
         err.code =
        typeof err.code !== 'undefined' && err.code !== null
           ? err.code
           : HttpStatusCode.InternalServerError
         res.status(err.code).json(api.results(null, err.code, { err }))
      }
   }
}

module.exports = Controller
