const { app, BrowserWindow, ipcMain, Menu, Tray, screen } = require('electron');
const path = require('path');
const { spawn, execSync } = require('child_process');

let mainWindow;
let tray;
let pythonHelper;
let isLocked = false;

const REGISTRY_KEY = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run';
const APP_NAME = 'ProductiveDashboard';

function isAutoStartEnabled() {
  try {
    const result = execSync(`reg query "${REGISTRY_KEY}" /v "${APP_NAME}" 2>nul`, { encoding: 'utf8' });
    return result.includes(APP_NAME);
  } catch {
    return false;
  }
}

function setAutoStart(enable) {
  try {
    if (enable) {
      const exePath = app.getPath('exe');
      execSync(`reg add "${REGISTRY_KEY}" /v "${APP_NAME}" /t REG_SZ /d "${exePath}" /f`, { stdio: 'pipe' });
    } else {
      execSync(`reg delete "${REGISTRY_KEY}" /v "${APP_NAME}" /f`, { stdio: 'pipe' });
    }
    return true;
  } catch (err) {
    console.error('[AutoStart] Error:', err.message);
    return false;
  }
}

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.bounds;

  console.log(`[createWindow] Display: ${width}x${height}`);

  mainWindow = new BrowserWindow({
    width: width,
    height: height,
    x: 0,
    y: 0,
    frame: false,
    transparent: true,
    resizable: false,
    movable: false,
    hasShadow: false,
    skipTaskbar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: true
    }
  });

  console.log('[createWindow] BrowserWindow created');

  // Load renderer
  const isDev = !app.isPackaged;
  if (isDev) {
    const candidatePorts = [5173, 5174, 5175, 5176, 5177];
    const base = process.env.VITE_DEV_SERVER_URL ? new URL(process.env.VITE_DEV_SERVER_URL).origin : null;
    const devOrigins = base ? [base] : [];
    const tryUrls = devOrigins.concat(candidatePorts.map(p => `http://localhost:${p}/`));

    const tryNext = (i) => {
      const url = tryUrls[i];
      if (!url) {
        console.error('No Vite dev server found');
        return;
      }
      console.log('[createWindow] Loading URL:', url);
      mainWindow.loadURL(url);
    };
    tryNext(0);
  } else {
    const filePath = path.join(__dirname, 'index.html');
    console.log('[createWindow] Loading file:', filePath);
    mainWindow.loadFile(filePath);
  }

  // Log load success/failure
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('[createWindow] Renderer loaded successfully');
    console.log('[createWindow] Window bounds:', mainWindow.getBounds());
    console.log('[createWindow] isVisible:', mainWindow.isVisible());
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('[createWindow] Renderer FAILED:', errorCode, errorDescription);
  });

  // Prevent close — hide to tray instead
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
    return false;
  });

  // When window is ready — show and pin to desktop
  mainWindow.once('ready-to-show', () => {
    console.log('[createWindow] ready-to-show fired');

    // Show the window
    mainWindow.show();
    mainWindow.focus();
    console.log('[createWindow] After show() — isVisible:', mainWindow.isVisible());
    console.log('[createWindow] Bounds:', mainWindow.getBounds());

    // Pin behind desktop icons using Python helper
    pinToDesktop();
  });
}

