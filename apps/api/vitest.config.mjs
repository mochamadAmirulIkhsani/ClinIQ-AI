import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    fileParallelism: false,
    testTimeout: 30000,
    reporters: ["agent"],
    include: ['test/**/*.test.js'],
    globalSetup: './test/global-test.mjs'
  }
})