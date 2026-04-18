// @ts-check

import {spawnSync} from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
const projectDir = path.resolve(import.meta.filename, '..');
const configPath = path.resolve(projectDir, 'electron-builder.yaml');

/**
 * @typedef {'dir' | 'dev' | 'dist'} BuildMode
 */

/**
 * @typedef ParsedArgs
 * @property {BuildMode} mode Selected build mode for packaging.
 * @property {string[]} passthroughArgs Forwarded electron-builder CLI arguments.
 */

/**
 * Parse wrapper arguments and extract mode.
 *
 * Supported forms:
 *   --mode=dir
 *   --mode dir
 *
 * Unknown args are forwarded to electron-builder.
 * @param {string[]} argv Wrapper script command-line arguments.
 * @returns {ParsedArgs} Parsed mode and forwarded argument list.
 */
const parseArgs = argv => {
    /** @type {BuildMode} */
    let mode = 'dev';
    /** @type {string[]} */
    const passthroughArgs = [];

    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (arg.startsWith('--mode=')) {
            const value = arg.slice('--mode='.length);
            if (value === 'dir' || value === 'dev' || value === 'dist') {
                mode = value;
                continue;
            }
            throw new Error(`Invalid --mode value: ${value}`);
        }

        if (arg === '--mode') {
            const value = argv[i + 1];
            if (value === 'dir' || value === 'dev' || value === 'dist') {
                mode = value;
                i++;
                continue;
            }
            throw new Error(`Invalid --mode value: ${String(value)}`);
        }

        passthroughArgs.push(arg);
    }

    return {mode, passthroughArgs};
};

/**
 * Resolve platform selector for electron-builder CLI.
 * @returns {'--win' | '--mac' | '--linux'} Platform flag matching current OS.
 */
const getCurrentPlatformFlag = () => {
    switch (process.platform) {
    case 'win32':
        return '--win';
    case 'darwin':
        return '--mac';
    case 'linux':
        return '--linux';
    default:
        throw new Error(`Unsupported platform: ${process.platform}`);
    }
};

/**
 * Check if rpmbuild is available in PATH.
 * @returns {boolean} True when rpm toolchain is available or platform is non-Linux.
 */
const hasRpmBuild = () => {
    if (process.platform !== 'linux') return true;
    const check = spawnSync('rpmbuild', ['--version'], {
        stdio: 'ignore'
    });
    return check.status === 0;
};

/**
 * Build argument list for electron-builder.
 * @param {BuildMode} mode Requested build mode.
 * @param {string[]} passthroughArgs Additional CLI arguments to pass through.
 * @returns {string[]} Fully expanded electron-builder arguments.
 */
const createBuilderArgs = (mode, passthroughArgs) => {
    /** @type {string[]} */
    const args = [
        'build',
        '--config',
        configPath,
        '--projectDir',
        projectDir,
        getCurrentPlatformFlag()
    ];

    if (mode === 'dir') {
        args.push('--dir', '--config.compression=store');
    }

    if (mode === 'dist') {
        // Distribution artifacts should fail if signing is expected but missing.
        args.push('--config.forceCodeSigning=true');
    } else {
        // Keep local and CI dev/dir builds unsigned by default.
        args.push('--config.forceCodeSigning=false');

        if (process.platform === 'darwin') {
            // Explicitly disable mac signing when producing unsigned artifacts.
            args.push('--config.mac.identity=null');
        }
    }

    if (process.platform === 'linux' && !hasRpmBuild()) {
        // rpm target requires rpmbuild/fpm toolchain.
        args.push('--linux', 'AppImage', 'deb');
        console.warn('[electron-builder-wrapper] rpmbuild not found; skipping rpm target.');
    }

    return args.concat(passthroughArgs);
};

/**
 * Run electron-builder CLI with the given arguments.
 * @param {string[]} args Final argument list for electron-builder.
 */
const runElectronBuilder = args => {
    const cliPath = require.resolve('electron-builder/out/cli/cli.js');
    console.log(`[electron-builder-wrapper] mode args: ${args.join(' ')}`);

    const result = spawnSync(process.execPath, [cliPath, ...args], {
        cwd: projectDir,
        stdio: 'inherit',
        env: process.env
    });

    if (result.error) {
        throw result.error;
    }
    if (result.signal) {
        throw new Error(`electron-builder terminated by signal: ${result.signal}`);
    }
    if (typeof result.status === 'number' && result.status !== 0) {
        throw new Error(`electron-builder exited with code ${result.status}`);
    }
};

const main = () => {
    if (!fs.existsSync(configPath)) {
        throw new Error(`Missing config: ${configPath}`);
    }

    const {mode, passthroughArgs} = parseArgs(process.argv.slice(2));
    const args = createBuilderArgs(mode, passthroughArgs);
    runElectronBuilder(args);
};

main();
