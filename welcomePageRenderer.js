const {ipcRenderer} = require('electron');
const storage = require('electron-json-storage');
const path = require('path');


function closeWelcome() {
    storage.setDataPath(path.join(__dirname, '..'));
    console.log(storage.getDataPath())
    ipcRenderer.send ("enable-main-window");
    window.close();
}
