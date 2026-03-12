/** @type {import('jest').Config} **/
module.exports = {
    testEnvironment: 'jsdom',
    setupFiles: [
        'raf/polyfill',
        '<rootDir>/test/helpers/enzyme-setup.js'
    ],
    testPathIgnorePatterns: [
        'src/test.js'
    ],
    moduleNameMapper: {
      '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/test/__mocks__/fileMock.js',
      '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)?\\?raw$': '<rootDir>/test/__mocks__/fileMock.js',
      '\\.(css|less)$': '<rootDir>/test/__mocks__/styleMock.js',
      '(blocks|editor)-msgs(\\.js)?$': '<rootDir>/test/__mocks__/editor-msgs-mock.js'
    }
};
