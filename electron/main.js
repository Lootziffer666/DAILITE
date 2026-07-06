import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let serverProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'ui', 'index.html'));
  mainWindow.webContents.openDevTools();
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
  startBackendServer();
  setTimeout(() => createWindow(), 2000);
});

app.on('window-all-closed', () => {
  if (serverProcess) serverProcess.kill();
  if (process.platform !== 'darwin') app.quit();
});

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
