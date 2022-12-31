const {ipcRenderer} = require('electron');


window.addEventListener("beforeunload", (event) => {
    if (document.querySelector('#disable-welcome').checked === true) {
        ipcRenderer.send("disableWelcome");
    }
});
