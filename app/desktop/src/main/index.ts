import {app} from 'electron';

import {registerIpcListeners} from './ipc';
import {ensureMainWindow, initializeWindows} from './window-manager';

app.whenReady().then(() => {
    initializeWindows();
    registerIpcListeners();

    app.on('activate', () => {
        ensureMainWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
