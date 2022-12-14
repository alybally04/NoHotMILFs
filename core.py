import platform
import sys
import json
import yt_dlp.utils
from yt_dlp import YoutubeDL

# Getting downloads folder path
if platform.system() == 'Windows':
    downloads_path = '%USERPROFILE%/Downloads/'
    ffmpeg_path = 'assets/ffmpeg/ffmpegWin/bin'
else:
    downloads_path = '~/Downloads/'
    ffmpeg_path = 'assets/ffmpeg/ffmpegMac'


# Convert bytes into Human-readable format
def filesize_readable(number_of_bytes):
    if number_of_bytes < 1024:  # bytes
        units = 'Bytes'

    elif number_of_bytes < 1048576:  # kilobytes
        number_of_bytes /= 1024
        units = 'KB'

    elif number_of_bytes < 1073741824:  # megabytes
        number_of_bytes /= 1048576
        units = 'MB'

    else:  # gigabytes
        number_of_bytes /= 1073741824
        units = 'GB'

    # Format the output
    formatted_string = f'{round(number_of_bytes, 1)} {units}'

    return formatted_string


# Formats ETA of video download from seconds remaining
def time_readable(num1):
    # gets quotient (minutes)
    minutes = num1 // 60
    # gets remainder (seconds)
    seconds = num1 % 60

    if minutes < 60:  # Formats time string for MIN:SEC format
        if seconds >= 10:
            duration = f'{minutes}:{seconds}'
        else:
            duration = f'{minutes}:0{seconds}'
        return duration

    else:  # Formats time string for HOUR:MIN:SEC format
        hours = minutes // 60
        minutes = minutes % 60

        if minutes >= 10 and seconds >= 10:
            duration = f'{hours}:{minutes}:{seconds}'
        elif minutes >= 10:
            duration = f'{hours}:{minutes}:0{seconds}'
        elif seconds >= 10:
            duration = f'{hours}:0{minutes}:{seconds}'
        else:
            duration = f'{hours}:0{minutes}:0{seconds}'

    return duration


# Formatting the date of upload to be easily readable in "dd/mm/yyyy" format
def date_readable(num1):
    raw = str(num1)
    dd = raw[6:8]
    mm = raw[4:6]
    yyyy = raw[0:4]

    date = f'{dd}/{mm}/{yyyy}'
    return date


def lookup_video():
    try:
        with YoutubeDL({'quiet': True, 'noplaylist': True, 'cachedir': False}) as ydl:
            raw_info = ydl.extract_info(url_input, download=False)

        video_data = {
            # Keys in camelCase for use in JavaScriptu
            'title': raw_info['title'],
            'channel': raw_info['uploader'],
            'duration': time_readable(raw_info['duration']),
            'seconds': raw_info['duration'],
            'uploadDate': date_readable(raw_info['upload_date']),
            'videoUrl': raw_info['webpage_url'],
            'thumbnail': raw_info['thumbnail']
        }

        audio_file_size = 0
        format_entries = []
        for count, video_format in enumerate(raw_info['formats']):
            if video_format['ext'] != 'mhtml':
                if any(char.isdigit() for char in video_format['format_note']):
                    format_type = 'video'
                    file_type = 'mp4'
                    quality = video_format['format_note']
                else:
                    format_type = 'audio'
                    file_type = video_format['ext']
                    quality = f"Audio only - {video_format['format_note']}"

                if 'filesize' in video_format and type(video_format['filesize']) is int:
                    if format_type == 'video':
                        file_size = filesize_readable(video_format['filesize'] + audio_file_size)
                    else:
                        audio_file_size = video_format['filesize']
                        file_size = filesize_readable(video_format['filesize'])
                else:
                    file_size = 'UNAVAILABLE'

                entry = {"fileType": file_type, "quality": quality, "fileSize": file_size, "formatID": video_format['format_id']}
                format_entries.append(entry)

        # Dumping JSON to return to renderer process
        video_data = json.dumps({"videoInfo": video_data, "formats": format_entries})

    except (yt_dlp.utils.DownloadError, yt_dlp.utils.YoutubeDLError):
        video_data = json.dumps({"error": "DownloadError"})

    # return data as string to pass it back to coreInterface.js which will be parsed as json
    return video_data


def download_video(url, title, format_id, file_type):

    def progress_hook(response):
        if response['status'] == 'downloading':
            downloaded_percent = (response["downloaded_bytes"] * 100) // response["total_bytes"]
            downloaded_percent /= 100

        elif response['status'] == 'finished':
            pass

    # format_string = f'{format_id}+bestaudio'
    format_string = f'{format_id}+bestaudio[ext=m4a]'

    with YoutubeDL({
        'ffmpeg_location': ffmpeg_path,
        'quiet': True,
        'noplaylist': True,
        'cachedir': False,
        'progress_hooks': [progress_hook],
        'format': format_string,
        'merge_output_format': 'mp4',
        # Begin string with r for raw string and f for f-string
        'outtmpl': f"{downloads_path}NoHotMILFs - '{title}'.{file_type}",
        'updatetime': False,
    }) as ydl:

        ydl.download(url)

    print('All complete!')


command = sys.argv[1]

if command == 'lookup_video':
    url_input = sys.argv[2]
    print(lookup_video())

elif command == 'download_video':
    url = sys.argv[2]
    title = sys.argv[3]
    format_id = sys.argv[4]
    file_type = sys.argv[5]

    print(download_video(url, title, format_id, file_type))
