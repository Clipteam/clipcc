import clipccConfig from 'eslint-config-clipcc';
import clipccNode from 'eslint-config-clipcc/node.js';
import clipccES6 from 'eslint-config-clipcc/es6.js';
import clipccReact from 'eslint-config-clipcc/react.js';
import clipccTS from 'eslint-config-clipcc/ts.js';
import globals from 'globals';

export default [
    ...clipccConfig,
    ...clipccNode,
    ...clipccES6,
    ...clipccReact.map(config => ({
        ...config,
        files: ['src/**/*.{js,jsx}']
    })),
    ...clipccTS.map(config => ({
        ...config,
        files: ['src/**/*.{ts,tsx}']
    })),
    {
        files: ['scripts/**/*.{js,ts,mjs}'],
        rules: {
            'no-console': 'off'
        }
    },
    {
        files: ['src/renderer/**/*.{js,jsx,ts,tsx}'],
        languageOptions: {
            globals: {
                ...globals.browser
            }
        }
    },
    {
        ignores: [
            'node_modules/**',
            'dist/**',
            'static/**'
        ]
    }
];
