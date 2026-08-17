import JSONRPC from '../util/jsonrpc';
import Runtime from '../engine/runtime';
import ScratchLinkWebSocket from '../util/scratch-link-websocket';

class BT extends JSONRPC {

    _socket: ScratchLinkWebSocket;
    _sendMessage!: (jsonMessageObject: object) => void;

    _availablePeripherals: Record<number, unknown>;
    _connectCallback: () => void;
    _connected: boolean;
    _characteristicDidChangeCallback: ((message: unknown) => void) | null;
    _resetCallback: (() => void) | null;
    _discoverTimeoutID: number | null;
    _extensionId: string;
    _peripheralOptions: object;
    _messageCallback: (params: unknown) => void;
    _runtime: Runtime;

    /**
     * A BT peripheral socket object.  It handles connecting, over web sockets, to
     * BT peripherals, and reading and writing data to them.
     * @param runtime - the Runtime for sending/receiving GUI update events.
     * @param extensionId - the id of the extension using this socket.
     * @param peripheralOptions - the list of options for peripheral discovery.
     * @param connectCallback - a callback for connection.
     * @param resetCallback - a callback for resetting extension state.
     * @param messageCallback - a callback for message sending.
     */
    constructor (
        runtime: Runtime,
        extensionId: string,
        peripheralOptions: object,
        connectCallback: () => void,
        resetCallback: (() => void) | null = null,
        messageCallback: (params: unknown) => void
    ) {
        super();

        this._socket = runtime.getScratchLinkSocket('BT') as ScratchLinkWebSocket;
        this._socket.setOnOpen(this.requestPeripheral.bind(this));
        this._socket.setOnError(() => this._handleRequestError());
        this._socket.setOnClose(() => this.handleDisconnectError());
        this._socket.setHandleMessage(this._handleMessage.bind(this) as (json: unknown) => void);

        this._sendMessage = this._socket.sendMessage.bind(this._socket);

        this._availablePeripherals = {};
        this._connectCallback = connectCallback;
        this._connected = false;
        this._characteristicDidChangeCallback = null;
        this._resetCallback = resetCallback;
        this._discoverTimeoutID = null;
        this._extensionId = extensionId;
        this._peripheralOptions = peripheralOptions;
        this._messageCallback = messageCallback;
        this._runtime = runtime;

        this._socket.open();
    }

    /**
     * Request connection to the peripheral.
     * If the web socket is not yet open, request when the socket promise resolves.
     */
    requestPeripheral () {
        this._availablePeripherals = {};
        if (this._discoverTimeoutID) {
            window.clearTimeout(this._discoverTimeoutID);
        }
        this._discoverTimeoutID = window.setTimeout(this._handleDiscoverTimeout.bind(this), 15000);
        this.sendRemoteRequest('discover', this._peripheralOptions)
            .catch(
                () => this._handleRequestError()
            );
    }

    /**
     * Try connecting to the input peripheral id, and then call the connect
     * callback if connection is successful.
     * @param id - the id of the peripheral to connect to
     * @param pin - an optional pin for pairing
     */
    connectPeripheral (id: number, pin: string | null = null) {
        const params: Record<string, unknown> = {peripheralId: id};
        if (pin) {
            params.pin = pin;
        }
        this.sendRemoteRequest('connect', params)
            .then(() => {
                this._connected = true;
                this._runtime.emit(Runtime.PERIPHERAL_CONNECTED);
                this._connectCallback();
            })
            .catch(() => {
                this._handleRequestError();
            });
    }

    /**
     * Close the websocket.
     */
    disconnect () {
        if (this._connected) {
            this._connected = false;
        }

        if (this._socket.isOpen()) {
            this._socket.close();
        }

        if (this._discoverTimeoutID) {
            window.clearTimeout(this._discoverTimeoutID);
        }

        // Sets connection status icon to orange
        this._runtime.emit(Runtime.PERIPHERAL_DISCONNECTED);
    }

    /**
     * Whether the peripheral is connected.
     */
    isConnected (): boolean {
        return this._connected;
    }

    sendMessage (options: object): Promise<unknown> {
        return this.sendRemoteRequest('send', options)
            .catch(() => {
                this.handleDisconnectError();
            });
    }

    /**
     * Handle a received call from the socket.
     * @param method - a received method label.
     * @param params - a received list of parameters.
     * @returns optional return value.
     */
    didReceiveCall (method: string, params: Record<string, unknown>): unknown {
        // TODO: Add peripheral 'undiscover' handling
        switch (method) {
        case 'didDiscoverPeripheral':
            this._availablePeripherals[params.peripheralId as number] = params;
            this._runtime.emit(
                Runtime.PERIPHERAL_LIST_UPDATE,
                this._availablePeripherals
            );
            if (this._discoverTimeoutID) {
                window.clearTimeout(this._discoverTimeoutID);
            }
            break;
        case 'userDidPickPeripheral':
            this._availablePeripherals[params.peripheralId as number] = params;
            this._runtime.emit(
                Runtime.USER_PICKED_PERIPHERAL,
                this._availablePeripherals
            );
            if (this._discoverTimeoutID) {
                window.clearTimeout(this._discoverTimeoutID);
            }
            break;
        case 'userDidNotPickPeripheral':
            this._runtime.emit(
                Runtime.PERIPHERAL_SCAN_TIMEOUT
            );
            if (this._discoverTimeoutID) {
                window.clearTimeout(this._discoverTimeoutID);
            }
            break;
        case 'didReceiveMessage':
            this._messageCallback(params); // TODO: refine?
            break;
        default:
            return 'nah';
        }
    }

    /**
     * Handle an error resulting from losing connection to a peripheral.
     *
     * This could be due to:
     * - battery depletion
     * - going out of bluetooth range
     * - being powered down
     *
     * Disconnect the socket, and if the extension using this socket has a
     * reset callback, call it. Finally, emit an error to the runtime.
     */
    handleDisconnectError (/* e */) {
        // log.error(`BT error: ${JSON.stringify(e)}`);

        if (!this._connected) return;

        this.disconnect();

        if (this._resetCallback) {
            this._resetCallback();
        }

        this._runtime.emit(Runtime.PERIPHERAL_CONNECTION_LOST_ERROR, {
            message: `Scratch lost connection to`,
            extensionId: this._extensionId
        });
    }

    _handleRequestError (/* e */) {
        // log.error(`BT error: ${JSON.stringify(e)}`);

        this._runtime.emit(Runtime.PERIPHERAL_REQUEST_ERROR, {
            message: `Scratch lost connection to`,
            extensionId: this._extensionId
        });
    }

    _handleDiscoverTimeout () {
        if (this._discoverTimeoutID) {
            window.clearTimeout(this._discoverTimeoutID);
        }
        this._runtime.emit(Runtime.PERIPHERAL_SCAN_TIMEOUT);
    }
}

export default BT;
