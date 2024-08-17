/**
 * A message to the dispatch system representing a service method call
 */
export interface DispatchCallMessage {
    /**
     * Send a response message with this response ID. See {@link DispatchResponseMessage}
     */
    responseId: number;
    /**
     * The name of the service to be called
     */
    service: string;
    /**
     * The name of the method to be called
     */
    method: string;
    /**
     * The arguments to be passed to the method
     */
    args?: unknown[];
}

/**
 * A message to the dispatch system representing the results of a call
 */
export interface DispatchResponseMessage {
    /**
     * A copy of the response ID from the call which generated this response
     */
    responseId: number;
    /**
     * If this is truthy, then it contains results from a failed call (such as an exception)
     */
    error?: unknown;
    /**
     * If error is not truthy, then this contains the return value of the call (if any)
     */
    result?: unknown;
}

export type DispatchMessage = DispatchCallMessage | DispatchResponseMessage;

/**
 * The SharedDispatch class is responsible for dispatch features shared by
 * {@link CentralDispatch} and {@link WorkerDispatch}.
 */
export abstract class SharedDispatch {
    /**
     * List of callback registrations for promises waiting for a response from a call to a service on another
     * worker. A callback registration is an array of [resolve,reject] Promise functions.
     * Calls to local services don't enter this list.
     */
    protected callbacks: Array<[(value: unknown) => void, (reason: unknown) => void]> = [];

    /**
     * The next response ID to be used.
     */
    protected nextResponseId = 0;

    /**
     * Call a particular method on a particular service, regardless of whether that service is provided locally or on
     * a worker. If the service is provided by a worker, the `args` will be copied using the Structured Clone
     * algorithm, except for any items which are also in the `transfer` list. Ownership of those items will be
     * transferred to the worker, and they should not be used after this call.
     * @param {string} service - the name of the service.
     * @param {string} method - the name of the method.
     * @param {unknown[]} args - the arguments to be copied to the method, if any.
     * @returns {Promise<T>} - a promise for the return value of the service method.
     */
    call<T = unknown> (service: string, method: string, ...args: unknown[]): Promise<T> {
        return this.transferCall<T>(service, method, null, ...args);
    }

    /**
     * Call a particular method on a particular service, regardless of whether that service is provided locally or on
     * a worker. If the service is provided by a worker, the `args` will be copied using the Structured Clone
     * algorithm, except for any items which are also in the `transfer` list. Ownership of those items will be
     * transferred to the worker, and they should not be used after this call.
     * @param {string} service - the name of the service.
     * @param {string} method - the name of the method.
     * @param {Transferable[] | null} transfer - objects to be transferred instead of copied. Must be present in `args` to be useful.
     * @param {unknown[]} args - the arguments to be copied to the method, if any.
     * @returns {Promise<T>} - a promise for the return value of the service method.
     */
    transferCall<T = unknown> (service: string, method: string, transfer: Transferable[] | null, ...args: unknown[]): Promise<T> {
        try {
            const { provider, isRemote } = this._getServiceProvider(service);
            if (provider) {
                if (isRemote) {
                    return this._remoteTransferCall<T>(provider as Worker, service, method, transfer, ...args);
                }
                const result = (provider as Record<string, unknown>)[method];
                if (typeof result === 'function') {
                    return Promise.resolve(result.apply(provider, args) as T);
                }
                return Promise.reject(new Error(`Service provider does not implement ${method}`));
            }
            return Promise.reject(new Error(`Service not found: ${service}`));
        } catch (e) {
            return Promise.reject(e);
        }
    }

    /**
     * Check if a particular service lives on another worker.
     * @param {string} service - the service to check.
     * @returns {boolean} - true if the service is remote (calls must cross a Worker boundary), false otherwise.
     */
    isRemoteService (service: string): boolean {
        return this._getServiceProvider(service).isRemote;
    }

    /**
     * Like {@link call}, but force the call to be posted through a particular communication channel.
     * @param {Worker} provider - send the call through this object's `postMessage` function.
     * @param {string} service - the name of the service.
     * @param {string} method - the name of the method.
     * @param {unknown[]} args - the arguments to be copied to the method, if any.
     * @returns {Promise<T>} - a promise for the return value of the service method.
     */
    protected _remoteCall<T = unknown> (provider: Worker, service: string, method: string, ...args: unknown[]): Promise<T> {
        return this._remoteTransferCall<T>(provider, service, method, null, ...args);
    }

