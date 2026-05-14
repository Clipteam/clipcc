/** @satisfies {import('jest').Config} */
module.exports = {
    testEnvironment: 'node',
    testMatch: [
        '<rootDir>/test/unit/*.js',
        '<rootDir>/test/integration/*.js'
    ],
    moduleNameMapper: {
        '^isomorphic-dompurify$': '<rootDir>/test/fixtures/isomorphic-dompurify-mock.js'
    },
    moduleFileExtensions: ['js', 'ts', 'json'],
    testTimeout: 30000
};
