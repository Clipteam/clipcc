/* eslint-disable @typescript-eslint/no-unused-vars */
interface OpenRequest {
    resolve: (result: unknown) => void;
    reject: (error: Error) => void;
}

interface BaseMessage {
    jsonrpc: '2.0';
}

interface ResponseMessage extends BaseMessage {
    result?: unknown;
    error?: unknown;
    id: number;
}

interface RequestMessage extends BaseMessage {
    method: string;
    params: object;
    id?: number | null;
}

type JSONRPCMessage = ResponseMessage | RequestMessage;

class JSONRPC {
    _requestID = 0;
    _openRequests: Record<number, OpenRequest> = {};

    /**
     * Make an RPC request and retrieve the result.
     * @param method - the remote method to call.
     * @param params - the parameters to pass to the remote method.
     * @returns - a promise for the result of the call.
     */
    sendRemoteRequest (method: string, params: object): Promise<unknown> {
        const requestID = this._requestID++;

        const promise = new Promise<unknown>((resolve, reject) => {
            this._openRequests[requestID] = {resolve, reject};
        });

        this._sendRequest(method, params, requestID);

        return promise;
    }

    /**
     * Make an RPC notification with no expectation of a result or callback.
     * @param method - the remote method to call.
     * @param params - the parameters to pass to the remote method.
     */
    sendRemoteNotification (method: string, params: object) {
        this._sendRequest(method, params);
    }

    /**
     * Handle an RPC request from remote, should return a result or Promise for result, if appropriate.
     * @param method - the method requested by the remote caller.
     * @param params - the parameters sent with the remote caller's request.
     */
    didReceiveCall (method: string, params: object): unknown {
        throw new Error('Must override didReceiveCall');
    }

    _sendMessage (jsonMessageObject: object) {
        throw new Error('Must override _sendMessage');
    }

    _sendRequest (method: string, params: object, id?: number) {
        const request: Record<string, unknown> = {
            jsonrpc: '2.0',
            method,
            params
        };

        if (id !== null) {
            request.id = id;
        }

        this._sendMessage(request);
    }

    _handleMessage (json: JSONRPCMessage) {
        if (json.jsonrpc !== '2.0') {
            throw new Error(`Bad or missing JSON-RPC version in message: ${json}`);
        }
        if (Object.prototype.hasOwnProperty.call(json, 'method')) {
            this._handleRequest(json as RequestMessage);
        } else {
            this._handleResponse(json as ResponseMessage);
        }
    }

    _sendResponse (id: number, result: unknown, error?: Error) {
        const response: Record<string, unknown> = {
            jsonrpc: '2.0',
            id
        };
        if (error) {
            response.error = error;
        } else {
            response.result = result || null;
        }
        this._sendMessage(response);
    }

    _handleResponse (json: ResponseMessage) {
        const {result, error, id} = json;
        const openRequest = this._openRequests[id];
        delete this._openRequests[id];
        if (openRequest) {
            if (error) {
                openRequest.reject(error as Error);
            } else {
                openRequest.resolve(result);
            }
        }
    }

    _handleRequest (json: RequestMessage) {
        const {method, params, id} = json;
        const rawResult = this.didReceiveCall(method, params);
        if (id !== null && typeof id !== 'undefined') {
            Promise.resolve(rawResult).then(
                result => {
                    this._sendResponse(id as number, result);
                },
                error => {
                    this._sendResponse(id as number, null, error as Error);
                }
            );
        }
    }
}

export default JSONRPC;
