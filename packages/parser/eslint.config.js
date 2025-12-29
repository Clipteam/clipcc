const clipccConfig = require('eslint-config-clipcc');
const clipccNode = require('eslint-config-clipcc/node');

module.exports = [
    ...clipccConfig,
    clipccNode,
    {
        ignores: [
            'node_modules/**',
            'dist/**',
            '.tap/**',
            '**/*.min.js'
        ]
    }
];
