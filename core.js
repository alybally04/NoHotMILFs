const ydl = require('yt-dlp-wrap').default;

//Get the data from the github releases API. In this case get page 1 with a maximum of 5 items.
let githubReleasesData = await ydl.getGithubReleases(1, 5);

//Download the yt-dlp binary for the given version and platform to the provided path.
//By default the latest version will be downloaded to "./yt-dlp" and platform = os.platform().
await ydl.downloadFromGithub(
    'path/to/yt-dlp/binary',
    '2020.06.16.1',
    'win32'
);

//Init an instance with a given binary path.
//If none is provided "yt-dlp" will be used as command.
const ytDlpWrap = new ydl('path/to/yt-dlp/binary');
//The binary path can also be changed later on.
ytDlpWrap.setBinaryPath('path/to/another/yt-dlp/binary');

function lookupVideo() {
    const videoDetailsSection = document.querySelector('#video-details');

    videoDetailsSection.style.display = "none";
}