if (require('electron-squirrel-startup')) return;
const { app, shell, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs')
const commandLineArguments = process.argv;


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

if (commandLineArguments.includes('--squirrel-firstrun')) {
  if (process.platform === 'win32') {
    if (fs.existsSync(process.env.APPDATA + '\\NoHotMILFs')) {
      fs.rmSync(process.env.APPDATA + '\\NoHotMILFs', {recursive: true, force: true});
    }
  } else {
    if (fs.existsSync(process.env.HOME + '/Library/Preferences/NoHotMILFs')) {
      fs.rmSync(process.env.HOME + '/Library/Preferences/NoHotMILFs', {recursive: true, force: true});
    }
  }
}

// TODO: remove old userData.json from appdatadir on install 
// On MacOS process.env.APPDATA returns undefined, which is a falsy value (is equivalent to "false")
const appDataDir = process.env.APPDATA ? process.env.APPDATA + '\\NoHotMILFs\\' : process.env.HOME + '/Library/Preferences/NoHotMILFs/'
if (fs.existsSync(appDataDir) === false) {
  fs.mkdirSync(appDataDir);
}


ipcMain.on ("disableWelcome", (event) => {
  fs.readFile(appDataDir + 'userData.json', (err, data) => {
    if (err) throw err;

    let userData = JSON.parse(data);
    userData.welcomeDisabled = true;

    fs.writeFile(appDataDir + 'userData.json', JSON.stringify(userData), (err) => {
      if (err) throw err;
    });
  });
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
  let userData;
  if (fs.existsSync(appDataDir + 'userData.json')) {
    userData = JSON.parse(fs.readFileSync(appDataDir + 'userData.json', 'utf8'));
  } else {
    userData = {welcomeDisabled: false};
    fs.writeFileSync(appDataDir + 'userData.json', JSON.stringify(userData));
  }

  const mainWindow = createMainWindow();

  if (userData.welcomeDisabled === false) {
    mainWindow.setEnabled(false)
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
