const { HttpStatusCode } = require('axios')
const { QueryTypes } = require('sequelize')
const db = require('../../../db/models')
const {
   globalLeaderboardCacheKey,
   groupLeaderboardCacheKey,
   getLeaderboardSnapshot,
   setLeaderboardSnapshot
} = require('../../utils/leaderboard-cache')

const DEFAULT_LIMIT = 10
const MAX_LIMIT = 25

function parseLimit(value) {
   const parsed = Number.parseInt(value, 10)

   if (!Number.isInteger(parsed) || parsed < 1) {
      return DEFAULT_LIMIT
   }

   return Math.min(parsed, MAX_LIMIT)
}

function normalizeEntry(row) {
   return {
      user_id: row.user_id,
      name: row.name,
      score: Number(row.score) || 0,
      rank: Number(row.rank),
      position: Number(row.position)
   }
}

function buildLeaderboardResponse(
   snapshot,
   currentUserId,
   limit
) {
   return {
      entries: snapshot.entries.slice(0, limit),
      current_user:
         snapshot.entries.find(
            (entry) => entry.user_id === currentUserId
         ) || null,
      total_participants: snapshot.total_participants
   }
}

async function queryRankedSnapshot(groupId = null) {
   const scoreSource = groupId
      ? `
         SELECT
            users.id AS user_id,
            users.name,
            COALESCE(SUM(quiz_attempts.score), 0)::BIGINT AS score
         FROM group_members
         INNER JOIN users
            ON users.id = group_members.user_id
         LEFT JOIN quiz_attempts
            ON quiz_attempts.user_id = users.id
            AND quiz_attempts.is_correct = TRUE
            AND quiz_attempts.created_at >= group_members.joined_at
         WHERE group_members.group_id = :groupId
            AND users.status = TRUE
            AND users.deleted_at IS NULL
         GROUP BY users.id, users.name
      `
      : `
         SELECT
            users.id AS user_id,
            users.name,
            COALESCE(SUM(quiz_attempts.score), 0)::BIGINT AS score
         FROM users
         INNER JOIN quiz_attempts
            ON quiz_attempts.user_id = users.id
            AND quiz_attempts.is_correct = TRUE
         WHERE users.status = TRUE
            AND users.deleted_at IS NULL
         GROUP BY users.id, users.name
         HAVING COALESCE(SUM(quiz_attempts.score), 0) > 0
      `

   const rows = await db.sequelize.query(
      `
         WITH score_totals AS (
            ${scoreSource}
         )
         SELECT
            user_id,
            name,
            score,
            DENSE_RANK() OVER (
               ORDER BY score DESC
            ) AS rank,
            ROW_NUMBER() OVER (
               ORDER BY score DESC, name ASC, user_id ASC
            ) AS position
         FROM score_totals
         ORDER BY position ASC
      `,
      {
         replacements: {
            groupId
         },
         type: QueryTypes.SELECT
      }
   )

   const entries = rows.map(normalizeEntry)

   return {
      entries,
      total_participants: entries.length
   }
}

async function getRankedSnapshot({
   groupId = null
} = {}) {
   const cacheKey = groupId
      ? groupLeaderboardCacheKey(groupId)
      : globalLeaderboardCacheKey()

   const cached = await getLeaderboardSnapshot(cacheKey)

   if (cached) {
      return {
         snapshot: cached,
         cacheStatus: 'HIT'
      }
   }

   const snapshot = await queryRankedSnapshot(groupId)

   await setLeaderboardSnapshot(cacheKey, snapshot)

   return {
      snapshot,
      cacheStatus: 'MISS'
   }
}

class Controller {
   static async getGlobal(req, res) {
      try {
         const limit = parseLimit(req.query.limit)
         const { snapshot, cacheStatus } =
            await getRankedSnapshot()

         return res.status(HttpStatusCode.Ok).json({
            success: true,
            meta: {
               'X-Cache': cacheStatus
            },
            data: {
               scope: 'global',
               group: null,
               ...buildLeaderboardResponse(
                  snapshot,
                  req.user.id,
                  limit
               )
            }
         })
      } catch (err) {
         console.error(
            'Get global leaderboard error:',
            err
         )

         return res
            .status(HttpStatusCode.InternalServerError)
            .json({
               success: false,
               message: 'Failed to fetch leaderboard'
            })
      }
   }

   static async getByGroup(req, res) {
      try {
         const userId = req.user.id
         const groupId = req.params.group_id
         const limit = parseLimit(req.query.limit)

         const group = await db.Group.findByPk(groupId, {
            attributes: ['id', 'name']
         })

         if (!group) {
            return res.status(HttpStatusCode.NotFound).json({
               success: false,
               message: 'Group not found'
            })
         }

         const membership = await db.GroupMember.findOne({
            where: {
               group_id: groupId,
               user_id: userId
            },
            attributes: ['id']
         })

         if (!membership) {
            return res
               .status(HttpStatusCode.Forbidden)
               .json({
                  success: false,
                  message:
                     'You are not a member of this group'
               })
         }

         const { snapshot, cacheStatus } =
            await getRankedSnapshot({
               groupId
            })

         return res.status(HttpStatusCode.Ok).json({
            success: true,
            meta: {
               'X-Cache': cacheStatus
            },
            data: {
               scope: 'group',
               group: {
                  id: group.id,
                  name: group.name
               },
               ...buildLeaderboardResponse(
                  snapshot,
                  userId,
                  limit
               )
            }
         })
      } catch (err) {
         console.error(
            'Get group leaderboard error:',
            err
         )

         return res
            .status(HttpStatusCode.InternalServerError)
            .json({
               success: false,
               message: 'Failed to fetch leaderboard'
            })
      }
   }
}

module.exports = Controller
