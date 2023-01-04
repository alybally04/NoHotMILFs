const { ipcRenderer } = require('electron');
const { exec, spawn } = require("child_process");

let lookupButton;
let inputField;
let appDir;
let OSAssetsDirPath;
let ytdlpBinaryName;
let ffmpegPath;
let downloadsPath;
let postprocessorArgs;

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
        ffmpegPath = appDir + '\\assets\\Win\\ffmpeg\\bin';
        downloadsPath = '%USERPROFILE%\\Downloads\\';
        postprocessorArgs = '';
    } else {
        OSAssetsDirPath = appDir + '/assets/Mac';
        ytdlpBinaryName = './yt-dlp';
        ffmpegPath = appDir + '/assets/Mac/ffmpeg';
        downloadsPath = '~/Downloads/';
        // MacOS get pissy about codec and pixel format
        postprocessorArgs = '-vcodec libx264 -pix_fmt yuv420p';
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

function dateReadable (date) {
    return `${date.substring(6)}/${date.substring(4, 6)}/${date.substring(0, 4)}`
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
    const urlInput = document.querySelector('#input-field').value
    const ytdlpArgs = '--quiet --no-playlist --no-cache-dir --skip-download --dump-json'

    exec(`cd ${OSAssetsDirPath} && ${ytdlpBinaryName} ${ytdlpArgs} "${urlInput}"`, (err, stdout, stderr) => {
        if (err || stderr) {
            console.warn(stderr);

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
            infoText.innerHTML = `Length: ${timeReadable(infoJson['duration'])}<br>Channel: ${infoJson['uploader']}<br>Uploaded on: ${dateReadable(infoJson['upload_date'])}`;

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

                // mhtml and weba files are useless
                if (currentFormat['ext'] !== 'mhtml' && currentFormat['ext'] !== 'weba') {
                    const row = document.createElement('tr');
                    const fileTypeCell = document.createElement('td');
                    fileTypeCell.textContent = currentFormat['ext'];
                    let fileExt;
                    const fileQualityCell = document.createElement('td');
                    const fileSizeCell = document.createElement('td');
                    const downloadButtonCell = document.createElement('td');

                    // Checks for any digit between 0 and 9 in a string (Audio files do not include any in format note)
                    if (/[0-9]/.test(currentFormat['format_note'])) { // If video
                        fileExt = 'mp4';
                        fileQualityCell.textContent = currentFormat['format_note'];

                        if ('filesize' in currentFormat && typeof currentFormat['filesize'] === 'number') {
                            // Combine video filesize with the largest audio filesize, as video and best audio are combined
                            fileSizeCell.textContent = filesizeReadable(currentFormat['filesize'] + audioFileSize);
                        } else {
                            fileSizeCell.textContent = 'UNAVAILABLE';
                        }

                    } else { // If audio only
                        fileExt = currentFormat['ext'];
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
                    downloadButton.onclick = () => {downloadVideo(urlInput, titleText, currentFormat['format_id'], fileExt)};
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

function downloadVideo(url, title, formatId, fileType) {
    disableInputs(true);

    if (document.querySelector('#success-message') !== null) {
        document.querySelector('#success-message').remove();
    }

    // Creating download progress info section
    const formatsTableSection = document.querySelector('#formats-table');
    formatsTableSection.style.display = 'none';

    const currentDownloadSection = document.createElement('section');
    currentDownloadSection.id = 'current-download';

    const currentDownloadTitle = document.createElement('h3');
    currentDownloadTitle.innerHTML = `Downloading&nbsp;&nbsp;—&nbsp;&nbsp;${title}`;
    currentDownloadSection.appendChild(currentDownloadTitle);

    let downloadProgressInfo = document.createElement('p');
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

    // Downloading Video
    // Format selection ignores "+bestaudio" if format id is for audio file
    const ytdlpArgs = `--progress-template "download-title:%(info.id)s-%(progress.eta)s" --no-playlist --no-cache-dir --no-mtime --format "${formatId}+bestaudio[ext=m4a]" --merge-output-format "mp4" --output "${downloadsPath}NoHotMILFs - '${title}'.${fileType}" --postprocessor-args "${postprocessorArgs}" --ffmpeg-location "${ffmpegPath}"`
    const ydl = spawn(`cd ${OSAssetsDirPath} && ${ytdlpBinaryName} ${ytdlpArgs} "${url}"`, {
        shell: true
    });

    // Count number of downloads (First is video, then audio)
    let downloadCount;
    if (fileType === 'mp4') {
        downloadCount = 0;
    } else {
        downloadCount = 1;
    }

    const loadingIcon = document.createElement('div');
    loadingIcon.className = 'loading-icon';

    ydl.stderr.on('data', (data) => {
        console.warn(`stderr: ${data}`);
    });

    ydl.stdout.on('data', (data) => {
        // Parsing data
        data = data.toString();

        // return if data object is empty or the data is not of use
        // yt-dlp sometimes sends empty data object for some reason
        if (data === undefined || !(data.charAt(data.length - 3) === ':')) {
            return
        }

        data = data.split(']')[1].trim();

        // Parsing progress percentage
        const progressPercentage = data.split('%')[0]
        if (progressPercentage === '100.0') {
            downloadCount += 1;
        }

        if (downloadCount === 0) {
            document.querySelector('#current-download p').innerHTML =
                    `Downloading Video&nbsp;&nbsp;—&nbsp;&nbsp;${data.substring(0, data.length - 9)}&nbsp;&nbsp;—&nbsp;&nbsp;${data.substring(data.length - 9)}`;
        } else if (downloadCount === 1) {
            document.querySelector('#current-download p').innerHTML =
                    `Downloading Audio&nbsp;&nbsp;—&nbsp;&nbsp;${data.substring(0, data.length - 9)}&nbsp;&nbsp;—&nbsp;&nbsp;${data.substring(data.length - 9)}`;
        } else {
            document.querySelector('#current-download p').innerHTML = 'Exporting download...';
            progressBarContainer.remove();
            main.appendChild(loadingIcon);
        }

        progressBar.innerText = progressPercentage + '%';
        progressBar.style.width = progressPercentage + '%';
    });

    ydl.on('close', (code) => {
        console.log(`yt-dlp process exited with code ${code}`)
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