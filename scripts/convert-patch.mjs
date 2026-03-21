/**
 * @fileoverview
 * Convert patches generated from scratch's repo to
 * monorepo-acceptable format.
 */

import fs from 'fs';
import path from 'path';
import {globSync} from 'glob';

const args = process.argv.slice(2);
if (args.length < 2) {
    console.log(`Usage: pnpm patch:convert [GLOB_PATTERN] [PACKAGE_NAME]`);
    process.exit(1);
}
const globPattern = args[0];
const packageName = args[1];
const dry = args[2] === 'dry';
let currentFileCtx = null;

const files = globSync(globPattern);
for (const filePath of files) {
    console.log(`processing ${path.basename(filePath)}...`);
    currentFileCtx = fs.readFileSync(filePath).toString();
    processPatch();
    if (dry) {
        console.log(`result:\n${currentFileCtx}`);
    } else {
        fs.writeFileSync(filePath, currentFileCtx);
    }
}

function processPatch () {
    const diffs = currentFileCtx.split('diff --git ');
    const header = diffs[0];
    diffs.shift();
    for (let i = 0; i < diffs.length; i++) {
        // each unit ends with this
        const endIndex = diffs[i].indexOf('@@');
        let diffMeta;
        if (endIndex !== -1) {
            diffMeta = diffs[i].substring(0, endIndex - 1).split('\n');
        } else {
            diffMeta = diffs[i].split('\n');
        }
        for (let j = 0; j < diffMeta.length; j++) {
            // process file path
            if (j === 0) {
                let [from, to] = diffMeta[0].split(' ');
                from = `a/packages/${packageName}/${from.substring(2)}`;
                to = `b/packages/${packageName}/${to.substring(2)}`
                diffMeta[0] = `${from} ${to}`;
                continue;
            }
            if (diffMeta[j].startsWith('+++') || diffMeta[j].startsWith('---')) {
                const prefix = diffMeta[j].slice(0, 5);
                // it'a new file
                if (diffMeta[j].substring(4) === '/dev/null') continue;
                diffMeta[j] = `${prefix}/packages/${packageName}/${diffMeta[j].substring(6)}`;
            }
        }
        diffMeta = diffMeta.join('\n');
        diffs[i] = `diff --git ${diffMeta}\n@@${diffs[i].substring(endIndex + 2)}`;
    }
    currentFileCtx = `${header}${diffs.join('')}`;
}
