const {PythonShell} = require('python-shell')
const { app } = require('electron');

let options = {
    mode: 'text',
    pythonPath: ((process.platform === 'win32') ? 'venv\\Scripts\\python.exe' : 'venv/bin/python'),
    pythonOptions: ['-u'], // get print results in real-time
    scriptPath: '', //Path to directory of script
    args: []
};

const pyshell = PythonShell.run('app.py', options, function (err, results) {
    if (err) throw err;
    // results is an array consisting of messages collected during execution
    console.log('results: %j', results);
});


