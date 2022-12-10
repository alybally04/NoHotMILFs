const {PythonShell} = require('python-shell')


function search() {
    lookupVideo().then(
        function (value) {UIController(value)}
    )
}


function UIController(videoInfo) {
    console.log(videoInfo)
    // const videoDetails = document.querySelector('#video-details');

    // videoDetails.querySelector("img, div").style.display = 'none';
}
search()

async function lookupVideo() {
    let options = {
    mode: 'json',
    pythonPath: ((process.platform === 'win32') ? 'venv\\Scripts\\python.exe' : 'venv/bin/python'),
    // Get print results in real-time
    pythonOptions: ['-u'],
    // Path to directory of script
    scriptPath: '',
    args: ['lookup_video', 'https://www.youtube.com/watch?v=C2J5sJ7Z5yE']
    };

    const pyshell = await PythonShell.run('core.py', options, function (err, results) {
        if (err) throw err;
        // results is an array consisting of messages collected during execution
    });


    pyshell.on('message', function (message) {
      // received a message sent from the Python script (a simple "print" statement)
      return message
    });
}
