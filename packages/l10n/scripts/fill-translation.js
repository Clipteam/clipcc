#!/usr/bin/env node

/**
 * Script to fill translation source file with given translated strings.
 */

import fs from 'node:fs';

const HELP_MESSAGE = `
Fill translation source file with given translated strings. Only translated
strings that exist in source file are written to the output file.

Usage: node fill-translation.js <source> <data> <output>
    source      File path to translation source.
    data        File path to translated key-value json.
    output      Output path.

Example:
    node fill-translation.js \\
        ./packages/gui/translations/en.json \\
        ./packages/l10n/editor/interface/zh-cn.json \\
        ./packages/gui/translations/zh-cn.json
`;

const args = process.argv.slice(2);

if (args.length < 3) {
    process.stdout.write(HELP_MESSAGE);
    process.exit(1);
}

const sourcePath = args[0];
const dataPath = args[1];
const outputPath = args[2];

const template = JSON.parse(fs.readFileSync(sourcePath, {encoding: 'utf-8'}));
const data = JSON.parse(fs.readFileSync(dataPath, {encoding: 'utf-8'}));

const result = Object.create(null);

for (const key in template) {
    if (key in data) {
        result[key] = {
            message: data[key],
            description: template[key].description
        };
    }
}

fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), {encoding: 'utf-8'});
