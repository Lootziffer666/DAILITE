import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  startMatchSimulation: (playerName) =>
    ipcRenderer.invoke('start-match-simulation', playerName),
  getApiData: (endpoint) => ipcRenderer.invoke('get-api-data', endpoint),
  onMatchEvent: (callback) =>
    ipcRenderer.on('match-event', (event, data) => callback(data)),
});
