export interface IWindowGUIApi {
    getInitialFile: () => Promise<object>,
}

export interface IWindowAppsApi {
    getInfo: () => Promise<object>,
}

declare global {
    interface Window {
        gui: IWindowGUIApi
        apps: IWindowAppsApi
    }
}