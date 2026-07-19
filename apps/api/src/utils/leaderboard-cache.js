const {
   getCache,
   setCacheWithTTL,
   delCache
} = require('./redis')

const LEADERBOARD_CACHE_TTL_SECONDS = 60
const LEADERBOARD_CACHE_PREFIX = 'leaderboard:v1'

function globalLeaderboardCacheKey() {
   return `${LEADERBOARD_CACHE_PREFIX}:global`
}

function groupLeaderboardCacheKey(groupId) {
   return `${LEADERBOARD_CACHE_PREFIX}:group:${groupId}`
}

function isValidSnapshot(value) {
   return Boolean(
      value &&
        Array.isArray(value.entries) &&
        Number.isInteger(value.total_participants)
   )
}

async function getLeaderboardSnapshot(key) {
   const cached = await getCache(key)

   return isValidSnapshot(cached) ? cached : null
}

async function setLeaderboardSnapshot(key, snapshot) {
   await setCacheWithTTL(
      key,
      snapshot,
      LEADERBOARD_CACHE_TTL_SECONDS
   )
}

async function invalidateLeaderboardCaches(keys) {
   const uniqueKeys = [...new Set(keys.filter(Boolean))]

   await Promise.all(
      uniqueKeys.map((key) => delCache(key))
   )
}

module.exports = {
   globalLeaderboardCacheKey,
   groupLeaderboardCacheKey,
   getLeaderboardSnapshot,
   setLeaderboardSnapshot,
   invalidateLeaderboardCaches
}
