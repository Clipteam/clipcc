import {ipcMain} from 'electron';

import {openAboutWindow, openPrivacyWindow} from './window-manager';

export const registerIpcListeners = () => {
    ipcMain.on('open-about-window', openAboutWindow);
    ipcMain.on('open-privacy-window', openPrivacyWindow);
};
