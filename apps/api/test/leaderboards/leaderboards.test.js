process.env.NODE_ENV = 'local'
process.env.JWT_KEY =
    process.env.JWT_KEY || 'test-secret'
process.env.ALLOWED_ORIGINS =
    process.env.ALLOWED_ORIGINS || '*'
process.env.SKIP_AI_EXPLANATIONS = 'true'

const request = require('supertest')
const { Op } = require('sequelize')

const app = require('../../index')
const db = require('../../db/models')
const bcrypt = require('../../src/utils/bcrypt')
const redis = require('../../config/redis')
const {
   globalLeaderboardCacheKey,
   groupLeaderboardCacheKey
} = require('../../src/utils/leaderboard-cache')

const TEST_PASSWORD = 'Password123'

const TEST_EMAILS = [
   'leaderboard-alpha@example.test',
   'leaderboard-beta@example.test',
   'leaderboard-gamma@example.test',
   'leaderboard-outsider@example.test'
]

const TEST_CODES = [
   'T-LB-001',
   'T-LB-002',
   'T-LB-003'
]

const TEST_INVITE_CODE = 'LBTEST01'

const TEST_SCORES = {
   first: 900_000_000,
   second: 800_000_000,
   third: 700_000_000
}

let role
let users
let cookies
let vignettes
let group

function todayDate() {
   return new Date().toISOString().slice(0, 10)
}

async function ensureUserRole() {
   const [userRole] = await db.role.findOrCreate({
      where: {
         name: 'User'
      },
      defaults: {
         name: 'User',
         is_superadmin: false
      }
   })

   return userRole
}

async function createUser(email, name) {
   return db.user.create({
      name,
      email,
      password: bcrypt.hashPassword(TEST_PASSWORD),
      role_id: role.id,
      status: true
   })
}

async function loginCookie(email) {
   const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
         email,
         password: TEST_PASSWORD
      })

   const cookie = (
      response.headers['set-cookie'] || []
   ).find((value) => value.startsWith('token='))

   expect(cookie).toBeTruthy()

   return cookie.split(';')[0]
}

async function createVignette(index) {
   const disease = await db.Disease.create({
      icd_code: TEST_CODES[index],
      name: `Leaderboard Disease ${index + 1}`,
      description: 'Leaderboard test disease'
   })

   const vignette = await db.QuizVignette.create({
      disease_id: disease.id,
      variant_name: `leaderboard-vignette-${index + 1}`
   })

   await Promise.all(
      Array.from({ length: 5 }, (_, clueIndex) =>
         db.Clue.create({
            vignette_id: vignette.id,
            clue_number: clueIndex + 1,
            content:
                    `Leaderboard clue ${clueIndex + 1}`,
            type: 'clinical'
         })
      )
   )

   return {
      disease,
      vignette
   }
}

async function createCompletedAttempt(
   user,
   vignette,
   score,
   options = {}
) {
   return db.QuizAttempt.create({
      user_id: user.id,
      vignette_id: vignette.id,
      clues_revealed: 1,
      attempt_date: todayDate(),
      is_correct: true,
      score,
      submitted_diagnosis: 'Correct',
      ...options
   })
}

async function clearLeaderboardCaches() {
   const keys = await redis.keys('leaderboard:v1:*')

   if (keys.length > 0) {
      await redis.del(...keys)
   }
}

