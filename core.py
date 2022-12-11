import platform
import sys
import json
import yt_dlp.utils
from yt_dlp import YoutubeDL

# Getting downloads folder path
if platform.system() == 'Windows':
    downloads_path = '%USERPROFILE%/Downloads/'
else:
    downloads_path = '~/Downloads/'


# Convert bits into Human-readable format
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


def lookup_video():
    try:
        with YoutubeDL({'quiet': True, 'noplaylist': True, 'cachedir': False}) as ydl:
            raw_info = ydl.extract_info(url_input, download=False)

        entries = []
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
                    file_size = filesize_readable(video_format['filesize'])
                else:
                    file_size = 'UNAVAILABLE'

                entry = {"format_type": format_type, "file_type": file_type, "quality": quality, "file_size": file_size}
                entries.append(entry)
        video_data = json.dumps({"entries": entries})

    except yt_dlp.utils.DownloadError:
        video_data = {"error": "DownloadError"}

    # return data as string to pass it back to coreInterface.js which will be parsed as json
    return video_data


command = sys.argv[1]
url_input = sys.argv[2]

if command == 'lookup_video':
    print(lookup_video())
