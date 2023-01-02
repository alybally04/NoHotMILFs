const {PythonShell} = require('python-shell')
let pythonPath;

let lookupButton;
let inputField;
window.onload = function () {
    // TODO: Change this before building!
    // For when running in dev environment
    // pythonPath = ((process.platform === 'win32') ? 'venv\\Scripts\\python.exe' : 'venv/bin/python');

    // For when building distributable
    pythonPath = ((process.platform === 'win32') ?  process.resourcesPath + '\\venv\\Scripts\\python.exe' : process.resourcesPath + '/venv/bin/python')

    lookupButton = document.querySelector('#search-button');
    inputField = document.querySelector('#input-field');

    document.querySelector('#url-input').addEventListener("keypress", function(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            document.querySelector('#search-button').click();
        }
    });
}


// Disable or enable all inputs on UI
// Provide true or false as args
function disableInputs (bool) {
    lookupButton.disabled = bool;
    inputField.disabled = bool;
}


function lookupVideo() {
    disableInputs(true);

    // Removing previous video info and formats table sections and creating new ones
    const elementsToRemove = ['#video-details', '#success-message', '#formats-table', '#current-download']
    for (let i = 0; i < elementsToRemove.length; i++) {
        const currentElement = document.querySelector(elementsToRemove[i])
        if (currentElement !== null) {
            currentElement.remove();
        }
    }

    const videoInfoSection = document.createElement('section');
    videoInfoSection.id = 'video-details';

    const formatsTableSection = document.createElement('section');
    formatsTableSection.id = 'formats-table';

    const main = document.querySelector('main');

    // Adding loading icon
    const loadingIcon = document.createElement('div');
    loadingIcon.className = 'loading-icon';
    main.appendChild(loadingIcon);


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

    // TODO: Change this before building!
    // For running in dev enviroment:
    // let pyshell = PythonShell.run('core.py', options, function (err, results) {
    // For building:
    // let pyshell = PythonShell.run(((process.platform === 'win32') ? process.resourcesPath + '\\app\\core.py' : 'core.py'), options, function (err, results) {
    //     if (err) throw err;
    // });
    let pyshell = PythonShell.run(__dirname + '/core.py', options, function (err, results) {
    // let pyshell = PythonShell.run('core.py', options, function (err, results) {
        if (err) throw err;
    });

    // Receives output from python script via print statements
    pyshell.on('message', function (message) {
        const parsedMessage = JSON.parse(message);

        if (parsedMessage.hasOwnProperty('error')) {
            // Generating video information section
            const videoTitle = document.createElement('h3');
            videoTitle.appendChild(document.createTextNode('An error has occurred!'));

            const infoText = document.createElement('p')
            infoText.innerHTML = 'Please ensure the URL was entered correctly and try again';

            const videoThumbnail = document.createElement('img');
            videoThumbnail.src = '../assets/images/imageUnavailable.png';
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
            let titleText;

            if (videoInfo.title.length > 85) {
                titleText = videoInfo.title.substring(0, 80) + '...'
            } else {
                titleText = videoInfo.title
            }

            videoTitle.appendChild(document.createTextNode(titleText));

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
                        cellData.onclick = () => {downloadVideo(url_input, videoInfo.title, formats[count].formatID, formats[count].fileType, formats[count].fileSize)};
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
        loadingIcon.remove();
        disableInputs(false);
    });
}


function downloadVideo(url, title, formatId, fileType, fileSize) {
    disableInputs(true);

    if (document.querySelector('#success-message') !== null) {
        document.querySelector('#success-message').remove();
    }

    const formatsTableSection = document.querySelector('#formats-table');
    formatsTableSection.style.display = 'none';

    const currentDownloadSection = document.createElement('section');
    currentDownloadSection.id = 'current-download';

    const currentDownloadTitle = document.createElement('h3');
    currentDownloadTitle.innerHTML = `Downloading&nbsp;&nbsp;—&nbsp;&nbsp;${title}`;
    currentDownloadSection.appendChild(currentDownloadTitle);

    let downloadProgressInfo = document.createElement('p');
    // downloadProgressInfo.innerText = `Downloaded 0 ${fileSize.substring(fileSize.length - 2)} of ${fileSize}&nbsp;&nbsp;—&nbsp;&nbsp;ETA: Calculating...`;
    downloadProgressInfo.innerText = 'Beginning download...';
    currentDownloadSection.appendChild(downloadProgressInfo);

    let progressBarContainer = document.createElement('div');
    progressBarContainer.id = 'progress-bar';

    let progressBar = document.createElement('div');
    progressBar.innerText = '0%';
    progressBarContainer.appendChild(progressBar);
    currentDownloadSection.appendChild(progressBarContainer);

    const main = document.querySelector('main');
    main.appendChild(currentDownloadSection);

    let options = {
    mode: 'text',
    pythonPath: pythonPath,
    // Get print results in real-time
    pythonOptions: ['-u'],
    // Path to directory of script
    scriptPath: '',
    args: ['download_video', url, title, formatId, fileType]
    };

    let pyshell = PythonShell.run(__dirname + '/core.py', options, function (err, results) {
    // let pyshell = PythonShell.run('core.py', options, function (err, results) {
        if (err) throw err;
    });

    // Count number of downloads (First is video, then audio)
    let downloadCount = 0;
    const loadingIcon = document.createElement('div');
    loadingIcon.className = 'loading-icon';
    // received a message sent from the Python script (a simple "print" statement)s
    pyshell.on('message', function (message) {
        message = message.split('{')[0];
        message = message.split(']')[1];
        const progressPercentage = message.split('%')[0].trim();
        if (progressPercentage === '100.0') {
            downloadCount += 1;
        }

        if (downloadCount === 0) {
            document.querySelector('#current-download p').innerHTML =
                `Downloading Video&nbsp;&nbsp;—&nbsp;&nbsp;${message.substring(0, message.length - 9)}&nbsp;&nbsp;—&nbsp;&nbsp;${message.substring(message.length - 9)}`;
        } else if (downloadCount === 1) {
            document.querySelector('#current-download p').innerHTML =
                `Downloading Audio&nbsp;&nbsp;—&nbsp;&nbsp;${message.substring(0, message.length - 9)}&nbsp;&nbsp;—&nbsp;&nbsp;${message.substring(message.length - 9)}`;
        } else {
            document.querySelector('#current-download p').innerHTML = 'Exporting download...';
            progressBarContainer.remove();
            main.appendChild(loadingIcon);
        }

        progressBar.innerText = progressPercentage + '%';
        progressBar.style.width = progressPercentage + '%';
    });

    // end the input stream and allow the process to exit
    pyshell.end(function (err,code,signal) {
        if (err) throw err;
        console.log('The exit code was: ' + code);
        console.log('The exit signal was: ' + signal);
        console.log('finished');

        currentDownloadSection.remove();
        loadingIcon.remove();

        const successMessage = document.createElement('p');
        successMessage.innerText = 'Video Downloaded Successfully! - Available in your Downloads folder';
        successMessage.id = 'success-message';
        // main.appendChild(successMessage);
        main.insertBefore(successMessage, main.children[2]);

        formatsTableSection.style.display = null;
        disableInputs(false);
    });
}
