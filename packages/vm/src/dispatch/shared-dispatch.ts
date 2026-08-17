/* eslint-disable @typescript-eslint/no-explicit-any */
import log from '../util/log';

/**
 * A message to the dispatch system representing a service method call.
 */
export interface DispatchCallMessage {
    /** Send a response message with this response ID. */
    responseId: number;
    /** The name of the service to be called. */
    service: string;
    /** The name of the method to be called. */
    method: string;
    /** The arguments to be passed to the method. */
    args: any[];
}

/**
 * A message to the dispatch system representing the results of a call.
 */
export interface DispatchResponseMessage {
    /** A copy of the response ID from the call which generated this response. */
    responseId: number;
    /** If this is truthy, then it contains results from a failed call (such as an exception). */
    error?: any;
    /** If error is not truthy, then this contains the return value of the call (if any). */
    result?: any;
}

/** Any message to the dispatch system. */
export type DispatchMessage = DispatchCallMessage | DispatchResponseMessage;

function isDispatchCallMessage (obj: DispatchMessage): obj is DispatchCallMessage {
    return 'service' in obj;
}

export type Resolve = (value: any | PromiseLike<any>) => void;
export type Reject = (reason?: any) => void;

export type WorkerLike = Worker | {
    postMessage(...args: any[]): void;
};

/**
 * The SharedDispatch class is responsible for dispatch features shared by CentralDispatch and WorkerDispatch.
 */
export abstract class SharedDispatch {
    /**
     * List of callback registrations for promises waiting for a response from a call to a service on another
     * worker. A callback registration is an array of [resolve,reject] Promise functions.
     * Calls to local services don't enter this list.
     */
    private callbacks: [Resolve, Reject][] = [];

    /**
     * The next response ID to be used.
     */
    private nextResponseId: number = 0;

    /**
     * Call a particular method on a particular service, regardless of whether that service is provided locally or on
     * a worker. If the service is provided by a worker, the `args` will be copied using the Structured Clone
     * algorithm, except for any items which are also in the `transfer` list. Ownership of those items will be
     * transferred to the worker, and they should not be used after this call.
     * @example
     *      dispatcher.call('vm', 'setData', 'cat', 42);
     *      // this finds the worker for the 'vm' service, then on that worker calls:
     *      vm.setData('cat', 42);
     * @param service The name of the service.
     * @param method The name of the method.
     * @param args The arguments to be copied to the method, if any.
     * @returns A promise for the return value of the service method.
     */
    call (service: string, method: string, ...args: any[]): Promise<any> {
        return this.transferCall(service, method, null, ...args);
    }

    /**
     * Call a particular method on a particular service, regardless of whether that service is provided locally or on
     * a worker. If the service is provided by a worker, the `args` will be copied using the Structured Clone
     * algorithm, except for any items which are also in the `transfer` list. Ownership of those items will be
     * transferred to the worker, and they should not be used after this call.
     * @example
     *      dispatcher.transferCall('vm', 'setData', [myArrayBuffer], 'cat', myArrayBuffer);
     *      // this finds the worker for the 'vm' service, transfers `myArrayBuffer` to it, then on that worker calls:
     *      vm.setData('cat', myArrayBuffer);
     * @param service The name of the service.
     * @param method The name of the method.
     * @param transfer Objects to be transferred instead of copied. Must be present in `args` to be useful.
     * @param args The arguments to be copied to the method, if any.
     * @returns A promise for the return value of the service method.
     */
    transferCall (service: string, method: string, transfer: object[] | null, ...args: any[]): Promise<any> {
        try {
            const {provider, isRemote} = this.getServiceProvider(service);
            if (provider) {
                if (isRemote) {
                    return this.remoteTransferCall(provider as Worker, service, method, transfer, ...args);
                }

                const result = (provider as any)[method](...args);
                return Promise.resolve(result);
            }
            return Promise.reject(new Error(`Service not found: ${service}`));
        } catch (e) {
            return Promise.reject(e);
        }
    }

    /**
     * Check if a particular service lives on another worker.
     * @param service The service to check.
     * @returns True if the service is remote (calls must cross a Worker boundary), false otherwise.
     */
    isRemoteService (service: string): boolean {
        return this.getServiceProvider(service).isRemote;
    }

