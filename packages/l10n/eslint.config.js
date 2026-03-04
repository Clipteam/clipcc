const clipccConfig = require('eslint-config-clipcc');
const clipccNode = require('eslint-config-clipcc/node');

module.exports = [
    ...clipccConfig,
    ...clipccNode,
    {
        languageOptions: {
            ecmaVersion: 2015
        }
    },
    {
        ignores: [
            'node_modules/**',
            'dist/**',
            'locales/**',
            'src/locale-data/**'
        ]
    }
];
