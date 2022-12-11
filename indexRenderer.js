const {PythonShell} = require('python-shell')


function lookupVideo(url_input) {
          document.querySelector('main').innerHTML = 'lol'
    let options = {
    mode: 'json',
    pythonPath: ((process.platform === 'win32') ? 'venv\\Scripts\\python.exe' : 'venv/bin/python'),
    // Get print results in real-time
    pythonOptions: ['-u'],
    // Path to directory of script
    scriptPath: '',
    args: ['lookup_video', url_input]
    };

    let pyshell = PythonShell.run('core.py', options, function (err, results) {
        if (err) throw err;
        // results is an array consisting of messages collected during execution
        // console.log('results: %j', results);
    });

    pyshell.on('message', function (message) {
      // received a message sent from the Python script (a simple "print" statement)
      console.log(message);
      let resultsList = JSON.parse(message)
      document.querySelector('main').innerHTML = '<p>' + resultsList + '</p>'

      if (message.hasOwnProperty('error')) {
          console.log('An error occurred in core.py')
      }
    });

    // end the input stream and allow the process to exit
    pyshell.end(function (err,code,signal) {
        if (err) throw err;
        // console.log('The exit code was: ' + code);
        // console.log('The exit signal was: ' + signal);
        // console.log('finished');
    });
}
