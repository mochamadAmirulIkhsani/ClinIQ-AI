process.env.NODE_ENV = 'local'
process.env.JWT_KEY = process.env.JWT_KEY || 'test-secret'
process.env.ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS || '*'

const request = require('supertest')
const { Op } = require('sequelize')

const app = require('../index')
const db = require('../db/models')
const bcrypt = require('../src/utils/bcrypt')

const TEST_PASSWORD = 'Password123'
const TEST_EMAILS = [
   'auth-register@example.test',
   'auth-login@example.test',
   'auth-inactive@example.test'
]

async function ensureUserRole() {
   const [role] = await db.role.findOrCreate({
      where: { name: 'User' },
      defaults: {
         name: 'User',
         is_superadmin: false
      }
   })

   return role
}

async function cleanupUsers() {
   await db.user.destroy({
      where: {
         email: {
            [Op.in]: TEST_EMAILS
         }
      },
      force: true
   })
}

async function createUser({ email, status = true }) {
   const role = await ensureUserRole()

   return db.user.create({
      name: 'Auth Test User',
      email,
      password: bcrypt.hashPassword(TEST_PASSWORD),
      role_id: role.id,
      status
   })
}

function tokenCookieFrom(response) {
   const cookies = response.headers['set-cookie'] || []
   const tokenCookie = cookies.find((cookie) => cookie.startsWith('token='))

   expect(tokenCookie).toBeTruthy()

   return tokenCookie.split(';')[0]
}

describe('auth API', () => {
   beforeAll(async () => {
      await db.sequelize.authenticate()
      await ensureUserRole()
   })

   beforeEach(async () => {
      await cleanupUsers()
   })

   afterAll(async () => {
      await cleanupUsers()
      await db.sequelize.close()
   })

   it('registers a user with default User role and does not expose password', async () => {
      const response = await request(app).post('/api/v1/auth').send({
         name: 'Auth Register',
         email: 'auth-register@example.test',
         password: TEST_PASSWORD
      })

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('success')
      expect(response.body.data).toMatchObject({
         name: 'Auth Register',
         email: 'auth-register@example.test',
         status: true
      })
      expect(response.body.data.id).toBeTruthy()
      expect(response.body.data.role_id).toBeTruthy()
      expect(response.body.data.password).toBeUndefined()

      const savedUser = await db.user.findOne({
         where: { email: 'auth-register@example.test' }
      })

      expect(savedUser).toBeTruthy()
      expect(savedUser.password).not.toBe(TEST_PASSWORD)
      expect(bcrypt.compare(TEST_PASSWORD, savedUser.password)).toBe(true)
   })

   it('rejects duplicate email registration', async () => {
      await createUser({ email: 'auth-register@example.test' })

      const response = await request(app).post('/api/v1/auth').send({
         name: 'Duplicate User',
         email: 'auth-register@example.test',
         password: TEST_PASSWORD
      })

      expect(response.status).toBe(409)
      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('User already registered')
      expect(response.body.data).toBeNull()
   })

   it('rejects invalid register payload', async () => {
      const response = await request(app).post('/api/v1/auth').send({
         name: '',
         email: 'not-an-email',
         password: '123'
      })

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.message).toBeTruthy()
      expect(response.body.data).toBeNull()
   })

   it('logs in an active user and sets an httpOnly token cookie', async () => {
      await createUser({ email: 'auth-login@example.test' })

      const response = await request(app).post('/api/v1/auth/login').send({
         email: 'auth-login@example.test',
         password: TEST_PASSWORD
      })

      const cookies = response.headers['set-cookie'] || []

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toMatchObject({
         email: 'auth-login@example.test',
         name: 'Auth Test User',
         is_superadmin: false
      })
      expect(response.body.data.password).toBeUndefined()
      expect(cookies.some((cookie) => cookie.startsWith('token='))).toBe(true)
      expect(cookies.some((cookie) => cookie.includes('HttpOnly'))).toBe(true)
   })

   it('rejects login with wrong password', async () => {
      await createUser({ email: 'auth-login@example.test' })

      const response = await request(app).post('/api/v1/auth/login').send({
         email: 'auth-login@example.test',
         password: 'WrongPassword123'
      })

      expect(response.status).toBe(401)
      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Invalid email or password')
      expect(response.body.data).toBeNull()
   })

   it('rejects login for inactive user', async () => {
      await createUser({
         email: 'auth-inactive@example.test',
         status: false
      })

      const response = await request(app).post('/api/v1/auth/login').send({
         email: 'auth-inactive@example.test',
         password: TEST_PASSWORD
      })

      expect(response.status).toBe(401)
      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('User is not active')
      expect(response.body.data).toBeNull()
   })

   it('rejects current user request without token cookie', async () => {
      const response = await request(app).get('/api/v1/auth/me')

      expect(response.status).toBe(401)
      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Unauthorized, token not found')
      expect(response.body.data).toBeNull()
   })

   it('returns current user with valid token cookie', async () => {
      await createUser({ email: 'auth-login@example.test' })

      const loginResponse = await request(app).post('/api/v1/auth/login').send({
         email: 'auth-login@example.test',
         password: TEST_PASSWORD
      })

      const cookie = tokenCookieFrom(loginResponse)

      const response = await request(app)
         .get('/api/v1/auth/me')
         .set('Cookie', cookie)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toMatchObject({
         email: 'auth-login@example.test',
         name: 'Auth Test User',
         status: true
      })
      expect(response.body.data.role).toMatchObject({
         name: 'User'
      })
      expect(response.body.data.password).toBeUndefined()
   })

   it('clears token cookie on logout', async () => {
      await createUser({ email: 'auth-login@example.test' })

      const loginResponse = await request(app).post('/api/v1/auth/login').send({
         email: 'auth-login@example.test',
         password: TEST_PASSWORD
      })

      const cookie = tokenCookieFrom(loginResponse)

      const response = await request(app)
         .post('/api/v1/auth/logout')
         .set('Cookie', cookie)

      const cookies = response.headers['set-cookie'] || []

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toBe(true)
      expect(cookies.some((item) => item.startsWith('token=;'))).toBe(true)
   })
})
