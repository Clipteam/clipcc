import {DispatchCallMessage, SharedDispatch, WorkerLike} from './shared-dispatch';
import log from '../util/log';

/**
 * This class provides a Worker with the means to participate in the message dispatch system managed by CentralDispatch.
 * From any context in the messaging system, the dispatcher's "call" method can call any method on any "service"
 * provided in any participating context. The dispatch system will forward function arguments and return values across
 * worker boundaries as needed.
 */
export class WorkerDispatch extends SharedDispatch {
    /**
     * This promise will be resolved when we have successfully connected to central dispatch.
     */
    private connectionPromise: Promise<void>;

    /**
     * Called when successfully connected.
     */
    private onConnect!: (value: void | PromiseLike<void>) => void;

    /**
     * Map of service name to local service provider.
     * If a service is not listed here, it is assumed to be provided by another context (another Worker or the main
     * thread).
     */
    private services: Record<string, object> = {};

    constructor () {
        super();

        this.connectionPromise = new Promise(resolve => {
            this.onConnect = resolve;
        });

        if (typeof self !== 'undefined') {
            self.onmessage = this.onMessage.bind(this, self);
        }
    }

    /**
     * @returns A promise which will resolve upon connection to central dispatch. If you need to make a call
     * immediately on "startup" you can attach a 'then' to this promise.
     * @example
     *      dispatch.waitForConnection.then(() => {
     *          dispatch.call('myService', 'hello');
     *      })
     */
    get waitForConnection () {
        return this.connectionPromise;
    }

    /**
     * Set a local object as the global provider of the specified service.
     * WARNING: Any method on the provider can be called from any worker within the dispatch system.
     * @param service A globally unique string identifying this service. Examples: 'vm', 'gui', 'extension9'.
     * @param provider A local object which provides this service.
     * @returns A promise which will resolve once the service is registered.
     */
    setService (service: string, provider: object) {
        if (Object.prototype.hasOwnProperty.call(this.services, service)) {
            log.warn(`Worker dispatch replacing existing service provider for ${service}`);
        }
        this.services[service] = provider;
        return this.waitForConnection.then(() => this.remoteCall(self, 'dispatch', 'setService', service));
    }

    /**
     * Fetch the service provider object for a particular service name.
     * @param service The name of the service to look up.
     * @returns The means to contact the service, if found.
     */
    protected override getServiceProvider (service: string) {
        // if we don't have a local service by this name, contact central dispatch by calling `postMessage` on self
        const provider = this.services[service];
        return {
            provider: provider || self,
            isRemote: !provider
        };
    }

    /**
     * Handle a call message sent to the dispatch service itself.
     * @param worker The worker which sent the message.
     * @param message The message to be handled.
     * @returns A promise for the results of this operation, if appropriate.
     */
    protected override onDispatchMessage (worker: WorkerLike, message: DispatchCallMessage) {
        let promise;
        switch (message.method) {
        case 'handshake':
            promise = Promise.resolve(this.onConnect());
            break;
        case 'terminate':
            // Don't close until next tick, after sending confirmation back
            setTimeout(() => self.close(), 0);
            promise = Promise.resolve();
            break;
        default:
            log.error(`Worker dispatch received message for unknown method: ${message.method}`);
        }
        return promise;
    }
}

export default new WorkerDispatch();