async function cleanupLeaderboardData() {
   await clearLeaderboardCaches()

   const testUsers = await db.user.findAll({
      attributes: ['id'],
      where: {
         email: {
            [Op.in]: TEST_EMAILS
         }
      },
      paranoid: false
   })

   const userIds = testUsers.map((user) => user.id)

   const diseases = await db.Disease.findAll({
      attributes: ['id'],
      where: {
         icd_code: {
            [Op.in]: TEST_CODES
         }
      }
   })

   const diseaseIds = diseases.map(
      (disease) => disease.id
   )

   const foundVignettes =
        diseaseIds.length > 0
           ? await db.QuizVignette.findAll({
              attributes: ['id'],
              where: {
                 disease_id: {
                    [Op.in]: diseaseIds
                 }
              }
           })
           : []

   const vignetteIds = foundVignettes.map(
      (vignette) => vignette.id
   )

   const groups = await db.Group.findAll({
      attributes: ['id'],
      where: {
         [Op.or]: [
            {
               invite_code: TEST_INVITE_CODE
            },
            userIds.length > 0
               ? {
                  owner_id: {
                     [Op.in]: userIds
                  }
               }
               : null
         ].filter(Boolean)
      }
   })

   const groupIds = groups.map(
      (testGroup) => testGroup.id
   )

   if (groupIds.length > 0 || userIds.length > 0) {
      await db.GroupMember.destroy({
         where: {
            [Op.or]: [
               groupIds.length > 0
                  ? {
                     group_id: {
                        [Op.in]: groupIds
                     }
                  }
                  : null,
               userIds.length > 0
                  ? {
                     user_id: {
                        [Op.in]: userIds
                     }
                  }
                  : null
            ].filter(Boolean)
         }
      })
   }

   if (userIds.length > 0 || vignetteIds.length > 0) {
      await db.QuizAttempt.destroy({
         where: {
            [Op.or]: [
               userIds.length > 0
                  ? {
                     user_id: {
                        [Op.in]: userIds
                     }
                  }
                  : null,
               vignetteIds.length > 0
                  ? {
                     vignette_id: {
                        [Op.in]: vignetteIds
                     }
                  }
                  : null
            ].filter(Boolean)
         }
      })
   }

   if (vignetteIds.length > 0) {
      await db.Clue.destroy({
         where: {
            vignette_id: {
               [Op.in]: vignetteIds
            }
         }
      })

      await db.QuizVignette.destroy({
         where: {
            id: {
               [Op.in]: vignetteIds
            }
         }
      })
   }

   if (groupIds.length > 0) {
      await db.Group.destroy({
         where: {
            id: {
               [Op.in]: groupIds
            }
         }
      })
   }

   if (diseaseIds.length > 0) {
      await db.Disease.destroy({
         where: {
            id: {
               [Op.in]: diseaseIds
            }
         }
      })
   }

   await db.user.destroy({
      where: {
         email: {
            [Op.in]: TEST_EMAILS
         }
      },
      force: true,
      paranoid: false
   })
}

async function authenticatedGet(
   path,
   cookie = cookies.alpha
) {
   return request(app)
      .get(path)
      .set('Cookie', cookie)
}

