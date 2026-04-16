import {
    BrowserWindow,
    type BrowserWindowConstructorOptions,
    dialog,
    shell,
    systemPreferences
} from 'electron';
import path from 'path';
import {pathToFileURL} from 'url';

type WindowName = 'main' | 'about' | 'privacy' | 'loading';

const windows: Partial<Record<WindowName, BrowserWindow>> = {};

const defaultWebPreferences: BrowserWindowConstructorOptions['webPreferences'] = {
    preload: path.resolve(__dirname, 'preload.js'),
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: false
};

const devToolKey = ((process.platform === 'darwin') ?
    { // macOS: command+option+i
        alt: true, // option
        control: false,
        meta: true, // command
        shift: false,
        code: 'KeyI'
    } : { // Windows: control+shift+i
        alt: false,
        control: true,
        meta: false, // Windows key
        shift: true,
        code: 'KeyI'
    }
);

const displayPermissionDeniedWarning = (window: BrowserWindow, permissionType: 'camera' | 'microphone') => {
    let title = 'Permission Denied';
    let message = 'A permission has been denied.';

    if (permissionType === 'camera') {
        title = 'Camera Permission Denied';
        message = 'Permission to use the camera has been denied. ClipCC will not be able to use video sensing.';
    } else if (permissionType === 'microphone') {
        title = 'Microphone Permission Denied';
        message = (
            'Permission to use the microphone has been denied. ClipCC will not be able to record sounds ' +
            'or detect loudness.'
        );
    }

    const instructions = (process.platform === 'darwin') ?
        'To change ClipCC permissions, please check "Privacy & Security" in System Settings.' :
        'To change ClipCC permissions, please check your system settings and restart ClipCC.';

    void dialog.showMessageBox(window, {
        type: 'warning',
        title,
        message: `${message}\n\n${instructions}`
    });
};

const askForMediaAccess = (mediaType: 'microphone' | 'camera') => {
    if (systemPreferences.askForMediaAccess) {
        return systemPreferences.askForMediaAccess(mediaType);
    }
    return true;
};

const getAllowedRequestingUrlBase = () => {
    if (process.env.ELECTRON_WEBPACK_WDS_PORT) {
        return `http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}/`;
    }

    const rendererDirPath = `${path.resolve(__dirname, '..', 'renderer')}${path.sep}`;
    return pathToFileURL(rendererDirPath).toString();
};

const handlePermissionRequest = async (
    webContents: Electron.WebContents,
    permission: string,
    callback: (isAllowed: boolean) => void,
    details: Electron.PermissionRequest
) => {
    if (webContents !== windows.main?.webContents) {
        callback(false);
        return;
    }

    if (!details.isMainFrame) {
        callback(false);
        return;
    }

    if (permission !== 'media') {
        callback(false);
        return;
    }

    const requiredBase = getAllowedRequestingUrlBase();
    if (!details.requestingUrl.startsWith(requiredBase)) {
        callback(false);
        return;
    }

    let askForMicrophone = false;
    let askForCamera = false;
    const mediaTypes = (details as Electron.PermissionRequest & {mediaTypes?: string[]}).mediaTypes ?? [];

    for (const mediaType of mediaTypes) {
        if (mediaType === 'audio') {
            askForMicrophone = true;
            continue;
        }
        if (mediaType === 'video') {
            askForCamera = true;
            continue;
        }

        callback(false);
        return;
    }

    const parentWindow = windows.main;

    if (askForMicrophone) {
        const microphoneResult = await askForMediaAccess('microphone');
        if (!microphoneResult) {
            if (parentWindow) {
                displayPermissionDeniedWarning(parentWindow, 'microphone');
            }
            callback(false);
            return;
        }
    }

    if (askForCamera) {
        const cameraResult = await askForMediaAccess('camera');
        if (!cameraResult) {
            if (parentWindow) {
                displayPermissionDeniedWarning(parentWindow, 'camera');
            }
            callback(false);
            return;
        }
    }

    callback(true);
};

export const createWindow = ({
    webPreferences,
    ...options
}: BrowserWindowConstructorOptions) => {
    const window = new BrowserWindow({
        autoHideMenuBar: true,
        ...options,
        webPreferences: {
            ...defaultWebPreferences,
            ...webPreferences
        }
    });

    window.webContents.setWindowOpenHandler(({url}) => {
        shell.openExternal(url);
        return {action: 'deny'};
    });

    window.webContents.session.setPermissionRequestHandler(handlePermissionRequest);

    window.webContents.on('before-input-event', (event, input) => {
        if (input.code === devToolKey.code &&
            input.alt === devToolKey.alt &&
            input.control === devToolKey.control &&
            input.meta === devToolKey.meta &&
            input.shift === devToolKey.shift &&
            input.type === 'keyDown' &&
            !input.isAutoRepeat &&
            !input.isComposing) {
            event.preventDefault();
            window.webContents.openDevTools({mode: 'detach', activate: true});
        }
    });

    window.once('ready-to-show', () => {
        window.webContents.send('ready-to-show');
    });

    return window;
};

const loadRendererRoute = (window: BrowserWindow, route = 'app') => {
    if (!process.env.ELECTRON_WEBPACK_WDS_PORT) {
        return window.loadFile(path.resolve(__dirname, '..', 'renderer', 'index.html'), {
            query: {
                route
            }
        });
    }
    const devServerUrl = `http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}/`;

    const rendererUrl = new URL(devServerUrl);
    rendererUrl.searchParams.set('route', route);

    return window.loadURL(rendererUrl.toString());
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
    });

    window.webContents.once('did-finish-load', () => {
        windows.loading?.close();
        window.show();
    });

    window.webContents.on('will-prevent-unload', ev => {
        const choice = dialog.showMessageBoxSync(window, {
            type: 'question',
            message: 'Leave ClipCC?',
            detail: 'Any unsaved changes will be lost.',
            buttons: ['Stay', 'Leave'],
            cancelId: 0, // closing the dialog means "stay"
            defaultId: 0 // pressing enter or space without explicitly selecting something means "stay"
        });
        const shouldQuit = (choice === 1);
        if (shouldQuit) {
            ev.preventDefault();
        }
    });

    window.on('closed', () => {
        if (windows.main === window) {
            delete windows.main;
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
            delete windows.about;
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
            delete windows.privacy;
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
        titleBarStyle: 'hiddenInset'
    });

    if (process.env.ELECTRON_WEBPACK_WDS_PORT) {
        const loadingUrl = new URL(`http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}/loading.html`);
        window.loadURL(loadingUrl.toString());
    } else {
        const loadingFilePath = path.resolve(__dirname, '..', 'renderer', 'loading.html');
        window.loadFile(loadingFilePath);
    }

    window.on('closed', () => {
        if (windows.loading === window) {
            delete windows.loading;
        }
    });

    return window;
};

const ensureWindow = (name: WindowName) => {
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

export const openAboutWindow = () => {
    ensureWindow('about').show();
};

export const openPrivacyWindow = () => {
    ensureWindow('privacy').show();
};
