/** @type {import('jest').Config} */
module.exports = {
    testEnvironment: 'node',
    testMatch: [
        '<rootDir>/test/unit/*.js',
        '<rootDir>/test/integration/*.js'
    ],
    testPathIgnorePatterns: [
        '/test/fixtures/',
        '/test/extra/'
    ],
    moduleFileExtensions: ['js', 'ts', 'json']
};
