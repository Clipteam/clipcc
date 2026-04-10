import {app, Menu, session} from 'electron';

import {registerIpcListeners} from './ipc';
import MacOSMenu from './macos-menu';
import {initializeWindows} from './window-manager';

app.commandLine.appendSwitch('enable-features', 'FluentScrollbar,OverlayScrollbar');
app.whenReady().then(() => {
    session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
        const existingHeader = details.requestHeaders['User-Agent'];
        const baseUserAgent = (typeof existingHeader === 'string' && existingHeader.trim()) ?
            existingHeader :
            app.userAgentFallback;

        details.requestHeaders['User-Agent'] = `${baseUserAgent} ClipCCDesktop/${app.getVersion()}`;
        callback({requestHeaders: details.requestHeaders});
    });

    initializeWindows();
    registerIpcListeners();
});

if (process.platform === 'darwin') {
    const osxMenu = Menu.buildFromTemplate(MacOSMenu(app));
    Menu.setApplicationMenu(osxMenu);
} else {
    // disable menu for other platforms
    Menu.setApplicationMenu(null);
}

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
