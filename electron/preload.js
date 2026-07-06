import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  startMatchSimulation: (playerName) =>
    ipcRenderer.invoke('start-match-simulation', playerName),
  getApiData: (endpoint) => ipcRenderer.invoke('get-api-data', endpoint),
  onMatchEvent: (callback) =>
    ipcRenderer.on('match-event', (event, data) => callback(data)),
  captureScreen: () => ipcRenderer.invoke('capture-screen'),
  analyzeScreen: () => ipcRenderer.invoke('analyze-screen'),
  createOverlay: (displayIndex) => ipcRenderer.invoke('create-overlay', displayIndex),
  listDisplays: () => ipcRenderer.invoke('list-displays'),
  getGameDisplay: () => ipcRenderer.invoke('get-game-display'),
  startLiveCapture: (interval) => ipcRenderer.invoke('start-live-capture', interval),
  stopLiveCapture: () => ipcRenderer.invoke('stop-live-capture'),
  onGameStateUpdate: (callback) =>
    ipcRenderer.on('game-state-update', (event, data) => callback(data)),
});
