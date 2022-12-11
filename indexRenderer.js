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
        document.querySelector('#formats-table').style.visibility = 'visible';

        if (parsedMessage.hasOwnProperty('error')) {

            document.querySelector('#video-details h3').innerHTML = 'An error has occurred!';
            document.querySelector('#video-details img').src = '../assets/images/imageUnavailable.png';

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

            // Generating formats table
            // const table = document.querySelector('#formats-table table')
            // const tablebody = document.querySelector('#formats-table tbody')

            const table = document.createElement("table");
            const tablebody = document.createElement("tbody");

            for (let count = 0; count < formats.length; count++) {
                const row = document.createElement('tr');

                for (let i = 0; i < 4; i++) {
                    const cell = document.createElement('td');

                    if (i === 0) {
                        const cellData = document.createTextNode(formats[count].fileType);

                    } else if (i === 1) {
                        const cellData = document.createTextNode(formats[count].quality);

                    } else if (i === 2) {
                        const cellData = document.createTextNode(formats[count].fileSize);

                    } else {
                        const cellData = document.createElement('input');
                        cellData.type = 'button';
                        cellData.value = 'Download';
                        // cellData.onclick = '';
                    }

                    cell.appendChild(cellData)
                    row.appendChild(cell)
                }
                tablebody.appendChild(row)
            }
            table.appendChild(tablebody)
            document.body.appendChild(table);
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