    /**
     * Like `call`, but force the call to be posted through a particular communication channel.
     * @param provider Send the call through this object's `postMessage` function.
     * @param service The name of the service.
     * @param method The name of the method.
     * @param args The arguments to be copied to the method, if any.
     * @returns A promise for the return value of the service method.
     */
    remoteCall (provider: WorkerLike, service: string, method: string, ...args: any[]): Promise<any> {
        return this.remoteTransferCall(provider, service, method, null, ...args);
    }

    /**
     * Like `transferCall`, but force the call to be posted through a particular communication channel.
     * @param provider Send the call through this object's `postMessage` function.
     * @param service The name of the service.
     * @param method The name of the method.
     * @param transfer Objects to be transferred instead of copied. Must be present in `args` to be useful.
     * @param args The arguments to be copied to the method, if any.
     * @returns a promise for the return value of the service method.
     */
    private remoteTransferCall (
        provider: WorkerLike,
        service: string,
        method: string,
        transfer: any[] | null,
        ...args: any[]) {
        return new Promise((resolve, reject) => {
            const responseId = this.storeCallbacks(resolve, reject);

            args = JSON.parse(JSON.stringify(args));

            if (transfer) {
                provider.postMessage({service, method, responseId, args}, transfer);
            } else {
                provider.postMessage({service, method, responseId, args});
            }
        });
    }

    /**
     * Store callback functions pending a response message.
     * @param resolve Function to call if the service method returns.
     * @param reject Function to call if the service method throws.
     * @returns A unique response ID for this set of callbacks.
     */
    protected storeCallbacks (resolve: Resolve, reject: Reject) {
        const responseId = this.nextResponseId++;
        this.callbacks[responseId] = [resolve, reject];
        return responseId;
    }

    /**
     * Deliver call response from a worker. This should only be called as the result of a message from a worker.
     * @param responseId The response ID of the callback set to call.
     * @param message The message containing the response value(s).
     */
    protected deliverResponse (responseId: number, message: DispatchResponseMessage) {
        try {
            const [resolve, reject] = this.callbacks[responseId];
            delete this.callbacks[responseId];
            if (message.error) {
                reject(message.error);
            } else {
                resolve(message.result);
            }
        } catch (e) {
            log.error(`Dispatch callback failed: ${JSON.stringify(e)}`);
        }
    }

    /**
     * Handle a message event received from a connected worker.
     * @param worker The worker which sent the message, or the global object if running in a worker.
     * @param event The message event to be handled.
     */
    protected onMessage (worker: WorkerLike, event: MessageEvent<DispatchMessage>) {
        const message = event.data;
        let promise;
        if (isDispatchCallMessage(message) && message.service) {
            message.args = message.args || [];
            if (message.service === 'dispatch') {
                promise = this.onDispatchMessage(worker, message);
            } else {
                promise = this.call(message.service, message.method, ...message.args);
            }
        } else if (typeof message.responseId === 'undefined') {
            log.error(`Dispatch caught malformed message from a worker: ${JSON.stringify(event)}`);
        } else {
            this.deliverResponse(message.responseId, message);
        }
        if (promise) {
            if (typeof message.responseId === 'undefined') {
                log.error(`Dispatch message missing required response ID: ${JSON.stringify(event)}`);
            } else {
                promise.then(
                    result => worker.postMessage({responseId: message.responseId, result}),
                    error => worker.postMessage({responseId: message.responseId, error})
                );
            }
        }
    }

    /**
     * Fetch the service provider object for a particular service name.
     * @param service The name of the service to look up.
     * @returns The means to contact the service, if found.
     */
    protected abstract getServiceProvider(service: string): {
        provider: Worker | object;
        isRemote: boolean;
    };

    /**
     * Handle a call message sent to the dispatch service itself
     * @param worker The worker which sent the message.
     * @param message The message to be handled.
     * @returns A promise for the results of this operation, if appropriate
     */
    protected abstract onDispatchMessage(worker: WorkerLike, message: DispatchCallMessage): Promise<any> | undefined;
}
