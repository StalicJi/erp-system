import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  dir: './',
})

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  reporters: [
    'default',
    ['jest-junit', { outputDirectory: 'reports', outputName: 'test-results.xml' }],
  ],
  coverageReporters: ['text', 'lcov'],
  coverageDirectory: 'reports/coverage',
  collectCoverageFrom: [
    'lib/**/*.{ts,tsx}',
    'types/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
}

export default createJestConfig(config)
