const { app, BrowserWindow } = require('electron');
const electron = require("electron");

if (process.platform === 'darwin') {
  const icon = electron.nativeImage.createFromPath(app.getAppPath() + "/assets/icons/icon.icns")
  app.dock.setIcon(icon)

} else {
  app.win.setIcon(__dirname + 'assets/icons/icon.ico')
}

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1000,
    height: 800,
    minWidth: 800,
    minHeight: 600,
  });

  win.loadFile('index.html');
};

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
