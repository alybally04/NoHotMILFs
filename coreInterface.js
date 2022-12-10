const {PythonShell} = require('python-shell')

function lookupVideo() {
    document.querySelector('main').innerHTML = '<h1>nigga penis</h1>'

    let options = {
    mode: 'json',
    pythonPath: ((process.platform === 'win32') ? 'venv\\Scripts\\python.exe' : 'venv/bin/python'),
    // Get print results in real-time
    pythonOptions: ['-u'],
    // Path to directory of script
    scriptPath: '',
    args: ['lookup_video', 'https://www.youtube.com/watch?v=C2J5sJ7Z5yE']
    };

    const pyshell = PythonShell.run('core.py', options, function (err, results) {
        if (err) throw err;
        // results is an array consisting of messages collected during execution
        console.log('results: %j', results);
    });


    pyshell.on('message', function (message) {
      // received a message sent from the Python script (a simple "print" statement)
      console.log(message);
      if (message.hasOwnProperty('error')) {
          console.log('An error occurred')
      }
    });

    // end the input stream and allow the process to exit
    pyshell.end(function (err,code,signal) {
        if (err) throw err;
        console.log('The exit code was: ' + code);
        console.log('The exit signal was: ' + signal);
        console.log('finished');
    });
}

exports.lookupVideo = lookupVideo;
