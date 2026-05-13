import ScratchLinkWebSocket from '../util/scratch-link-websocket';

type ScratchLinkSafariSocket = (new (type: 'BLE' | 'BT') => ScratchLinkWebSocket) & {
    isSafariHelperCompatible: () => boolean;
};

declare global {
    interface Window {
        Scratch?: {
            ScratchLinkSafariSocket?: ScratchLinkSafariSocket;
        }
    }
}