    /**
     * Like {@link transferCall}, but force the call to be posted through a particular communication channel.
     * @param {Worker} provider - send the call through this object's `postMessage` function.
     * @param {string} service - the name of the service.
     * @param {string} method - the name of the method.
     * @param {Transferable[] | null} transfer - objects to be transferred instead of copied. Must be present in `args` to be useful.
     * @param {unknown[]} args - the arguments to be copied to the method, if any.
     * @returns {Promise<T>} - a promise for the return value of the service method.
     */
    protected _remoteTransferCall<T = unknown> (provider: Worker, service: string, method: string, transfer: Transferable[] | null, ...args: unknown[]): Promise<T> {
        return new Promise((resolve, reject) => {
            const responseId = this._storeCallbacks(resolve as (value: unknown) => void, reject);
            const message: DispatchCallMessage = { responseId, service, method, args };
            if (transfer) {
                provider.postMessage(message, transfer);
            } else {
                provider.postMessage(message);
            }
        });
    }

    /**
     * Store callback functions pending a response message.
     * @param {(value: unknown) => void} resolve - function to call if the service method returns.
     * @param {(reason: unknown) => void} reject - function to call if the service method throws.
     * @returns {number} - a unique response ID for this set of callbacks. See {@link _deliverResponse}.
     * @protected
     */
    protected _storeCallbacks (resolve: (value: unknown) => void, reject: (reason: unknown) => void): number {
        const responseId = this.nextResponseId++;
        this.callbacks[responseId] = [resolve, reject];
        return responseId;
    }

    /**
     * Deliver call response from a worker. This should only be called as the result of a message from a worker.
     * @param {number} responseId - the response ID of the callback set to call.
     * @param {DispatchResponseMessage} message - the message containing the response value(s).
     * @protected
     */
    protected _deliverResponse (responseId: number, message: DispatchResponseMessage): void {
        try {
            const [resolve, reject] = this.callbacks[responseId];
            delete this.callbacks[responseId];
            if (message.error) {
                reject(message.error);
            } else {
                resolve(message.result);
            }
        } catch (e) {
            console.error(`Dispatch callback failed: ${e}`);
        }
    }

    /**
     * Handle a message event received from a connected worker.
     * @param {Worker} worker - the worker which sent the message, or the global object if running in a worker.
     * @param {MessageEvent} event - the message event to be handled.
     * @protected
     */
    protected _onMessage (worker: Worker, event: MessageEvent): void {
        const message = event.data as DispatchMessage;
        let promise: Promise<unknown> | undefined;

        if ('service' in message) {
            if (message.service === 'dispatch') {
                promise = this._onDispatchMessage(worker, message);
            } else {
                promise = this.call(message.service, message.method, ...(message.args || []));
            }
        } else if (typeof message.responseId === 'undefined') {
            console.error(`Dispatch caught malformed message from a worker: ${JSON.stringify(event)}`);
        } else {
            this._deliverResponse(message.responseId, message);
        }

        if (promise) {
            if (typeof message.responseId === 'undefined') {
                console.error(`Dispatch message missing required response ID: ${JSON.stringify(event)}`);
            } else {
                promise.then(
                    result => worker.postMessage({ responseId: message.responseId, result }),
                    error => worker.postMessage({ responseId: message.responseId, error: `${error}` })
                );
            }
        }
    }

    /**
     * Fetch the service provider object for a particular service name.
     * @param {string} service - the name of the service to look up
     * @returns {{provider: unknown, isRemote: boolean}} - the means to contact the service, if found
     * @protected
     */
    protected abstract _getServiceProvider(service: string): { provider: unknown; isRemote: boolean };

    /**
     * Handle a call message sent to the dispatch service itself
     * @param {Worker} worker - the worker which sent the message.
     * @param {DispatchCallMessage} message - the message to be handled.
     * @returns {Promise<unknown> | undefined} - a promise for the results of this operation, if appropriate
     * @protected
     */
    protected abstract _onDispatchMessage(worker: Worker, message: DispatchCallMessage): Promise<unknown> | undefined;

    /**
     * Purify an object so that it can be safely transferred to the worker.
     * @param {unknown} obj - The Object that need to be purified.
     * @param {Set<object>} visited - Set of already visited objects to prevent circular references.
     * @param {number} depth - Current depth of recursion.
     * @returns {unknown} - purified object.
     */
    protected _purifyObject (obj: unknown, visited = new Set<object>(), depth = 1): unknown {
        if (typeof obj === 'function' || typeof obj === 'symbol') {
            return undefined;
        }

        if (obj !== null && typeof obj === 'object') {
            if (visited.has(obj)) return undefined;
            visited.add(obj);

            if (Array.isArray(obj)) {
                return obj.map((item) => this._purifyObject(item, visited, depth + 1));
            }
            const result: Record<string, unknown> = {};
            for (const key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    const value = (obj as Record<string, unknown>)[key];
                    result[key] = this._purifyObject(value, visited, depth + 1);
                }
            }
            return result;
        }
        return obj;
    }
}
