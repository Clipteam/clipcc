import {app, BrowserWindow, ipcMain, shell} from 'electron';
import path from 'path';

const windows: Partial<Record<'main' | 'about' | 'privacy' | 'loading', BrowserWindow>> = {};

const getRendererUrl = (route = 'app') => {
    const rendererUrlFromEnv = process.env.CLIPCC_DESKTOP_RENDERER_URL;
    if (!rendererUrlFromEnv) return null;

    const rendererUrl = new URL(rendererUrlFromEnv);
    rendererUrl.searchParams.set('route', route);
    return rendererUrl.toString();
};

const loadRendererRoute = (window: BrowserWindow, route = 'app') => {
    const rendererUrl = getRendererUrl(route);
    if (rendererUrl) {
        return window.loadURL(rendererUrl);
    }
    return window.loadFile(path.resolve(__dirname, '..', 'renderer', 'index.html'), {
        query: {
            route
        }
    });
};

const createMainWindow = () => {
    const window = new BrowserWindow({
        title: 'ClipCC',
        width: 1280,
        height: 820,
        minWidth: 960,
        minHeight: 600,
        show: false,
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.resolve(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false
        }
    });

    window.webContents.setWindowOpenHandler(({url}) => {
        shell.openExternal(url);
        return {action: 'deny'};
    });

    loadRendererRoute(window, 'app');

    window.once('ready-to-show', () => {
        windows.loading?.show();
        window.webContents.send('ready-to-show');
    });

    window.webContents.once('did-finish-load', () => {
        windows.loading?.hide();
        window.show();
    });

    window.on('closed', () => {
        if (windows.main === window) {
            windows.main = undefined;
        }
    });

    return window;
};

const createAboutWindow = () => {
    const window = new BrowserWindow({
        title: 'About ClipCC',
        width: 400,
        height: 400,
        parent: windows.main,
        show: false,
        autoHideMenuBar: true,
        useContentSize: true,
        webPreferences: {
            preload: path.resolve(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false
        }
    });

    window.webContents.setWindowOpenHandler(({url}) => {
        shell.openExternal(url);
        return {action: 'deny'};
    });

    loadRendererRoute(window, 'about');

    window.on('close', event => {
        event.preventDefault();
        window.hide();
    });

    window.on('closed', () => {
        if (windows.about === window) {
            windows.about = undefined;
        }
    });

    return window;
};

const createPrivacyWindow = () => {
    const window = new BrowserWindow({
        title: 'ClipCC Privacy Policy',
        width: 600,
        height: 800,
        parent: windows.main,
        show: false,
        autoHideMenuBar: true,
        useContentSize: true,
        webPreferences: {
            preload: path.resolve(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false
        }
    });

    window.webContents.setWindowOpenHandler(({url}) => {
        shell.openExternal(url);
        return {action: 'deny'};
    });

    loadRendererRoute(window, 'privacy');

    window.on('close', event => {
        event.preventDefault();
        window.hide();
    });

    window.on('closed', () => {
        if (windows.about === window) {
            windows.about = undefined;
        }
    });

    return window;
};

const createLoadingWindow = () => {
    const window = new BrowserWindow({
        width: 300,
        height: 300,
        frame: false,
        resizable: false,
        show: false,
        titleBarStyle: 'hiddenInset',
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.resolve(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false
        }
    });

    const loadingFilePath = path.resolve(__dirname, '..', 'renderer', 'loading.html');
    window.loadFile(loadingFilePath);

    window.on('closed', () => {
        if (windows.loading === window) {
            windows.loading = undefined;
        }
    });

    return window;
};

const ensureMainWindow = () => {
    if (windows.main?.isDestroyed()) {
        windows.main = undefined;
    }
    if (!windows.main) {
        windows.main = createMainWindow();
    }
    return windows.main;
};

const ensureAboutWindow = () => {
    if (windows.about?.isDestroyed()) {
        windows.about = undefined;
    }
    if (!windows.about) {
        windows.about = createAboutWindow();
    }
    return windows.about;
};

const ensurePrivacyWindow = () => {
    if (windows.privacy?.isDestroyed()) {
        windows.privacy = undefined;
    }
    if (!windows.privacy) {
        windows.privacy = createPrivacyWindow();
    }
    return windows.privacy;
};

const ensureLoadingWindow = () => {
    if (windows.loading?.isDestroyed()) {
        windows.loading = undefined;
    }
    if (!windows.loading) {
        windows.loading = createLoadingWindow();
    }
    return windows.loading;
};

app.whenReady().then(() => {
    ensureLoadingWindow();
    ensureMainWindow();
    ensureAboutWindow();
    ensurePrivacyWindow();

    app.on('activate', () => {
        ensureMainWindow();
    });
});

ipcMain.on('open-about-window', () => {
    ensureAboutWindow().show();
});

ipcMain.on('open-privacy-window', () => {
    ensurePrivacyWindow().show();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
