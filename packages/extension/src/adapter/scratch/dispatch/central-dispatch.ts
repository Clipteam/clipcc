/**
 * @license
 * Copyright 2017 Massachusetts Institute of Technology
 * SPDX-License-Identifier: BSD-3-Clause
 */

import logger from '../../../utils/logger';
import {DispatchCallMessage, SharedDispatch, WorkerLike} from './shared-dispatch';

/**
 * This class serves as the central broker for message dispatch. It expects to operate on the main thread / Window and
 * it must be informed of any Worker threads which will participate in the messaging system. From any context in the
 * messaging system, the dispatcher's "call" method can call any method on any "service" provided in any participating
 * context. The dispatch system will forward function arguments and return values across worker boundaries as needed.
 */
export class CentralDispatch extends SharedDispatch {
    /**
     * Map of channel name to worker or local service provider.
     * If the entry is a Worker, the service is provided by an object on that worker.
     * Otherwise, the service is provided locally and methods on the service will be called directly.
     */
    private services: Record<string, Worker | object> = {};

    /**
     * The constructor we will use to recognize workers.
     */
    private workerClass = (typeof Worker === 'undefined' ? null : Worker);

    /**
     * List of workers attached to this dispatcher.
     */
    private workers: Worker[] = [];

    /**
     * Synchronously call a particular method on a particular service provided locally.
     * Calling this function on a remote service will fail.
     * @param service The name of the service.
     * @param method The name of the method.
     * @param args The arguments to be copied to the method, if any.
     * @returns The return value of the service method.
     */
    callSync(service: string, method: string, ...args: any[]) {
        const {provider, isRemote} = this.getServiceProvider(service);
        if (provider) {
            if (isRemote) {
                throw new Error(`Cannot use 'callSync' on remote provider for service ${service}.`);
            }

            return (provider as any)[method](...args);
        }
        throw new Error(`Provider not found for service: ${service}`);
    }

    /**
     * Synchronously set a local object as the global provider of the specified service.
     * WARNING: Any method on the provider can be called from any worker within the dispatch system.
     * @param service A globally unique string identifying this service. Examples: 'vm', 'gui', 'extension9'.
     * @param provider A local object which provides this service.
     */
    setServiceSync(service: string, provider: object) {
        if (Object.prototype.hasOwnProperty.call(this.services, service)) {
            logger.warn(`Central dispatch replacing existing service provider for ${service}`);
        }
        this.services[service] = provider;
    }

    /**
     * Set a local object as the global provider of the specified service.
     * WARNING: Any method on the provider can be called from any worker within the dispatch system.
     * @param service A globally unique string identifying this service. Examples: 'vm', 'gui', 'extension9'.
     * @param provider A local object which provides this service.
     * @returns A promise which will resolve once the service is registered.
     */
    setService(service: string, provider: object): Promise<void> {
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
     * @param worker The worker to add into the dispatch system.
     */
    addWorker(worker: Worker) {
        if (this.workers.indexOf(worker) === -1) {
            this.workers.push(worker);
            worker.onmessage = this.onMessage.bind(this, worker);
            this.remoteCall(worker, 'dispatch', 'handshake').catch(e => {
                logger.error(`Could not handshake with worker: ${JSON.stringify(e)}`);
            });
        } else {
            logger.warn('Central dispatch ignoring attempt to add duplicate worker');
        }
    }

    /**
     * Fetch the service provider object for a particular service name.
     * @param service The name of the service to look up.
     * @returns The means to contact the service, if found.
     */
    protected override getServiceProvider(service: string) {
        const provider = this.services[service];
        const isRemote = Boolean(this.workerClass && provider instanceof this.workerClass);
        return {
            provider,
            isRemote
        };
    }

    /**
     * Handle a call message sent to the dispatch service itself.
     * @param worker The worker which sent the message.
     * @param message The message to be handled.
     * @returns A promise for the results of this operation, if appropriate.
     */
    protected override onDispatchMessage(worker: WorkerLike, message: DispatchCallMessage) {
        let promise;
        switch (message.method) {
        case 'setService':
            promise = this.setService(message.args[0], worker);
            break;
        default:
            logger.error(`Central dispatch received message for unknown method: ${message.method}`);
        }
        return promise;
    }
}

export default new CentralDispatch();
