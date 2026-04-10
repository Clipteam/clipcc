import {app} from 'electron';

import {registerIpcListeners} from './ipc';
import {ensureMainWindow, initializeWindows, setAppQuitting} from './window-manager';

app.whenReady().then(() => {
    initializeWindows();
    registerIpcListeners();

    app.on('activate', () => {
        ensureMainWindow();
    });
});

app.on('before-quit', () => {
    setAppQuitting();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
