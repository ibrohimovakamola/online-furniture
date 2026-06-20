/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  transform: {},
  testMatch: ['**/tests/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testTimeout: 30_000,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/docs/**',
    '!src/utils/loadEnvBootstrap.js',
  ],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: {
      lines: 30,
      statements: 30,
    },
  },
}
