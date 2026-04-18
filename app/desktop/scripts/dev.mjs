import {spawn} from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import electronPath from 'electron';
import webpack from 'webpack';
import WebpackDevServer from 'webpack-dev-server';
import configFactory from '../webpack.config.mjs';

/** @typedef {'main' | 'preload' | 'renderer'} Target */
/** @typedef {'main' | 'preload'} NodeTarget */
/** @typedef {import('node:child_process').ChildProcess} ChildProcess */
/** @typedef {import('webpack').Compiler} Compiler */
/** @typedef {import('webpack').Configuration} WebpackConfiguration */
/** @typedef {import('webpack').Stats} Stats */
/** @typedef {import('webpack').Watching} Watching */
/** @typedef {import('webpack-dev-server').Configuration} DevServerConfiguration */

const scriptsDir = path.dirname(import.meta.filename);
const desktopDir = path.resolve(scriptsDir, '..');
const nodeTargets = /** @type {const} */ (['main', 'preload']);

/** @type {ChildProcess | null} */
let electronProcess = null;
/** @type {WebpackDevServer | null} */
let rendererServer = null;
/** @type {Compiler | null} */
let rendererCompiler = null;
/** @type {Watching[]} */
const nodeWatchers = [];
/** @type {Compiler[]} */
const nodeCompilers = [];
/** @type {Set<NodeTarget>} */
const readyNodeTargets = new Set();
/** @type {ReturnType<typeof setTimeout> | null} */
let restartTimer = null;
let rendererReady = false;
let isRestartingElectron = false;
let isShuttingDown = false;

if (process.cwd() !== desktopDir) {
    process.chdir(desktopDir);
}

/**
 * Print a simple scoped log message.
 * @param {string} scope - Short log prefix.
 * @param {string} message - Message to print.
 */
const log = (scope, message) => {
    console.log(`[${scope}] ${message}`);
};

/**
 * Normalize a config from the shared webpack factory.
 * @param {Target} target - Requested webpack target.
 * @returns {WebpackConfiguration} Normalized single-target config.
 */
const getConfig = target => {
    const config = configFactory({target});
    if (!config || Array.isArray(config)) {
        throw new Error(`Expected a single webpack config for ${target}`);
    }

    return {
        ...config,
        context: config.context ?? desktopDir
    };
};

/**
 * Print warnings and errors from a webpack build.
 * @param {NodeTarget} target - Node-side target that finished building.
 * @param {Stats} stats - Webpack stats for that build.
 * @returns {boolean} True when the build succeeded.
 */
const handleNodeBuildResult = (target, stats) => {
    const output = stats.toString({
        colors: true,
        preset: 'errors-warnings',
        timings: true
    });

    if (output) {
        console.log(output);
    }

    if (stats.hasErrors()) {
        log(target, 'build failed; keeping the current Electron process running');
        return false;
    }

    const buildTime = typeof stats.endTime === 'number' && typeof stats.startTime === 'number' ?
        ` in ${stats.endTime - stats.startTime} ms` :
        '';

    log(target, `built successfully${buildTime}`);
    return true;
};

/**
 * Print warnings and errors from renderer builds.
 * @param {Stats} stats - Webpack stats for the renderer build.
 * @returns {boolean} True when the build succeeded.
 */
const handleRendererBuildResult = stats => {
    const output = stats.toString({
        colors: true,
        preset: 'errors-warnings',
        timings: true
    });

    if (output) {
        console.log(output);
    }

    if (stats.hasErrors()) {
        log('renderer', 'build failed; waiting for a successful rebuild before launching Electron');
        return false;
    }

    const buildTime = typeof stats.endTime === 'number' && typeof stats.startTime === 'number' ?
        ` in ${stats.endTime - stats.startTime} ms` :
        '';

    log('renderer', `built successfully${buildTime}`);
    return true;
};

/**
 * Launch the Electron app against the renderer dev server.
 * @param {string} reason - Why Electron is being launched.
 */
const startElectron = reason => {
    if (electronProcess || isShuttingDown) {
        return;
    }

    const port = getConfig('renderer').devServer?.port;
    if (!port) {
        throw new Error('Renderer webpack config is missing devServer.port setting');
    }

    log('electron', reason);
    electronProcess = spawn(electronPath, [desktopDir], {
        cwd: desktopDir,
        env: {
            ...process.env,
            ELECTRON_WEBPACK_WDS_PORT: port
        },
        stdio: 'inherit'
    });

    electronProcess.once('error', error => {
        console.error(error);
        electronProcess = null;
        shutdown(1);
    });

    electronProcess.once('exit', (code, signal) => {
        const wasRestarting = isRestartingElectron;
        electronProcess = null;

        if (isShuttingDown || wasRestarting) {
            return;
        }

        const detail = signal ? `signal ${signal}` : `code ${code ?? 0}`;
        log('electron', `exited with ${detail}`);
        shutdown(code ?? 0);
    });
};

/**
 * Stop the running Electron process, if any.
 * @returns {Promise<void>}
 */
const stopElectron = async () => {
    if (!electronProcess) {
        return;
    }

    const processToStop = electronProcess;
    electronProcess = null;

    await new Promise(resolve => {
        const killTimer = setTimeout(() => {
            if (processToStop.exitCode === null && processToStop.signalCode === null) {
                processToStop.kill('SIGKILL');
            }
        }, 5000);

        killTimer.unref();

        processToStop.once('exit', () => {
            clearTimeout(killTimer);
            resolve();
        });

        processToStop.kill();
    });
};

