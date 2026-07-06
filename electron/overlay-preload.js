import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('overlayAPI', {
  onGameStateUpdate: (callback) => {
    ipcRenderer.on('overlay-update', callback);
  },
  removeGameStateListener: () => {
    ipcRenderer.removeAllListeners('overlay-update');
  },
});
