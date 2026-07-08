process.env.NODE_ENV = 'local'
process.env.JWT_KEY = process.env.JWT_KEY || 'test-secret'
process.env.ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS || '*'

const request = require('supertest')

const app = require('../../index')
const db = require('../../db/models')
const redis = require('../../config/redis')

async function ensureDependenciesReady() {
   await db.sequelize.authenticate()
   await redis.ping()
}

function expectHealthyResponse(response) {
   expect(response.status).toBe(200)
   expect(response.body.success).toBe(true)
   expect(response.body.message).toBe('healthy')
   expect(response.body.data).toMatchObject({
      status: 'ok'
   })
   expect(Array.isArray(response.body.data.checks)).toBe(true)
}

function checkByName(response, name) {
   return response.body.data.checks.find((check) => check.name === name)
}

describe('health API', () => {
   beforeAll(async () => {
      await ensureDependenciesReady()
   })

   it('GET /health returns 200 when Postgres and Redis are healthy', async () => {
      const response = await request(app).get('/health')

      expectHealthyResponse(response)
   })

   it('GET /api/health returns 200 when Postgres and Redis are healthy', async () => {
      const response = await request(app).get('/api/health')

      expectHealthyResponse(response)
   })

   it('response includes postgres check', async () => {
      const response = await request(app).get('/health')
      const postgres = checkByName(response, 'postgres')

      expectHealthyResponse(response)
      expect(postgres).toEqual({
         name: 'postgres',
         status: 'ok'
      })
   })

   it('response includes redis check', async () => {
      const response = await request(app).get('/health')
      const redisCheck = checkByName(response, 'redis')

      expectHealthyResponse(response)
      expect(redisCheck).toEqual({
         name: 'redis',
         status: 'ok'
      })
   })

   it('response includes timestamp', async () => {
      const response = await request(app).get('/health')
      const timestamp = response.body.data.timestamp

      expectHealthyResponse(response)
      expect(timestamp).toBeTruthy()
      expect(Number.isNaN(Date.parse(timestamp))).toBe(false)
   })

   it('response returns success true when all dependencies are healthy', async () => {
      const response = await request(app).get('/health')
      const allChecksHealthy = response.body.data.checks.every(
         (check) => check.status === 'ok'
      )

      expectHealthyResponse(response)
      expect(allChecksHealthy).toBe(true)
      expect(response.body.success).toBe(true)
   })
})
