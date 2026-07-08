import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

export default async function globalSetup() {
    return async function teardown() {
        const db = require('../db/models')
        const redis = require('../config/redis')

        await db.sequelize.close()
        redis.disconnect()
    }
}