describe('leaderboards API', () => {
   beforeAll(async () => {
      await db.sequelize.authenticate()
      await redis.ping()

      role = await ensureUserRole()
   })

   beforeEach(async () => {
      await cleanupLeaderboardData()

      users = {
         alpha: await createUser(
            TEST_EMAILS[0],
            'Alpha Clinician'
         ),
         beta: await createUser(
            TEST_EMAILS[1],
            'Beta Clinician'
         ),
         gamma: await createUser(
            TEST_EMAILS[2],
            'Gamma Clinician'
         ),
         outsider: await createUser(
            TEST_EMAILS[3],
            'Outside Clinician'
         )
      }

      cookies = {
         alpha: await loginCookie(users.alpha.email),
         beta: await loginCookie(users.beta.email),
         gamma: await loginCookie(users.gamma.email),
         outsider: await loginCookie(
            users.outsider.email
         )
      }

      vignettes = await Promise.all([
         createVignette(0),
         createVignette(1),
         createVignette(2)
      ])

      group = await db.Group.create({
         name: 'Leaderboard Study Group',
         description: 'Leaderboard test group',
         invite_code: TEST_INVITE_CODE,
         owner_id: users.alpha.id,
         member_count: 1
      })

      await db.GroupMember.create({
         group_id: group.id,
         user_id: users.alpha.id,
         is_admin: true
      })
   })

   afterEach(async () => {
      vi.restoreAllMocks()
      await cleanupLeaderboardData()
   })

   it('global leaderboard requires authentication', async () => {
      const response = await request(app).get(
         '/api/v1/leaderboards/global'
      )

      expect(response.status).toBe(401)
      expect(response.body.success).toBe(false)
   })

   it('returns deterministic global rankings and ties', async () => {
      await createCompletedAttempt(
         users.alpha,
         vignettes[0].vignette,
         TEST_SCORES.first
      )

      await createCompletedAttempt(
         users.alpha,
         vignettes[1].vignette,
         TEST_SCORES.second
      )

      await createCompletedAttempt(
         users.beta,
         vignettes[0].vignette,
         TEST_SCORES.first
      )

      await createCompletedAttempt(
         users.beta,
         vignettes[1].vignette,
         TEST_SCORES.second
      )

      await createCompletedAttempt(
         users.gamma,
         vignettes[0].vignette,
         TEST_SCORES.third
      )

      const response = await authenticatedGet(
         '/api/v1/leaderboards/global',
         cookies.gamma
      )

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)

      const testEntries =
            response.body.data.entries.filter((entry) =>
               [
                  users.alpha.id,
                  users.beta.id,
                  users.gamma.id
               ].includes(entry.user_id)
            )

      expect(
         testEntries.map((entry) => entry.name)
      ).toEqual([
         'Alpha Clinician',
         'Beta Clinician',
         'Gamma Clinician'
      ])

      expect(
         testEntries.map((entry) => entry.rank)
      ).toEqual([1, 1, 2])

      expect(
         testEntries.map((entry) => entry.position)
      ).toEqual([1, 2, 3])

      expect(
         response.body.data.total_participants
      ).toBeGreaterThanOrEqual(3)

      expect(response.body.data.current_user).toMatchObject({
         user_id: users.gamma.id,
         rank: 2,
         position: 3,
         score: TEST_SCORES.third
      })
   })

   it('returns current user rank outside the requested limit', async () => {
      await createCompletedAttempt(
         users.alpha,
         vignettes[0].vignette,
         TEST_SCORES.first
      )

      await createCompletedAttempt(
         users.beta,
         vignettes[0].vignette,
         TEST_SCORES.second
      )

      await createCompletedAttempt(
         users.gamma,
         vignettes[0].vignette,
         TEST_SCORES.third
      )

      const response = await authenticatedGet(
         '/api/v1/leaderboards/global?limit=1',
         cookies.gamma
      )

      expect(response.status).toBe(200)
      expect(response.body.data.entries).toHaveLength(1)

      expect(
         response.body.data.entries[0]
      ).toMatchObject({
         user_id: users.alpha.id,
         rank: 1,
         position: 1,
         score: TEST_SCORES.first
      })

      expect(response.body.data.current_user).toMatchObject({
         user_id: users.gamma.id,
         rank: 3,
         position: 3,
         score: TEST_SCORES.third
      })
   })

   it('serves repeated global leaderboard requests from Redis', async () => {
      await createCompletedAttempt(
         users.alpha,
         vignettes[0].vignette,
         500
      )

      const firstResponse = await authenticatedGet(
         '/api/v1/leaderboards/global'
      )

      const secondResponse = await authenticatedGet(
         '/api/v1/leaderboards/global'
      )

      expect(firstResponse.status).toBe(200)
      expect(firstResponse.body.meta).toEqual({
         'X-Cache': 'MISS'
      })

      expect(secondResponse.status).toBe(200)
      expect(secondResponse.body.meta).toEqual({
         'X-Cache': 'HIT'
      })

      const cached = await redis.get(
         globalLeaderboardCacheKey()
      )

      expect(cached).toBeTruthy()
   })

   it('falls back to PostgreSQL when Redis read fails', async () => {
      await createCompletedAttempt(
         users.alpha,
         vignettes[0].vignette,
         TEST_SCORES.first
      )

      const getSpy = vi
         .spyOn(redis, 'get')
         .mockRejectedValueOnce(
            new Error('Redis test failure')
         )

      try {
         const response = await authenticatedGet(
            '/api/v1/leaderboards/global'
         )

         expect(response.status).toBe(200)
         expect(response.body.success).toBe(true)

         expect(response.body.meta).toEqual({
            'X-Cache': 'MISS'
         })

         expect(response.body.data.entries).toEqual(
            expect.arrayContaining([
               expect.objectContaining({
                  user_id: users.alpha.id,
                  name: 'Alpha Clinician',
                  score: TEST_SCORES.first,
                  rank: 1,
                  position: 1
               })
            ])
         )

         expect(response.body.data.current_user).toMatchObject({
            user_id: users.alpha.id,
            score: TEST_SCORES.first,
            rank: 1,
            position: 1
         })
      } finally {
         getSpy.mockRestore()
      }
   })

   it('rejects group leaderboard access by non-members', async () => {
      const response = await authenticatedGet(
         `/api/v1/leaderboards/group/${group.id}`,
         cookies.outsider
      )

      expect(response.status).toBe(403)
      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe(
         'You are not a member of this group'
      )
   })

   it('includes only group members and post-join scores', async () => {
      await db.GroupMember.create({
         group_id: group.id,
         user_id: users.beta.id,
         is_admin: false,
         joined_at: new Date('2026-01-02T00:00:00.000Z')
      })

      await createCompletedAttempt(
         users.beta,
         vignettes[0].vignette,
         500,
         {
            createdAt:
                    new Date('2026-01-01T00:00:00.000Z')
         }
      )

      await createCompletedAttempt(
         users.beta,
         vignettes[1].vignette,
         300,
         {
            createdAt:
                    new Date('2026-01-03T00:00:00.000Z')
         }
      )

      await createCompletedAttempt(
         users.outsider,
         vignettes[0].vignette,
         900
      )

      const response = await authenticatedGet(
         `/api/v1/leaderboards/group/${group.id}`,
         cookies.beta
      )

      expect(response.status).toBe(200)
      expect(response.body.data.scope).toBe('group')

      const betaEntry =
            response.body.data.entries.find(
               (entry) =>
                  entry.user_id === users.beta.id
            )

      expect(betaEntry.score).toBe(300)

      expect(
         response.body.data.entries.some(
            (entry) =>
               entry.user_id === users.outsider.id
         )
      ).toBe(false)
   })

   it('invalidates global and group caches after a correct diagnosis', async () => {
      await authenticatedGet(
         '/api/v1/leaderboards/global'
      )

      await authenticatedGet(
         `/api/v1/leaderboards/group/${group.id}`
      )

      expect(
         await redis.get(globalLeaderboardCacheKey())
      ).toBeTruthy()

      expect(
         await redis.get(
            groupLeaderboardCacheKey(group.id)
         )
      ).toBeTruthy()

      const attempt = await db.QuizAttempt.create({
         user_id: users.alpha.id,
         vignette_id: vignettes[0].vignette.id,
         clues_revealed: 1,
         attempt_date: todayDate()
      })

      const response = await request(app)
         .post('/api/v1/quiz/submit-diagnosis')
         .set('Cookie', cookies.alpha)
         .send({
            attempt_id: attempt.id,
            diagnosis: vignettes[0].disease.name
         })

      expect(response.status).toBe(200)
      expect(response.body.data.is_correct).toBe(true)

      expect(
         await redis.get(globalLeaderboardCacheKey())
      ).toBeNull()

      expect(
         await redis.get(
            groupLeaderboardCacheKey(group.id)
         )
      ).toBeNull()
   })

   it('invalidates group cache after join, leave, and disband', async () => {
      const groupCacheKey =
            groupLeaderboardCacheKey(group.id)

      await authenticatedGet(
         `/api/v1/leaderboards/group/${group.id}`
      )

      expect(
         await redis.get(groupCacheKey)
      ).toBeTruthy()

      await request(app)
         .post(`/api/v1/groups/${group.id}/join`)
         .set('Cookie', cookies.beta)
         .send({
            invite_code: TEST_INVITE_CODE
         })
         .expect(201)

      expect(
         await redis.get(groupCacheKey)
      ).toBeNull()

      await authenticatedGet(
         `/api/v1/leaderboards/group/${group.id}`,
         cookies.beta
      )

      expect(
         await redis.get(groupCacheKey)
      ).toBeTruthy()

      await request(app)
         .post(`/api/v1/groups/${group.id}/leave`)
         .set('Cookie', cookies.beta)
         .send({})
         .expect(200)

      expect(
         await redis.get(groupCacheKey)
      ).toBeNull()

      await authenticatedGet(
         `/api/v1/leaderboards/group/${group.id}`
      )

      expect(
         await redis.get(groupCacheKey)
      ).toBeTruthy()

      await request(app)
         .delete(`/api/v1/groups/${group.id}`)
         .set('Cookie', cookies.alpha)
         .expect(200)

      expect(
         await redis.get(groupCacheKey)
      ).toBeNull()
   })
})
