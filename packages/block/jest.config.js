const {createDefaultPreset} = require('ts-jest');

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import('jest').Config} **/
const sharedConfig = {
  transform: {
    ...tsJestTransformCfg
  },
  moduleNameMapper: {
    '\\.(jpg|png|gif|svg|mp3|wav|ogg)$': '<rootDir>/tests/__mocks__/file_mock.js',
    '\\.(css|less)$': '<rootDir>/tests/__mocks__/style_mock.js'
  }
};

/** @type {import('jest').Config} **/
module.exports = {
  collectCoverageFrom: [
    '<rootDir>/src/**/*.ts'
  ],
  projects: [{
    displayName: 'Unit Tests',
    testMatch: ['<rootDir>/tests/unit/**/*.test.[jt]s'],
    testEnvironment: 'node',
    ...sharedConfig
  }, {
    displayName: 'Unit Tests on Browser',
    testMatch: ['<rootDir>/tests/browser/**/*.test.[jt]s'],
    testEnvironment: '<rootDir>/tests/environment/jsdom.ts',
    setupFiles: ['jest-canvas-mock'],
    ...sharedConfig
  }, {
    displayName: 'DOM Tests',
    testMatch: ['<rootDir>/tests/blocks/**/*.test.[jt]s'],
    testEnvironment: '<rootDir>/tests/environment/jsdom.ts',
    setupFiles: ['jest-canvas-mock'],
    ...sharedConfig
  }]
};
