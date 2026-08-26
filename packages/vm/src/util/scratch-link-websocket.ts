/**
 * This class provides a ScratchLinkSocket implementation using WebSockets,
 * attempting to connect with the locally installed Scratch-Link.
 *
 * To connect with ScratchLink without WebSockets, you must implement all of the
 * public methods in this class.
 * - open()
 * - close()
 * - setOn[Open|Close|Error]
 * - setHandleMessage
 * - sendMessage(msgObj)
 * - isOpen()
 */
class ScratchLinkWebSocket {
    _type: string;
    _onOpen: ((e: Event) => void) | null;
    _onClose: ((e: Event) => void) | null;
    _onError: ((e: Event) => void) | null;
    _handleMessage: ((json: unknown) => void) | null;

    _ws: WebSocket | null;

    constructor (type: string) {
        this._type = type;
        this._onOpen = null;
        this._onClose = null;
        this._onError = null;
        this._handleMessage = null;

        this._ws = null;
    }

    open (): void {
        if (!(this._onOpen && this._onClose && this._onError && this._handleMessage)) {
            throw new Error('Must set open, close, message and error handlers before calling open on the socket');
        }

        let pathname: string;
        switch (this._type) {
        case 'BLE':
            pathname = 'scratch/ble';
            break;
        case 'BT':
            pathname = 'scratch/bt';
            break;
        default:
            throw new Error(`Unknown ScratchLink socket Type: ${this._type}`);
        }

        // Try ws:// (the new way) and wss:// (the old way) simultaneously. If either connects, close the other. If we
        // were to try one and fall back to the other on failure, that could mean a delay of 30 seconds or more for
        // those who need the fallback.
        // If both connections fail we should report only one error.

        const setSocket = (socketToUse: WebSocket, socketToClose: WebSocket) => {
            socketToClose.onopen = socketToClose.onerror = null;
            socketToClose.close();

            this._ws = socketToUse;
            this._ws.onopen = this._onOpen;
            this._ws.onclose = this._onClose;
            this._ws.onerror = this._onError;
            this._ws.onmessage = this._onMessage.bind(this);
        };

        const ws = new WebSocket(`ws://127.0.0.1:20111/${pathname}`);
        const wss = new WebSocket(`wss://device-manager.scratch.mit.edu:20110/${pathname}`);

        const connectTimeout = setTimeout(() => {
            // neither socket succeeded before the timeout
            setSocket(ws, wss);
            this._ws!.onerror!(new Event('timeout'));
        }, 15 * 1000);
        ws.onopen = (openEvent: Event) => {
            clearTimeout(connectTimeout);
            setSocket(ws, wss);
            this._ws!.onopen!(openEvent);
        };
        wss.onopen = (openEvent: Event) => {
            clearTimeout(connectTimeout);
            setSocket(wss, ws);
            this._ws!.onopen!(openEvent);
        };

        let wsError: Event | null = null;
        let wssError: Event | null = null;
        const errorHandler = () => {
            // if only one has received an error, we haven't overall failed yet
            if (wsError && wssError) {
                clearTimeout(connectTimeout);
                setSocket(ws, wss);
                this._ws!.onerror!(wsError);
            }
        };
        ws.onerror = (errorEvent: Event) => {
            wsError = errorEvent;
            errorHandler();
        };
        wss.onerror = (errorEvent: Event) => {
            wssError = errorEvent;
            errorHandler();
        };
    }

    close (): void {
        this._ws!.close();
        this._ws = null;
    }

    sendMessage (message: object): void {
        const messageText = JSON.stringify(message);
        this._ws!.send(messageText);
    }

    setOnOpen (fn: (e: Event) => void): void {
        this._onOpen = fn;
    }

    setOnClose (fn: (e: Event) => void): void {
        this._onClose = fn;
    }

    setOnError (fn: (e: Event) => void): void {
        this._onError = fn;
    }

    setHandleMessage (fn: (json: unknown) => void): void {
        this._handleMessage = fn;
    }

    isOpen (): boolean {
        return !!(this._ws && this._ws.readyState === this._ws.OPEN);
    }

    _onMessage (e: MessageEvent): void {
        const json = JSON.parse(e.data);
        this._handleMessage!(json);
    }
}

export default ScratchLinkWebSocket;
