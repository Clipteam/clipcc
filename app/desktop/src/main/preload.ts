import {contextBridge, ipcRenderer} from 'electron';

const runtimeVersions = {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node
};

const desktopApi = {
    onReadyToShow (listener: () => void) {
        ipcRenderer.once('ready-to-show', listener);
    },
    openAboutWindow () {
        ipcRenderer.send('open-about-window');
    },
    openPrivacyWindow () {
        ipcRenderer.send('open-privacy-window');
    },
    getRuntimeVersions () {
        return runtimeVersions;
    }
};

contextBridge.exposeInMainWorld('desktop', desktopApi);
