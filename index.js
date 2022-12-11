const { app, BrowserWindow } = require('electron');


const createWindow = () => {
  const win = new BrowserWindow({
    width: 1000,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      // Allows page renderers to access node js (ONLY do this in offline app!)
      nodeIntegration: true,
      contextIsolation: false,
    }
  });

  win.loadFile('pageFiles/index.html');
  win.removeMenu();
  win.webContents.openDevTools()
}


app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});


app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
