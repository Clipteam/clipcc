import {contextBridge, ipcRenderer} from 'electron';

const desktopApi = {
    onReadyToShow (listener: () => void) {
        ipcRenderer.once('ready-to-show', listener);
    }
};

contextBridge.exposeInMainWorld('desktop', desktopApi);
