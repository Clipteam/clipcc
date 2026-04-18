import clipccConfig from 'eslint-config-clipcc';
import clipccNode from 'eslint-config-clipcc/node.js';
import clipccES6 from 'eslint-config-clipcc/es6.js';
import clipccTS from 'eslint-config-clipcc/ts.js';
import clipccSolid from 'eslint-config-clipcc/solid.js';

export default [
    ...clipccConfig,
    ...clipccNode,
    ...clipccES6,
    ...clipccTS.map(config => ({
        ...config,
        files: ['src/**/*.{ts,tsx}']
    })),
    ...clipccSolid.map(config => ({
        ...config,
        files: ['src/**/*.{js,jsx,ts,tsx}']
    }))
];
