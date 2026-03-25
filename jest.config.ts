import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      jsx: 'react-jsx',
    }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFiles: ['jest-canvas-mock'],
  collectCoverageFrom: [
    'src/lib/**/*.ts',
    'src/store/**/*.ts',
    '!src/lib/**/__tests__/**',
    '!src/store/**/__tests__/**',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
};

export default config;
