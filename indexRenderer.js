const { ipcRenderer } = require('electron');
const { exec } = require("child_process");

let lookupButton;
let inputField;
let appDir;
let OSAssetsDirPath;
let ytdlpBinaryName;
let ffmpegPath;
let downloadsPath;

window.onload = function () {
    lookupButton = document.querySelector('#search-button');
    inputField = document.querySelector('#input-field');

    document.querySelector('#url-input').addEventListener("keypress", function(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            document.querySelector('#search-button').click();
        }
    });
}

ipcRenderer.on('appDir', function (evt, message) {
    appDir = message;

    if (process.platform === 'win32') {
        OSAssetsDirPath = appDir + '\\assets\\Win';
        ytdlpBinaryName = 'yt-dlp.exe';
        ffmpegPath = appDir + '\\assets\\ffmpeg\\ffmpegWin\\bin';
        downloadsPath = '%USERPROFILE%\\Downloads';
    } else {
        OSAssetsDirPath = appDir + '/assets/Mac';
        ytdlpBinaryName = './yt-dlp';
        ffmpegPath = appDir + '/assets/Mac/ffmpeg';
        downloadsPath = '~/Downloads/';
    }
});

// Disable or enable all inputs on UI
// Provide true or false as args
function disableInputs (bool) {
    lookupButton.disabled = bool;
    inputField.disabled = bool;
}

function filesizeReadable (numberOfBytes) {
    let units;

    if (numberOfBytes < 1024) { // bytes
        units = 'Bytes';
    } else if (numberOfBytes < 1048576) { // kilobytes
        numberOfBytes /= 1024;
        units = 'KB';
    } else if (numberOfBytes < 1073741824) { // megabytes
        numberOfBytes /= 1048576;
        units = 'MB';
    } else { // gigabytes
        numberOfBytes /= 1073741824;
        units = 'GB';
    }

    // Format and return the output (Multiply by 10 and divide by 10 to keep 1 decimal place)
    return `${Math.round(numberOfBytes * 10) / 10} ${units}`;
}

function timeReadable (num) {
    let minutes = Math.floor(num / 60);
    let seconds = num % 60;

    if (minutes < 60) {
        if (seconds < 10) {
            return `${minutes}:0${seconds}`;
        } else {
            return `${minutes}:${seconds}`;
        }

    } else {
        let stringToReturn = '';
        // Adding number of hours
        stringToReturn += Math.floor(minutes / 60);

        minutes %= 60
        if (minutes < 10) {
            stringToReturn += `:0${minutes}`;
        } else {
            stringToReturn += `:${minutes}`;
        }

        if (seconds < 10) {
            stringToReturn += `:0${seconds}`;
        } else {
            stringToReturn += `:${seconds}`;
        }

        return stringToReturn;
    }
}

function lookupVideo () {
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
    const ytdlpArgs = '--quiet --no-playlist --no-cache-dir --skip-download --dump-json'

    // exec(`cd ${__dirname} && cd .. && cd ${OSAssetsDirPath} && ${ytdlpBinaryName} ${ytdlpArgs} "${url_input}"`, (err, stdout, stderr) => {
    exec(`cd ${OSAssetsDirPath} && ${ytdlpBinaryName} ${ytdlpArgs} "${url_input}"`, (err, stdout, stderr) => {
        if (err || stderr) {
            console.log(err);
            console.log(stderr);

            // Generating video information section
            const videoTitle = document.createElement('h3');
            videoTitle.innerText = 'An error has occurred!';

            const infoText = document.createElement('p')
            infoText.innerText = 'Please ensure the URL was entered correctly and try again';

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
            // Parsing video data json returned from yt-dlp
            const infoJson = JSON.parse(stdout)

            // Generating video information section
            let titleText;
            if (infoJson['title'].length > 85) {
                titleText = infoJson['title'].substring(0, 80) + '...';
            } else {
                titleText = infoJson['title'];
            }

            const videoTitle = document.createElement('h3');
            videoTitle.innerText = titleText;

            const infoText = document.createElement('p')
            // time_readable(infoJson['duration']) date_readable(infoJson['upload_date']) infoJson['webpage_url']
            infoText.innerHTML = `Length: ${timeReadable(infoJson['duration'])}<br>Channel: ${infoJson['uploader']}<br>Uploaded on: ${infoJson['upload_date']}`;

            const videoThumbnail = document.createElement('img');
            videoThumbnail.src = infoJson['thumbnail'];
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
            cell1.innerText = 'Format';
            row.appendChild(cell1);

            const cell2 = document.createElement('th');
            cell2.innerText = 'Quality';
            row.appendChild(cell2);

            const cell3 = document.createElement('th');
            cell3.innerText = 'Size';
            row.appendChild(cell3);

            // No text as button column
            const cell4 = document.createElement('th');
            row.appendChild(cell4);

            tableHead.appendChild(row)

            // Generating tableBody
            let audioFileSize = 0;
            for (let count = 0; count < infoJson['formats'].length; count++) {
                const currentFormat = infoJson['formats'][count];

                // mhtml files are useless
                if (currentFormat['ext'] !== 'mhtml') {
                    const row = document.createElement('tr');
                    const fileTypeCell = document.createElement('td');
                    fileTypeCell.textContent = currentFormat['ext'];
                    const fileQualityCell = document.createElement('td');
                    const fileSizeCell = document.createElement('td');
                    const downloadButtonCell = document.createElement('td');

                    // Checks for any digit between 0 and 9 in a string (Audio files do not include any in format note)
                    if (/[0-9]/.test(currentFormat['format_note'])) {
                        fileQualityCell.textContent = currentFormat['format_note'];

                        if ('filesize' in currentFormat && typeof currentFormat['filesize'] === 'number') {
                            // Combine video filesize with largest audio filesize, as video and best audio are combined
                            fileSizeCell.textContent = filesizeReadable(currentFormat['filesize'] + audioFileSize);
                        } else {
                            fileSizeCell.textContent = 'UNAVAILABLE';
                        }

                    } else {
                        fileQualityCell.textContent = 'Audio only - ' + currentFormat['format_note'];
                        audioFileSize = currentFormat['filesize']

                        if ('filesize' in currentFormat && typeof currentFormat['filesize'] === 'number') {
                            fileSizeCell.textContent = filesizeReadable(currentFormat['filesize']);
                        } else {
                            fileSizeCell.textContent = 'UNAVAILABLE';
                        }
                    }

                    const downloadButton = document.createElement('input');
                    downloadButton.type = 'button';
                    downloadButton.value = 'Download';
                    // downloadButton.onclick = () => {downloadVideo(url_input, videoInfo.title, formats[count].formatID, formats[count].fileType, formats[count].fileSize)};
                    downloadButtonCell.appendChild(downloadButton);

                    // Adding row of info and download button to table of formats
                    row.appendChild(fileTypeCell);
                    row.appendChild(fileQualityCell);
                    row.appendChild(fileSizeCell);
                    row.appendChild(downloadButtonCell);
                    tableBody.appendChild(row);
                }
            }

            table.appendChild(tableHead);
            table.appendChild(tableBody);
            formatsTableSection.appendChild(table);

            // Adding video-info and formats-table to UI
            main.appendChild(videoInfoSection);
            main.appendChild(formatsTableSection);
        }

        // Removing loading icon and re-enabling inputs once exec that gets video info is finished
        loadingIcon.remove();
        disableInputs(false);
    })
}

// TODO: move downloading of video from python script to renderer process
/*
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
*/