import {spawn} from 'child_process';
import path from 'path';
import {fileURLToPath} from 'url';
import webpack from 'webpack';
import createWebpackConfig from '../webpack.config.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const desktopRoot = path.resolve(__dirname, '..');

const rendererUrl = `http://127.0.0.1:8386/`;

const managedProcesses = new Set();
const compilerWatchers = new Map();

/** @type {import('child_process').ChildProcessWithoutNullStreams | null} */
let electronProcess = null;
let shutdownRequested = false;
let restartTimeout = null;
let restartPromise = null;

const buildState = {
    main: 0,
    preload: 0,
    rendererReady: false
};

const COMPILER_SUCCESS_PATTERN = /compiled successfully|compiled with (?:\d+ )?warnings?/i;

const prefixLog = (prefix, message) => {
    if (!message.length) return;
    console.log(`[${prefix}] ${message}`);
};

const attachProcessOutput = (processLabel, child, onLine) => {
    const bindStream = streamName => {
        const stream = child[streamName];
        let buffer = '';
        stream.setEncoding('utf8');
        stream.on('data', chunk => {
            buffer += chunk;
            const lines = buffer.split(/\r?\n/u);
            buffer = lines.pop() ?? '';
            for (const line of lines) {
                prefixLog(processLabel, line);
                onLine?.(line);
            }
        });
        stream.on('end', () => {
            if (!buffer) return;
            prefixLog(processLabel, buffer);
            onLine?.(buffer);
        });
    };

    bindStream('stdout');
    bindStream('stderr');
};

const spawnManagedPnpmProcess = (processLabel, args, {
    onLine,
    failOnExit = true,
    env = process.env
} = {}) => {
    const child = spawn('pnpm', args, {
        cwd: desktopRoot,
        env,
        stdio: ['ignore', 'pipe', 'pipe']
    });

    managedProcesses.add(child);
    attachProcessOutput(processLabel, child, onLine);

    child.on('exit', (code, signal) => {
        managedProcesses.delete(child);
        if (shutdownRequested || !failOnExit) return;
        const exitMessage =
            `[dev] ${processLabel} exited unexpectedly ` +
            `(code: ${code ?? 'null'}, signal: ${signal ?? 'null'}).`;
        console.error(exitMessage);
        shutdown(1);
    });

    return child;
};

const terminateChild = child => new Promise(resolve => {
    if (child.exitCode !== null || child.killed) {
        resolve();
        return;
    }

    const timeout = setTimeout(() => {
        if (child.exitCode === null) {
            child.kill('SIGKILL');
        }
    }, 5000);

    child.once('exit', () => {
        clearTimeout(timeout);
        resolve();
    });

    child.kill('SIGTERM');
});

const closeCompilerWatcher = watcher => new Promise(resolve => {
    watcher.close(() => {
        resolve();
    });
});

const isReadyToLaunchElectron = () => (
    buildState.rendererReady &&
    buildState.main > 0 &&
    buildState.preload > 0
);

const stopElectron = async () => {
    if (!electronProcess) return;

    const child = electronProcess;
    electronProcess = null;
    await terminateChild(child);
};

const startElectron = () => {
    if (shutdownRequested || electronProcess || !isReadyToLaunchElectron()) return;

    console.log(`[dev] launching electron with renderer URL ${rendererUrl}`);
    electronProcess = spawnManagedPnpmProcess('electron', ['exec', 'electron', '.'], {
        failOnExit: false,
        env: {
            ...process.env,
            CLIPCC_DESKTOP_RENDERER_URL: rendererUrl
        }
    });

    electronProcess.on('exit', (code, signal) => {
        electronProcess = null;
        if (shutdownRequested) return;
        console.log(`[dev] electron exited (code: ${code ?? 'null'}, signal: ${signal ?? 'null'}).`);
    });
};

const restartElectron = reason => {
    if (shutdownRequested || !isReadyToLaunchElectron()) return;
    if (restartPromise) return;

    console.log(`[dev] restarting electron after ${reason} rebuild.`);
    restartPromise = stopElectron()
        .then(() => {
            startElectron();
        })
        .finally(() => {
            restartPromise = null;
        });
};

const scheduleElectronRestart = reason => {
    if (!isReadyToLaunchElectron()) return;

    if (!electronProcess) {
        startElectron();
        return;
    }

    if (restartTimeout) {
        clearTimeout(restartTimeout);
    }

    restartTimeout = setTimeout(() => {
        restartElectron(reason);
    }, 150);
};

const onCompilerBuilt = target => {
    buildState[target] += 1;

    if (buildState[target] === 1) {
        console.log(`[dev] ${target} first build finished.`);
        startElectron();
        return;
    }

    scheduleElectronRestart(target);
};

const startCompilerWatch = target => {
    const compiler = webpack(createWebpackConfig({target}));
    const watcher = compiler.watch({}, (error, stats) => {
        if (shutdownRequested) return;

        if (error) {
            console.error(`[${target}] webpack watcher failed:`, error);
            shutdown(1);
            return;
        }

        if (!stats) return;

        const statsText = stats.toString({
            all: false,
            errors: true,
            warnings: true,
            timings: true,
            colors: true
        });

        if (statsText) {
            for (const line of statsText.split(/\r?\n/u)) {
                prefixLog(target, line);
            }
        }

        if (stats.hasErrors()) return;
        onCompilerBuilt(target);
    });

    compilerWatchers.set(target, watcher);
};

const shutdown = async code => {
    if (shutdownRequested) return;
    shutdownRequested = true;
    process.exitCode = code;

    if (restartTimeout) {
        clearTimeout(restartTimeout);
        restartTimeout = null;
    }

    await stopElectron();
    await Promise.all(Array.from(compilerWatchers.values(), watcher => closeCompilerWatcher(watcher)));
    compilerWatchers.clear();
    await Promise.all(Array.from(managedProcesses, child => terminateChild(child)));
};

process.on('SIGINT', () => {
    shutdown(0);
});

process.on('SIGTERM', () => {
    shutdown(0);
});

process.on('uncaughtException', error => {
    console.error('[dev] uncaught exception', error);
    shutdown(1);
});

process.on('unhandledRejection', reason => {
    console.error('[dev] unhandled rejection', reason);
    shutdown(1);
});

console.log('[dev] starting desktop development services...');

spawnManagedPnpmProcess('renderer', ['run', 'start:renderer'], {
    onLine: line => {
        if (!COMPILER_SUCCESS_PATTERN.test(line)) return;
        if (buildState.rendererReady) return;
        buildState.rendererReady = true;
        console.log(`[dev] renderer compilation reported ready at ${rendererUrl}`);
        startElectron();
    }
});
startCompilerWatch('main');
startCompilerWatch('preload');
