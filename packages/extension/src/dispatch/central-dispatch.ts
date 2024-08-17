import { SharedDispatch, DispatchCallMessage } from './shared-dispatch';

/**
 * This class serves as the central broker for message dispatch. It expects to operate on the main thread / Window and
 * it must be informed of any Worker threads which will participate in the messaging system. From any context in the
 * messaging system, the dispatcher's "call" method can call any method on any "service" provided in any participating
 * context. The dispatch system will forward function arguments and return values across worker boundaries as needed.
 * @see {WorkerDispatch}
 */
class _CentralDispatch extends SharedDispatch {
    services: Record<string, unknown>;
    /**
     * The constructor we will use to recognize workers.
     */
    workerClass: typeof Worker | null = (typeof Worker === 'undefined' ? null : Worker);
    /**
     * List of workers attached to this dispatcher.
     */
    workers: Worker[] = [];

    constructor () {
        super();
        /**
         * Map of channel name to worker or local service provider.
         * If the entry is a Worker, the service is provided by an object on that worker.
         * Otherwise, the service is provided locally and methods on the service will be called directly.
         * @see {setService}
         */
        this.services = {};
        this._onMessage = this._onMessage.bind(this);
    }

    /**
     * Synchronously call a particular method on a particular service provided locally.
     * Calling this function on a remote service will fail.
     * @param {string} service - the name of the service.
     * @param {string} method - the name of the method.
     * @param {unknown[]} args - the arguments to be copied to the method, if any.
     * @returns {unknown} - the return value of the service method.
     */
    callSync (service: string, method: string, ...args: unknown[]): unknown {
        const provider = this._getServiceProvider(service);
        if (provider) {
            if (provider.isRemote) {
                throw new Error(`Cannot use 'callSync' on remote provider for service ${service}.`);
            }
            if (typeof provider.provider === 'object' && provider.provider !== null && method in provider.provider) {
                const func = (provider.provider as Record<string, unknown>)[method];
                if (typeof func === 'function') {
                    return func.apply(provider.provider, args);
                }
            }
            throw new Error(`Method ${method} not found on provider for service ${service}`);
        }
        throw new Error(`Provider not found for service: ${service} `);
    }

    /**
     * Synchronously set a local object as the global provider of the specified service.
     * WARNING: Any method on the provider can be called from any worker within the dispatch system.
     * @param {string} service - a globally unique string identifying this service. Examples: 'vm', 'gui', 'extension9'.
     * @param {unknown} provider - a local object which provides this service.
     */
    setServiceSync (service: string, provider: unknown): void {
        if (service in this.services) {
            console.warn(`Central dispatch replacing existing service provider for ${service}`);
        }
        this.services[service] = provider;
    }

    /**
     * Set a local object as the global provider of the specified service.
     * WARNING: Any method on the provider can be called from any worker within the dispatch system.
     * @param {string} service - a globally unique string identifying this service. Examples: 'vm', 'gui', 'extension9'.
     * @param {unknown} provider - a local object which provides this service.
     * @returns {Promise<void>} - a promise which will resolve once the service is registered.
     */
    setService (service: string, provider: unknown): Promise<void> {
        /** Return a promise for consistency with {@link WorkerDispatch#setService} */
        try {
            this.setServiceSync(service, provider);
            return Promise.resolve();
        } catch (e) {
            return Promise.reject(e);
        }
    }

    /**
     * Add a worker to the message dispatch system. The worker must implement a compatible message dispatch framework.
     * The dispatcher will immediately attempt to "handshake" with the worker.
     * @param {Worker} worker - the worker to add into the dispatch system.
     */
    addWorker (worker: Worker): void {
        if (this.workers.indexOf(worker) === -1) {
            this.workers.push(worker);
            worker.onmessage = this._onMessage.bind(this, worker);
            this._remoteCall(worker, 'dispatch', 'handshake').catch(e => {
                console.error(`Could not handshake with worker: ${e} `);
            });
        } else {
            console.warn('Central dispatch ignoring attempt to add duplicate worker');
        }
    }

    /**
     * Fetch the service provider object for a particular service name.
     * @override
     * @param {string} service - the name of the service to look up
     * @returns {{provider: unknown, isRemote: boolean}} - the means to contact the service, if found
     * @protected
     */
    _getServiceProvider (service: string): { provider: unknown; isRemote: boolean } {
        const provider = this.services[service];
        if (provider) {
            return {
                provider,
                isRemote: Boolean((this.workerClass && provider instanceof this.workerClass) || (provider as { isRemote?: boolean }).isRemote)
            };
        }
        throw `provider ${service} not found`;
    }

    /**
     * Handle a call message sent to the dispatch service itself
     * @override
     * @param {Worker} worker - the worker which sent the message.
     * @param {DispatchCallMessage} message - the message to be handled.
     * @returns {Promise<void> | undefined} - a promise for the results of this operation, if appropriate
     * @protected
     */
    _onDispatchMessage (worker: Worker, message: DispatchCallMessage): Promise<void> | undefined {
        let promise: Promise<void> | undefined;
        switch (message.method) {
        case 'setService':
            if (!message.args) {
                console.error('setService received empty argument');
                break;
            }
            promise = this.setService(String(message.args[0]), worker);
            break;
        default:
            console.error(`Central dispatch received message for unknown method: ${message.method}`);
        }
        return promise;
    }
}

export type CentralDispatch = _CentralDispatch;

export const CentralDispatch = new _CentralDispatch();
