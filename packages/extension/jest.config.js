const {createDefaultPreset} = require('ts-jest');

const tsJestTransformCfg = createDefaultPreset({
    tsconfig: {
        types: ['./test/tiny-worker.d.ts']
    }
}).transform;

/** @type {import('jest').Config} */
module.exports = {
    collectCoverageFrom: [
        '<rootDir>/src/**/*.ts'
    ],
    transform: {
        ...tsJestTransformCfg
    },
    testMatch: [
        '<rootDir>/test/unit/**/*.test.[tj]s'
    ],
    testEnvironment: 'node'
};
