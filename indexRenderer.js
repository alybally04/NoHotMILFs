const {PythonShell} = require('python-shell')


function lookupVideo() {
    const url_input = document.querySelector('#input-field').value

    let options = {
    mode: 'text',
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
        let parsedMessage = JSON.parse(message);

        document.querySelector('#video-details').style.visibility = 'visible';
        if (parsedMessage.hasOwnProperty('error')) {
            document.querySelector('#video-details h3').innerHTML = 'An error has occurred!';
            const videoDetails = document.querySelectorAll('#video-details li')

            videoDetails[0].innerHTML = '';
            videoDetails[1].innerHTML = 'Please ensure the URL was entered correctly and try again';
            videoDetails[2].innerHTML = '';
        } else {
            let videoInfo = parsedMessage.videoInfo;
            let formats = parsedMessage.formats;

            document.querySelector('#video-details h3').innerHTML = videoInfo.title;
            document.querySelector('#video-details img').src = videoInfo.thumbnail;

            const videoDetails = document.querySelectorAll('#video-details li')

            videoDetails[0].innerHTML = `Length: ${videoInfo.duration}`;
            videoDetails[1].innerHTML = `Channel: ${videoInfo.channel}`;
            videoDetails[2].innerHTML = `Upload Date: ${videoInfo.uploadDate}`;
        }
    });

    // end the input stream and allow the process to exit
    pyshell.end(function (err, code, signal) {
        if (err) throw err;
        // console.log('The exit code was: ' + code);
        // console.log('The exit signal was: ' + signal);
        // console.log('finished');
    });
}
