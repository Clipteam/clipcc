import {ipcMain} from 'electron';

import {openAboutWindow, openPrivacyWindow} from './window-manager';

export const registerIpcListeners = () => {
    const onOpenAboutWindow = () => {
        openAboutWindow();
    };

    const onOpenPrivacyWindow = () => {
        openPrivacyWindow();
    };

    ipcMain.on('open-about-window', onOpenAboutWindow);
    ipcMain.on('open-privacy-window', onOpenPrivacyWindow);
};
