import {ipcMain} from 'electron';

import {openAboutWindow} from './window-manager';

export const registerIpcListeners = () => {
    ipcMain.on('open-about-window', openAboutWindow);
};
