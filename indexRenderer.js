const {PythonShell} = require('python-shell')
const querystring = require("querystring");
let pythonPath;


// Setting containers to be invisible at launch
window.onload = function() {
    document.querySelector('#loading-icon').style.display = 'none';

    // TODO: Change this before building!

    // For when running in dev environment
    // pythonPath = ((process.platform === 'win32') ? 'venv\\Scripts\\python.exe' : 'venv/bin/python')
    pythonPath = ((process.platform === 'win32') ? __dirname + '\\venv\\Scripts\\python.exe' : __dirname + '/venv/bin/python')

    // For when building distributable
    // pythonPath = ((process.platform === 'win32') ?  process.resourcesPath + '\\venv\\Scripts\\python.exe' : process.resourcesPath + '/venv/bin/python')
};


function lookupVideo() {
    // Removing previous video info and formats table sections and creating new ones
    if (document.querySelector('#video-details') !== null) {
        document.querySelector('#video-details').remove();
    }

    if (document.querySelector('#formats-table') !== null) {
        document.querySelector('#formats-table').remove();
    }

    const videoInfoSection = document.createElement('section');
    videoInfoSection.id = 'video-details';

    const formatsTableSection = document.createElement('section');
    formatsTableSection.id = 'formats-table';

    // Making the loading symbol visible
    document.querySelector('#loading-icon').style.display = null;

    // Getting the user input
    const url_input = document.querySelector('#input-field').value

    let options = {
    mode: 'text',
    pythonPath: pythonPath,
    // Get print results in real-time
    pythonOptions: ['-u'],
    // Path to directory of script
    scriptPath: '',
    args: ['lookup_video', url_input]
    };

    let pyshell = PythonShell.run(__dirname + '/core.py', options, function (err, results) {
        if (err) throw err;
    });

    // Receives output from python script via print statements
    pyshell.on('message', function (message) {
        let parsedMessage = JSON.parse(message);

        if (parsedMessage.hasOwnProperty('error')) {
            // Generating video information section
            const videoTitle = document.createElement('h3');
            videoTitle.appendChild(document.createTextNode('An error has occurred!'));

            const infoText = document.createElement('p')
            infoText.innerHTML = 'Please ensure the URL was entered correctly and try again';

            const videoThumbnail = document.createElement('img');
            videoThumbnail.src = 'assets/images/imageUnavailable.png';
            videoThumbnail.alt = "Youtube video thumbnail"

            const infoDiv = document.createElement('div')
            infoDiv.appendChild(videoTitle)
            infoDiv.appendChild(infoText)

            videoInfoSection.appendChild(videoThumbnail)
            videoInfoSection.appendChild(infoDiv)

            const main = document.querySelector('main');
            main.appendChild(videoInfoSection);

        } else {
            const videoInfo = parsedMessage.videoInfo;
            const formats = parsedMessage.formats;

            // Generating video information section
            const videoTitle = document.createElement('h3');
            videoTitle.appendChild(document.createTextNode(videoInfo.title));

            const infoText = document.createElement('p')
            infoText.innerHTML = `Length: ${videoInfo.duration}<br>Channel: ${videoInfo.channel}<br>Uploaded on: ${videoInfo.uploadDate}`;

            const videoThumbnail = document.createElement('img');
            videoThumbnail.src = videoInfo.thumbnail;
            videoThumbnail.alt = "Youtube video thumbnail"

            const infoDiv = document.createElement('div')
            infoDiv.appendChild(videoTitle)
            infoDiv.appendChild(infoText)

            videoInfoSection.appendChild(videoThumbnail)
            videoInfoSection.appendChild(infoDiv)

            // Generating formats table
            const table = document.createElement("table");
            const tableHead = document.createElement('thead');
            const tableBody = document.createElement("tbody");

            // Generating tableHead
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

            tableHead.appendChild(row)

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

                    cell.appendChild(cellData);
                    row.appendChild(cell);
                }
                tableBody.appendChild(row);
            }
            table.appendChild(tableHead);
            table.appendChild(tableBody);
            formatsTableSection.appendChild(table);

            // Adding video-info and formats-table to UI
            const main = document.querySelector('main');
            main.appendChild(videoInfoSection);
            main.appendChild(formatsTableSection);
        }
    });

    // end the input stream and allow the process to exit
    pyshell.end(function (err, code, signal) {
        if (err) throw err;
        console.log('The exit code was: ' + code);
        console.log('The exit signal was: ' + signal);
        console.log('finished');

        // Removing loading icon once loading is finished
        document.querySelector('#loading-icon').style.display = 'none';
    });
}


function downloadVideo(url, title, format_id, file_type) {
    let options = {
    mode: 'text',
    pythonPath: pythonPath,
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
