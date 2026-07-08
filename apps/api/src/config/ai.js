const OpenAI = require('openai')

let client = null

function setAIClient(mockClient) {
   client = mockClient
}

function resetAIClient() {
   client = null
}

function getAIClient() {
   if (client) return client

   const AI_BASE_URL = process.env.AI_BASE_URL
   const AI_API_KEY = process.env.AI_API_KEY

   if (!AI_BASE_URL || !AI_API_KEY) {
      return null
   }

   client = new OpenAI({
      apiKey: AI_API_KEY,
      baseURL: AI_BASE_URL,
      defaultHeaders: {
         'HTTP-Referer': process.env.AI_SITE_URL || 'https://clinIQ-AI.app',
         'X-Title': process.env.AI_SITE_NAME || 'ClinIQ-AI'
      },
      timeout: Number(process.env.AI_REQUEST_TIMEOUT_MS ?? 60_000),
      maxRetries: 1
   })

   return client
}

module.exports = { getAIClient, setAIClient, resetAIClient }