function pinToDesktop() {
  const hwndBuffer = mainWindow.getNativeWindowHandle();
  const hwndDecimal = process.arch === 'x64'
    ? hwndBuffer.readBigInt64LE().toString()
    : hwndBuffer.readInt32LE().toString();

  console.log(`[pinToDesktop] HWND: ${hwndDecimal}`);

  // Try to find python in PATH
  let pythonCmd = 'python';
  try {
    execSync('where python', { stdio: 'pipe' });
    console.log('[pinToDesktop] Found python in PATH');
  } catch {
    try {
      execSync('where python3', { stdio: 'pipe' });
      pythonCmd = 'python3';
      console.log('[pinToDesktop] Found python3 in PATH');
    } catch {
      console.warn('[pinToDesktop] Python not found in PATH — skipping desktop pinning');
      return;
    }
  }

  const helperPath = path.join(__dirname, 'scripts', 'window_helper.py');
  console.log('[pinToDesktop] Helper path:', helperPath);

  try {
    pythonHelper = spawn(pythonCmd, [helperPath, hwndDecimal]);

    pythonHelper.stdout.on('data', (data) => {
      console.log(`[Python Helper]: ${data}`);
    });

    pythonHelper.stderr.on('data', (data) => {
      console.error(`[Python Helper Error]: ${data}`);
    });

    pythonHelper.on('error', (err) => {
      console.error('[pinToDesktop] Failed to start python:', err.message);
    });

    pythonHelper.on('close', (code) => {
      console.log(`[pinToDesktop] Python helper exited with code ${code}`);
    });
  } catch (err) {
    console.error('[pinToDesktop] Spawn error:', err.message);
  }
}

// Setup System Tray
function createTray() {
  const iconPath = path.join(__dirname, 'assets', 'icon.ico');
  console.log('[createTray] Icon path:', iconPath);
  tray = new Tray(iconPath);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Productive Dashboard',
      enabled: false
    },
    { type: 'separator' },
    {
      label: 'Show Dashboard',
      click: () => {
        console.log('[Tray] Show Dashboard');
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    {
      label: 'Hide Dashboard',
      click: () => {
        console.log('[Tray] Hide Dashboard');
        if (mainWindow) {
          mainWindow.hide();
        }
      }
    },
    {
      label: 'Lock/Unlock Interaction',
      type: 'checkbox',
      checked: isLocked,
      click: (menuItem) => {
        console.log('[Tray] Lock/Unlock:', menuItem.checked);
        isLocked = menuItem.checked;
        if (mainWindow) {
          mainWindow.setIgnoreMouseEvents(!isLocked ? true : true, { forward: !isLocked });
        }
      }
    },
    {
      label: 'Refresh',
      click: () => {
        console.log('[Tray] Refresh');
        if (mainWindow) {
          mainWindow.reload();
        }
      }
    },
    {
      label: 'Start on Boot',
      type: 'checkbox',
      checked: isAutoStartEnabled(),
      click: (menuItem) => {
        console.log('[Tray] Start on Boot:', menuItem.checked);
        setAutoStart(menuItem.checked);
      }
    },
    {
      label: 'Clear All Data',
      click: () => {
        const { dialog } = require('electron');
        dialog.showMessageBox(mainWindow, {
          type: 'warning',
          title: 'Clear All Data',
          message: 'This will delete all tasks, notes, history, and scores. This cannot be undone.',
          buttons: ['Cancel', 'Clear All'],
          defaultId: 0,
          cancelId: 0
        }).then(({ response }) => {
          if (response === 1) {
            mainWindow.webContents.send('clear-all-data');
          }
        });
      }
    },
    { type: 'separator' },
    {
      label: 'Exit',
      click: () => {
        console.log('[Tray] Exit');
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip('Productive Wallpaper Dashboard');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    console.log('[Tray] Click toggle');
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });
}

// Initialize
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    console.log('[app] whenReady');
    createWindow();
    createTray();
  });
}

// IPC Handlers
ipcMain.on('set-ignore-mouse-events', (event, ignore, options) => {
  if (isLocked && !ignore) return;
  if (mainWindow) {
    mainWindow.setIgnoreMouseEvents(ignore, options);
  }
});

ipcMain.on('set-focusable', (event, focusable) => {
  if (mainWindow) {
    mainWindow.setFocusable(focusable);
    if (focusable) {
      mainWindow.focus();
    } else {
      mainWindow.blur();
    }
  }
});

ipcMain.on('open-path', (event, targetPath) => {
  const { shell } = require('electron');
  if (targetPath) {
    shell.openPath(targetPath);
  }
});

// Cleanup
app.on('will-quit', () => {
  if (pythonHelper) {
    pythonHelper.kill();
  }
});
