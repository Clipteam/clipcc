import {BrowserWindow, type BrowserWindowConstructorOptions, shell} from 'electron';
import path from 'path';

interface CreateWindowOptions extends BrowserWindowConstructorOptions {
    openExternalLinks?: boolean;
};

const defaultWebPreferences: BrowserWindowConstructorOptions['webPreferences'] = {
    preload: path.resolve(__dirname, 'preload.js'),
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: false
};

export const createWindow = ({
    openExternalLinks = true,
    webPreferences,
    ...options
}: CreateWindowOptions) => {
    const window = new BrowserWindow({
        autoHideMenuBar: true,
        ...options,
        webPreferences: {
            ...defaultWebPreferences,
            ...webPreferences
        }
    });

    if (openExternalLinks) {
        window.webContents.setWindowOpenHandler(({url}) => {
            shell.openExternal(url);
            return {action: 'deny'};
        });
    }

    return window;
};

type WindowName = 'main' | 'about' | 'privacy' | 'loading';

const windows: Partial<Record<WindowName, BrowserWindow>> = {};

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
    const window = createWindow({
        title: 'ClipCC',
        width: 1280,
        height: 820,
        minWidth: 960,
        minHeight: 600,
        show: false
    });

    loadRendererRoute(window, 'app');

    window.once('ready-to-show', () => {
        windows.loading?.show();
        window.webContents.send('ready-to-show');
    });

    window.webContents.once('did-finish-load', () => {
        windows.loading?.close();
        window.show();
    });

    window.on('closed', () => {
        if (windows.main === window) {
            windows.main = undefined;
        }

        windows.about?.close();
        windows.privacy?.close();
        windows.loading?.close();
    });

    return window;
};

const createAboutWindow = () => {
    const window = createWindow({
        title: 'About ClipCC',
        width: 400,
        height: 400,
        parent: windows.main,
        show: false,
        useContentSize: true
    });

    loadRendererRoute(window, 'about');

    window.on('closed', () => {
        if (windows.about === window) {
            windows.about = undefined;
        }
    });

    return window;
};

const createPrivacyWindow = () => {
    const window = createWindow({
        title: 'ClipCC Privacy Policy',
        width: 600,
        height: 800,
        parent: windows.main,
        show: false,
        useContentSize: true
    });

    loadRendererRoute(window, 'privacy');

    window.on('closed', () => {
        if (windows.privacy === window) {
            windows.privacy = undefined;
        }
    });

    return window;
};

const createLoadingWindow = () => {
    const window = createWindow({
        width: 300,
        height: 300,
        frame: false,
        resizable: false,
        show: false,
        titleBarStyle: 'hiddenInset',
        openExternalLinks: false
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

const ensureWindow = (name: WindowName) => {
    const currentWindow = windows[name];
    if (currentWindow?.isDestroyed()) {
        windows[name] = undefined;
    }

    if (!windows[name]) {
        switch (name) {
        case 'main':
            windows.main = createMainWindow();
            break;
        case 'about':
            windows.about = createAboutWindow();
            break;
        case 'privacy':
            windows.privacy = createPrivacyWindow();
            break;
        case 'loading':
            windows.loading = createLoadingWindow();
            break;
        }
    }

    return windows[name]!;
};

export const initializeWindows = () => {
    ensureWindow('loading');
    ensureWindow('main');
};

export const ensureMainWindow = () => ensureWindow('main');

export const openAboutWindow = () => {
    ensureWindow('about').show();
};

export const openPrivacyWindow = () => {
    ensureWindow('privacy').show();
};
