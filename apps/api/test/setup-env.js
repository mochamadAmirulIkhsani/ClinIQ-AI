const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')

const apiEnvPath = path.resolve(__dirname, '../.env')
const rootEnvPath = path.resolve(__dirname, '../../../.env')

dotenv.config({ path: apiEnvPath })

if (fs.existsSync(rootEnvPath)) {
   const rootEnv = dotenv.parse(fs.readFileSync(rootEnvPath))

   if (!process.env.REDIS_PASSWORD && rootEnv.REDIS_PASSWORD) {
      process.env.REDIS_PASSWORD = rootEnv.REDIS_PASSWORD
   }
}

process.env.NODE_ENV = process.env.NODE_ENV || 'local'
process.env.JWT_KEY = process.env.JWT_KEY || 'test-secret'
process.env.ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS || '*'
process.env.SKIP_AI_EXPLANATIONS = 'true'
