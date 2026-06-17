const { app, BrowserWindow, ipcMain, Menu, Tray, screen } = require('electron');
const path = require('path');
const { spawn, exec } = require('child_process');

let mainWindow;
let tray;
let pythonHelper;
let isLocked = false; // Whether the user locked interaction completely (always click-through)

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.bounds;

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
    focusable: false, // Start non-focusable so it behaves as background
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: true
    }
  });


  // Load React renderer from Vite dev server during development
  const isDev = !app.isPackaged;
  if (isDev) {
    const candidatePorts = [5173, 5174, 5175, 5176, 5177];
    const base = process.env.VITE_DEV_SERVER_URL ? new URL(process.env.VITE_DEV_SERVER_URL).origin : null;
    const devOrigins = base ? [base] : [];

    const tryUrls = devOrigins.concat(candidatePorts.map(p => `http://localhost:${p}/`));

    const tryNext = (i) => {
      const url = tryUrls[i];
      if (!url) {
        console.error('No Vite dev server found in candidate ports:', candidatePorts);
        return;
      }
      mainWindow.loadURL(url);
      console.log('Loading renderer URL:', url);
    };

    tryNext(0);
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'renderer', 'renderer', 'index.html'));
  }

  // Prevent window from being closed unless explicitly exiting the app
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
    return false;
  });

  // Handle Win+D show-desktop minimize
  mainWindow.on('minimize', (event) => {
    event.preventDefault();
    setTimeout(() => {
      if (mainWindow) {
        mainWindow.restore();
        mainWindow.blur();
      }
    }, 150);
  });

  // Wait until window is ready and then pin it using the python helper
  mainWindow.once('ready-to-show', () => {
    mainWindow.showInactive();
    mainWindow.blur();

    mainWindow.setIgnoreMouseEvents(true, { forward: true });

    const hwndBuffer = mainWindow.getNativeWindowHandle();
    const hwndDecimal = process.arch === 'x64'
      ? hwndBuffer.readBigInt64LE().toString()
      : hwndBuffer.readInt32LE().toString();

    console.log(`Electron HWND: ${hwndDecimal}`);

    const helperPath = path.join(__dirname, 'scripts', 'window_helper.py');
    pythonHelper = spawn('python', [helperPath, hwndDecimal]);

    pythonHelper.stdout.on('data', (data) => {
      console.log(`[Python Helper]: ${data}`);
    });

    pythonHelper.stderr.on('data', (data) => {
      console.error(`[Python Helper Error]: ${data}`);
    });
  });
}

// Setup System Tray

function createTray() {
  const iconPath = path.join(__dirname, 'assets', 'icon.ico');
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
        console.log('clicked: Show Dashboard, mainWindow:', !!mainWindow);
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    {
      label: 'Hide Dashboard',
      click: () => {
        console.log('clicked: Hide Dashboard, mainWindow:', !!mainWindow);
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
        console.log('clicked: Lock/Unlock, checked:', menuItem.checked);
        isLocked = menuItem.checked;
        if (mainWindow) {
          if (isLocked) {
            mainWindow.setIgnoreMouseEvents(true);
          } else {
            mainWindow.setIgnoreMouseEvents(true, { forward: true });
          }
        }
      }
    },
    {
      label: 'Refresh',
      click: () => {
        console.log('clicked: Refresh, mainWindow:', !!mainWindow);
        if (mainWindow) {
          mainWindow.reload();
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Exit',
      click: () => {
        console.log('clicked: Exit');
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip('Productive Wallpaper Dashboard');
  tray.setContextMenu(contextMenu);

  // Single click toggles show/hide
  tray.on('click', () => {
    console.log('tray clicked, mainWindow:', !!mainWindow);
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

// Initialize Single Instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.showInactive();
      mainWindow.blur();
    }
  });

  app.whenReady().then(() => {
    createWindow();
    createTray();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}

// IPC Handlers
ipcMain.on('set-ignore-mouse-events', (event, ignore, options) => {
  if (isLocked && !ignore) {
    // If locked, reject enabling mouse interaction
    return;
  }
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

// Cleanup processes on exit
app.on('will-quit', () => {
  if (pythonHelper) {
    pythonHelper.kill();
  }
});
