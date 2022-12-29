if (require('electron-squirrel-startup')) return;
const { app, shell, BrowserWindow, ipcMain } = require('electron');
const storage = require('electron-json-storage');
const fs = require('fs')


// this should be placed at top of main.js to handle setup events quickly
if (handleSquirrelEvent()) {
  // squirrel event handled and app will exit in 1000ms, so don't do anything else
  return;
}

function handleSquirrelEvent() {
  if (process.argv.length === 1) {
    return false;
  }

  const ChildProcess = require('child_process');
  const path = require('path');

  const appFolder = path.resolve(process.execPath, '..');
  const rootAtomFolder = path.resolve(appFolder, '..');
  const updateDotExe = path.resolve(path.join(rootAtomFolder, 'Update.exe'));
  const exeName = path.basename(process.execPath);

  const spawn = function(command, args) {
    let spawnedProcess, error;

    try {
      spawnedProcess = ChildProcess.spawn(command, args, {detached: true});
    } catch (error) {}

    return spawnedProcess;
  };

  const spawnUpdate = function(args) {
    return spawn(updateDotExe, args);
  };

  const squirrelEvent = process.argv[1];
  switch (squirrelEvent) {
    case '--squirrel-install':
    case '--squirrel-updated':
      // Optionally do things such as:
      // - Add your .exe to the PATH
      // - Write to the registry for things like file associations and
      //   explorer context menus

      // Install desktop and start menu shortcuts
      spawnUpdate(['--createShortcut', exeName]);

      setTimeout(app.quit, 1000);
      return true;

    case '--squirrel-uninstall':
      // Undo anything you did in the --squirrel-install and
      // --squirrel-updated handlers

      // Remove desktop and start menu shortcuts
      spawnUpdate(['--removeShortcut', exeName]);

      setTimeout(app.quit, 1000);
      return true;

    case '--squirrel-obsolete':
      // This is called on the outgoing version of your app before
      // we update to the new version - it's the opposite of
      // --squirrel-updated

      app.quit();
      return true;
  }
}


ipcMain.on ("disableWelcome", (event) => {
  storage.setDataPath(__dirname)
  let userData;

  storage.get('userSettings', function (err, data) {
    if (err) throw err;
    userData =  data;
  });

  userData['disableWelcome'] = true;
  storage.set('userSettings', userData, function (err) {if (err) throw err;})
});


let mainWindow;
const createMainWindow = () => {
  mainWindow = new BrowserWindow({
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

  mainWindow.removeMenu();
  mainWindow.loadFile('pages/index.html')
  mainWindow.webContents.openDevTools();

  return mainWindow
}


// Create welcome window as a child of the main window
const createWelcomeWindow = () => {
  const welcomeWindow = new BrowserWindow({
    width: 600,
    height: 600,
    resizable: false,
    minimizable: false,
    fullscreenable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  welcomeWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  welcomeWindow.removeMenu();
  welcomeWindow.loadFile('pages/welcomePage.html');
  mainWindow.webContents.openDevTools();

  return welcomeWindow
}


app.whenReady().then(() => {
  storage.setDataPath(__dirname);
  let userData;

  storage.get('userSettings', function (err, data) {
    if (err) throw err;
    userData = data;
  });

  if (fs.existsSync('userSettings.json') === false) {
    console.log('gen1')
    let templateUserData = {"disableWelcome": false};
    userData = templateUserData;
    storage.set('userSettings', templateUserData, function (err) {if (err) throw err});
  }

  const mainWindow = createMainWindow();
  mainWindow.setEnabled(false)

  if (userData['disableWelcome'] === false) {
    const welcomeWindow = createWelcomeWindow();

    welcomeWindow.on('close', function() {
      mainWindow.setEnabled(true)
    })

    if (process.platform === 'win32') {
      // On macOS disabling parent window also disables child windows
      welcomeWindow.setParentWindow(mainWindow)
    }
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});


app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
