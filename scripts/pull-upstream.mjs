#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const REPO_URL = 'git@github.com:scratchfoundation/scratch-editor.git';
const ROOT_DIR = join(__dirname, '..');
const UPSTREAM_DIR = join(ROOT_DIR, 'upstream-llk');

function run(command, options = {}) {
    console.log(`> ${command}`);
    try {
        execSync(command, { stdio: 'inherit', ...options });
    } catch (error) {
        console.error(`Failed to execute: ${command}\n${error}`);
        process.exit(1);
    }
}

function main() {
    if (existsSync(UPSTREAM_DIR)) {
        console.log('Upstream folder exists, pulling latest changes...');
        run('git pull', { cwd: UPSTREAM_DIR });
    } else {
        console.log('Upstream folder does not exist, cloning repository...');
        run(`git clone ${REPO_URL} "${UPSTREAM_DIR}"`);
    }
    console.log('Done!');
}

main();
