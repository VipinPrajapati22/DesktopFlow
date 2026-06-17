const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  setIgnoreMouseEvents: (ignore, options) => ipcRenderer.send('set-ignore-mouse-events', ignore, options),
  setFocusable: (focusable) => ipcRenderer.send('set-focusable', focusable),
  openPath: (path) => ipcRenderer.send('open-path', path)
});