/**
 * Start Electron after the first successful main + preload builds.
 */
const maybeStartElectron = () => {
    if (!rendererReady || electronProcess || isShuttingDown) {
        return;
    }

    if (readyNodeTargets.size !== nodeTargets.length) {
        return;
    }

    startElectron('launching Electron');
};

/**
 * Debounce restarts so a main+preload change only restarts Electron once.
 * @param {NodeTarget} target - Target that triggered the restart.
 */
const scheduleElectronRestart = target => {
    if (!rendererReady || isShuttingDown) {
        return;
    }

    if (restartTimer) {
        clearTimeout(restartTimer);
    }

    restartTimer = setTimeout(() => {
        restartTimer = null;
        restartElectron(`${target} changed; restarting Electron`);
    }, 150);
};

/**
 * Restart Electron after a successful node-side rebuild.
 * @param {string} reason - Why Electron is being restarted.
 * @returns {Promise<void>} Resolves after the restart completes.
 */
const restartElectron = async reason => {
    if (isShuttingDown) {
        return;
    }

    isRestartingElectron = true;
    try {
        await stopElectron();
        startElectron(reason);
    } finally {
        isRestartingElectron = false;
    }
};

/**
 * Watch one node-side webpack target and restart Electron after successful rebuilds.
 * @param {NodeTarget} target - Node-side webpack target to watch.
 */
const watchNodeTarget = target => {
    const compiler = webpack(getConfig(target));
    nodeCompilers.push(compiler);

    const watching = compiler.watch({}, (error, stats) => {
        if (error) {
            console.error(error);
            log(target, 'build failed before stats were available');
            return;
        }

        if (!stats) {
            log(target, 'build finished without stats output');
            return;
        }

        const succeeded = handleNodeBuildResult(target, stats);
        if (!succeeded) {
            return;
        }

        const isFirstSuccessfulBuild = !readyNodeTargets.has(target);
        readyNodeTargets.add(target);

        if (isFirstSuccessfulBuild) {
            maybeStartElectron();
            return;
        }

        scheduleElectronRestart(target);
    });

    nodeWatchers.push(watching);
    log(target, 'watching for changes');
};

/**
 * Start the renderer dev server so BrowserWindow can use live reload.
 * @returns {Promise<void>}
 */
const startRendererServer = async () => {
    const rendererConfig = getConfig('renderer');
    if (!rendererConfig.devServer) {
        throw new Error('Renderer webpack config is missing devServer settings');
    }

    rendererCompiler = webpack(rendererConfig);
    rendererCompiler.hooks.done.tap('clipcc-desktop-dev-runner-renderer', stats => {
        const succeeded = handleRendererBuildResult(stats);
        if (!succeeded) {
            return;
        }

        const isFirstSuccessfulBuild = !rendererReady;
        rendererReady = true;

        if (isFirstSuccessfulBuild) {
            maybeStartElectron();
        }
    });

    rendererServer = new WebpackDevServer(
        /** @type {DevServerConfiguration} */ (rendererConfig.devServer),
        rendererCompiler
    );

    await rendererServer.start();
};

/**
 * Close webpack's watch handle.
 * @param {Watching} watching - Active webpack watch handle.
 * @returns {Promise<void>} Resolves once the watcher closes.
 */
const closeWatching = watching => new Promise((resolve, reject) => {
    watching.close(error => {
        if (error) {
            reject(error);
            return;
        }
        resolve();
    });
});

/**
 * Close a webpack compiler after its watcher is stopped.
 * @param {Compiler} compiler - Compiler to dispose.
 * @returns {Promise<void>} Resolves once the compiler closes.
 */
const closeCompiler = compiler => new Promise((resolve, reject) => {
    compiler.close(error => {
        if (error) {
            reject(error);
            return;
        }
        resolve();
    });
});

/**
 * Shut the dev runner down in a controlled order.
 * @param {number} exitCode - Process exit code to keep.
 * @returns {Promise<void>} Resolves after shutdown work finishes.
 */
const shutdown = async exitCode => {
    if (isShuttingDown) {
        process.exitCode = exitCode;
        return;
    }

    isShuttingDown = true;
    process.exitCode = exitCode;

    if (restartTimer) {
        clearTimeout(restartTimer);
        restartTimer = null;
    }

    await stopElectron();

    const watcherResults = await Promise.allSettled(nodeWatchers.map(closeWatching));
    watcherResults.forEach(result => {
        if (result.status === 'rejected') {
            console.error(result.reason);
        }
    });

    const compilerResults = await Promise.allSettled(nodeCompilers.map(closeCompiler));
    compilerResults.forEach(result => {
        if (result.status === 'rejected') {
            console.error(result.reason);
        }
    });

    if (rendererServer) {
        await rendererServer.stop();
    }

    if (rendererCompiler) {
        await closeCompiler(rendererCompiler);
    }
};

/**
 * Surface fatal runner errors and stop everything.
 * @param {unknown} error - Fatal error thrown by the dev runner.
 */
const handleFatalError = error => {
    console.error(error);
    shutdown(1);
};

process.once('SIGINT', () => {
    shutdown(0);
});

process.once('SIGTERM', () => {
    shutdown(0);
});

process.once('uncaughtException', handleFatalError);
process.once('unhandledRejection', handleFatalError);

await startRendererServer();
watchNodeTarget('main');
watchNodeTarget('preload');
