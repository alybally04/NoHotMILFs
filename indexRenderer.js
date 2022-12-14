const {PythonShell} = require('python-shell')

// Setting containers to be invisible at launch
window.onload = function() {
    document.querySelector('#loading-icon').style.display = 'none';
    document.querySelector('#video-details').style.display = 'none';
    document.querySelector('#formats-table').style.display = 'none';
};


function lookupVideo() {
    document.querySelector('#loading-icon').style.display = null;
    document.querySelector('#video-details').style.display = 'none';
    document.querySelector('#formats-table').style.display = 'none';

    const formatsTableSection = document.querySelector('#formats-table')
    formatsTableSection.innerHTML = '';

    const url_input = document.querySelector('#input-field').value

    let options = {
    mode: 'text',
    // TODO: Change this before building
    // pythonPath: ((process.platform === 'win32') ?  process.resourcesPath + '\\venv\\Scripts\\python.exe' : process.resourcesPath + '/venv/bin/python'),
    pythonPath: ((process.platform === 'win32') ? 'venv\\Scripts\\python.exe' : 'venv/bin/python'),
    // Get print results in real-time
    pythonOptions: ['-u'],
    // Path to directory of script
    scriptPath: '',
    args: ['lookup_video', url_input]
    };

    // let pyshell = PythonShell.run(__dirname + '/core.py', options, function (err, results) {
    let pyshell = PythonShell.run('core.py', options, function (err, results) {
        if (err) throw err;
        // results is an array consisting of messages collected during execution
        // console.log('results: %j', results);
    });

    pyshell.on('message', function (message) {
        // received a message sent from the Python script (a simple "print" statement)
        let parsedMessage = JSON.parse(message);
        if (parsedMessage.hasOwnProperty('error')) {

            document.querySelector('#video-details h3').innerHTML = 'An error has occurred!';
            document.querySelector('#video-details img').src = 'assets/images/imageUnavailable.png';

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
            // const tableBody = document.querySelector('#formats-table tbody')

            const table = document.createElement("table");
            const tableHead = document.createElement('thead');
            const tableBody = document.createElement("tbody");

            // Generating tableHead
            if (true) {
                const row = document.createElement('tr');

                const cell1 = document.createElement('th');
                cell1.appendChild(document.createTextNode('Format'));
                row.appendChild(cell1);

                const cell2 = document.createElement('th');
                cell2.appendChild(document.createTextNode('Quality'));
                row.appendChild(cell2);

                const cell3 = document.createElement('th');
                cell3.appendChild(document.createTextNode('Size'));
                row.appendChild(cell3);

                // No text as button column
                const cell4 = document.createElement('th');
                row.appendChild(cell4);

                tableBody.appendChild(row)
            }


            // Generating tableBody
            for (let count = 0; count < formats.length; count++) {
                const row = document.createElement('tr');

                for (let i = 0; i < 4; i++) {
                    const cell = document.createElement('td');
                    let cellData;

                    if (i === 0) {
                        cellData = document.createTextNode(formats[count].fileType);

                    } else if (i === 1) {
                        cellData = document.createTextNode(formats[count].quality);

                    } else if (i === 2) {
                        cellData = document.createTextNode(formats[count].fileSize);

                    } else {
                        cellData = document.createElement('input');
                        cellData.type = 'button';
                        cellData.value = 'Download';
                        // noinspection JSValidateTypes,JSVoidFunctionReturnValueUsed
                        // cellData.onclick = downloadVideo(url_input, videoInfo.title, formats[count].formatID, formats[count].fileType);
                        cellData.onclick = () => {downloadVideo(url_input, videoInfo.title, formats[count].formatID, formats[count].fileType)};
                    }

                    cell.appendChild(cellData)
                    row.appendChild(cell)
                }
                tableBody.appendChild(row)
            }
            table.appendChild(tableBody)
            formatsTableSection.appendChild(table);
        }
    });

    // end the input stream and allow the process to exit
    pyshell.end(function (err, code, signal) {
        if (err) throw err;
        console.log('The exit code was: ' + code);
        console.log('The exit signal was: ' + signal);
        console.log('finished');

        document.querySelector('#loading-icon').style.display = 'none';
        document.querySelector('#video-details').style.display = null;
        document.querySelector('#formats-table').style.display = null;
    });
}


function downloadVideo(url, title, format_id, file_type) {
    let options = {
    mode: 'text',
    // TODO: Change this before building
    // pythonPath: ((process.platform === 'win32') ?  process.resourcesPath + '\\venv\\Scripts\\python.exe' : process.resourcesPath + '/venv/bin/python'),
    pythonPath: ((process.platform === 'win32') ? 'venv\\Scripts\\python.exe' : 'venv/bin/python'),
    // Get print results in real-time
    pythonOptions: ['-u'],
    // Path to directory of script
    scriptPath: '',
    args: ['download_video', url, title, format_id, file_type]
    };

    // let pyshell = PythonShell.run(__dirname + '/core.py', options, function (err, results) {
    let pyshell = PythonShell.run('core.py', options, function (err, results) {
        if (err) throw err;
        // results is an array consisting of messages collected during execution
        // console.log('results: %j', results);
    });

    pyshell.on('message', function (message) {
        // received a message sent from the Python script (a simple "print" statement)
        console.log(message);
    });

    // end the input stream and allow the process to exit
    pyshell.end(function (err,code,signal) {
        if (err) throw err;
        console.log('The exit code was: ' + code);
        console.log('The exit signal was: ' + signal);
        console.log('finished');
    });
}
