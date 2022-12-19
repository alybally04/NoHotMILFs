const {ipcRenderer} = require('electron');


function closeWelcome() {
    ipcRenderer.send ("enable-main-window");
    window.close();
}
