const { app, BrowserWindow } = require('electron');
// const electron = require("electron");


const createWindow = () => {
  const win = new BrowserWindow({
    width: 1000,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: ((process.platform === 'darwin') ? __dirname + '/assets/icons/icon.icns' : __dirname + '/assets/icons/icon.ico')
  });

  /*
  if (process.platform === 'darwin') {
    const icon = electron.nativeImage.createFromPath(app.getAppPath() + "/assets/icons/icon.icns")
    app.dock.setIcon(icon)
  }
  */

  win.loadFile('index.html');
  win.removeMenu();
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
