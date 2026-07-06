import { app, BrowserWindow, ipcMain, screen, desktopCapturer } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import axios from 'axios';
import { performanceManager } from './performance.js';
import { getOptimizedConfig, displayDetection } from './overlay-config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let overlayWindow;
let serverProcess;
let captureInterval;
const API_URL = 'http://localhost:3000/api';

// Multi-monitor tracking
let gameDisplay = null;
let overlayDisplays = [];

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
    },
  });

  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

async function findGameDisplay() {
  try {
    // Try to detect Dead by Daylight window
    const displays = screen.getAllDisplays();

    // For now, use primary display as game display
    // TODO: Implement native module to detect game window location
    gameDisplay = displays[0];
    return gameDisplay;
  } catch (error) {
    console.error('Error finding game display:', error);
    return screen.getPrimaryDisplay();
  }
}

async function createOverlay(displayIndex = 0) {
  if (overlayWindow && !overlayWindow.isDestroyed()) return;

  const displays = screen.getAllDisplays();
  const targetDisplay = displays[displayIndex] || displays[0];

  if (!gameDisplay) {
    gameDisplay = await findGameDisplay();
  }

  const { x, y, width, height } = targetDisplay.bounds;

  overlayWindow = new BrowserWindow({
    width,
    height,
    x,
    y,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable: false,
    hasShadow: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'overlay-preload.js'),
    },
  });

  // Performance optimizations
  overlayWindow.webContents.setBackgroundThrottling(false);
  overlayWindow.setIgnoreMouseEvents(true);

  overlayWindow.loadFile(path.join(__dirname, 'overlay.html'));

  console.log(`Overlay created on display ${displayIndex} (${width}x${height} at ${x},${y})`);
}

function startBackendServer() {
  serverProcess = spawn('node', ['server.js'], {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
  });

  serverProcess.on('error', (err) => {
    console.error('Failed to start backend:', err);
  });
}

app.on('ready', () => {
  // Detect system specs and apply optimizations
  const setup = process.env.DAILITE_SETUP || 'standard'; // Set via env or detect
  const config = getOptimizedConfig(setup);
  console.log(`🎮 DAILITE Overlay - Setup: ${setup.toUpperCase()}`);
  performanceManager.applyOptimizations(config.performance);

  startBackendServer();
  setTimeout(() => createWindow(), 2000);
});

app.on('will-quit', () => {
  performanceManager.restoreDefaults();
});

app.on('window-all-closed', () => {
  if (serverProcess) serverProcess.kill();
  if (process.platform !== 'darwin') app.quit();
});

async function captureScreen() {
  try {
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width: 1920, height: 1080 },
    });

    if (!sources.length) {
      throw new Error('No screen sources found');
    }

    return sources[0].thumbnail;
  } catch (error) {
    console.error('Screen capture error:', error);
    return null;
  }
}

async function analyzeScreen() {
  try {
    const thumbnail = await captureScreen();
    if (!thumbnail) return null;

    const buffer = thumbnail.toPNG();
    const base64 = buffer.toString('base64');

    const formData = new FormData();
    formData.append('screenshot', new Blob([buffer], { type: 'image/png' }), 'screenshot.png');

    const response = await axios.post(`${API_URL}/ocr/analyze`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response.data.gameState;
  } catch (error) {
    console.error('Screen analysis error:', error);
    return null;
  }
}

function startLiveCapture(interval = 1000) {
  if (captureInterval) clearInterval(captureInterval);

  captureInterval = setInterval(async () => {
    const gameState = await analyzeScreen();
    if (gameState && mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('game-state-update', gameState);
    }
    if (gameState && overlayWindow && !overlayWindow.isDestroyed()) {
      overlayWindow.webContents.send('overlay-update', gameState);
    }
  }, interval);
}

function stopLiveCapture() {
  if (captureInterval) {
    clearInterval(captureInterval);
    captureInterval = null;
  }
}

// IPC handlers for match simulation
ipcMain.handle('start-match-simulation', async (event, playerName) => {
  return { status: 'started', playerName };
});

ipcMain.handle('get-api-data', async (event, endpoint) => {
  try {
    const response = await fetch(`http://localhost:3000${endpoint}`);
    return await response.json();
  } catch (err) {
    console.error('API Error:', err);
    return null;
  }
});

ipcMain.handle('capture-screen', captureScreen);
ipcMain.handle('analyze-screen', analyzeScreen);
ipcMain.handle('create-overlay', (event, displayIndex) => {
  createOverlay(displayIndex || 0);
  return { status: 'overlay_created' };
});
ipcMain.handle('list-displays', () => {
  const displays = screen.getAllDisplays();
  return displays.map((d, i) => ({
    index: i,
    id: d.id,
    bounds: d.bounds,
    workArea: d.workAreaSize,
    scaleFactor: d.scaleFactor,
    isPrimary: d.bounds.x === 0 && d.bounds.y === 0,
  }));
});
ipcMain.handle('get-game-display', async () => {
  const display = await findGameDisplay();
  return {
    bounds: display.bounds,
    workArea: display.workAreaSize,
    scaleFactor: display.scaleFactor,
  };
});
ipcMain.handle('start-live-capture', (event, interval) => {
  startLiveCapture(interval);
  return { status: 'capturing' };
});
ipcMain.handle('stop-live-capture', () => {
  stopLiveCapture();
  return { status: 'stopped' };
});
