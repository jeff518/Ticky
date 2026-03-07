const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let backendProcess = null;

function createBackend() {
  const backendPath = path.join(__dirname, '../backend');
  backendProcess = spawn('node', ['server.js'], {
    cwd: backendPath,
    stdio: 'inherit',
    shell: true
  });
  backendProcess.on('error', (err) => console.error('Backend error:', err));
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    // icon: path.join(__dirname, '../frontend/public/favicon.ico')
  });

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  
  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, '../frontend/dist/index.html'));
  }
}

app.whenReady().then(() => {
  createBackend();
  setTimeout(createWindow, 2000); // Wait for backend to start
});

app.on('window-all-closed', () => {
  if (backendProcess) backendProcess.kill();
  app.quit();
});
