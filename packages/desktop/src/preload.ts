// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { MessageBoxOptions, contextBridge, ipcRenderer } from 'electron';


contextBridge.exposeInMainWorld('apps', {
    getInfo: () => ipcRenderer.invoke('app:get-app-info'),
    getVersion: () => ipcRenderer.invoke('app:get-version')
})


contextBridge.exposeInMainWorld('dialog', {
    showDialog: (options: MessageBoxOptions) => ipcRenderer.invoke('dialog:show', options)
})

contextBridge.exposeInMainWorld('gui', {
    getInitialFile: () => ipcRenderer.invoke('gui:get-initial-file'),
    openAbout: () => ipcRenderer.invoke('gui:open-about'),
})

contextBridge.exposeInMainWorld('process', {
    env: {}
})

contextBridge.exposeInMainWorld('debug', {
    process: () => ipcRenderer.invoke('debug:get-argv'),
})