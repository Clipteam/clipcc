const path = require('path');

// A fake worker that runs in the same process, to avoid complex ts harness setup.
class FakeWorker {
    constructor (scriptPath, _, options) {
        const cwd = options && options.cwd ? options.cwd : process.cwd();
        const resolvedPath = path.resolve(cwd, scriptPath);

        this._onmessage = null;
        this._onerror = null;
        this._terminated = false;

        const workerSelf = {
            postMessage: msg => {
                if (this._terminated) return;
                process.nextTick(() => {
                    if (this._onmessage) {
                        this._onmessage({data: msg});
                    }
                });
            },
            close: () => {
                this._terminated = true;
            },
            addEventListener: (event, fn) => {
                workerSelf[`on${event}`] = fn;
            },
            onmessage: null,
            onerror: null
        };

        // Share the self reference so postMessage can find onmessage later
        this._self = workerSelf;

        global.self = workerSelf;
        global.postMessage = workerSelf.postMessage;
        global.close = workerSelf.close;
        global.addEventListener = workerSelf.addEventListener;

        try {
            // eslint-disable-next-line global-require
            require(resolvedPath);
        } catch (err) {
            process.nextTick(() => {
                if (this._onerror) {
                    this._onerror(err);
                }
            });
        }
    }

    postMessage (msg) {
        if (this._terminated) return;
        process.nextTick(() => {
            if (this._self && this._self.onmessage) {
                this._self.onmessage({data: msg});
            }
        });
    }

    terminate () {
        // no-op: the worker context self.close() handles teardown
    }

    addEventListener (event, fn) {
        this[`_on${event}`] = fn;
    }

    get onmessage () {
        return this._onmessage;
    }

    set onmessage (fn) {
        this._onmessage = fn;
    }

    get onerror () {
        return this._onerror;
    }

    set onerror (fn) {
        this._onerror = fn;
    }
}

module.exports = FakeWorker;
