import type ScratchLinkWebSocket from '../../vm/src/util/scratch-link-websocket';

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
