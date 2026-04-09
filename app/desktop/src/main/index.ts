import {app, BrowserWindow, shell} from 'electron';
import path from 'path';

let mainWindow: BrowserWindow | null = null;

const getRendererUrl = () => {
    const rendererUrlFromEnv = process.env.CLIPCC_DESKTOP_RENDERER_URL;
    if (!rendererUrlFromEnv) return null;

    const rendererUrl = new URL(rendererUrlFromEnv);
    if (!rendererUrl.searchParams.has('route')) {
        rendererUrl.searchParams.set('route', 'app');
    }
    return rendererUrl.toString();
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

    const rendererUrl = getRendererUrl();
    if (rendererUrl) {
        window.loadURL(rendererUrl);
    } else {
        window.loadFile(path.resolve(__dirname, '..', 'renderer', 'index.html'), {
            query: {
                route: 'app'
            }
        });
    }

    window.once('ready-to-show', () => {
        window.show();
        window.webContents.send('ready-to-show');
    });

    window.on('closed', () => {
        if (mainWindow === window) {
            mainWindow = null;
        }
    });

    return window;
};

const ensureMainWindow = () => {
    if (mainWindow?.isDestroyed()) {
        mainWindow = null;
    }
    if (!mainWindow) {
        mainWindow = createMainWindow();
    }
    return mainWindow;
};

app.whenReady().then(() => {
    ensureMainWindow();

    app.on('activate', () => {
        ensureMainWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
