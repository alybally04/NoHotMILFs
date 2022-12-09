print('bussy')

'''import platform
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
        units = 'bytes'

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


def lookup_video(url_input):
    try:
        with YoutubeDL({'quiet': True, 'noplaylist': True, 'cachedir': False}) as ydl:
            video_data = ydl.extract_info(url_input, download=False)

    except yt_dlp.utils.DownloadError:
        pass
        # dpg.add_text('ERROR CONVERTING VIDEO - Check the URL is correct and try again', tag='conversion_error',
                    # parent='main', color=[255, 0, 0])


def download_video(url, title, format_id, file_type):
    if file_type == 'mp4':
        pass
        # dpg.add_text('Downloading video file...', tag='current_download', parent='main')
    else:
        pass
        # dpg.add_text('Downloading audio file...', tag='current_download', parent='main')

    def progress_hook(response):
        if response['status'] == 'downloading':
            downloaded_percent = (response["downloaded_bytes"] * 100) // response["total_bytes"]
            downloaded_percent /= 100

            # dpg.set_value("eta", f"ETA {time_readable(response['eta'])}")
            # dpg.set_value("progress_bar", downloaded_percent)

        elif response['status'] == 'finished':
            pass
            # dpg.set_value('current_download', 'Downloading audio file...')

    if dpg.get_value('include_audio_best') is True:
        # format_string = f'{format_id}+bestaudio[ext=m4a]'
        format_string = f'{format_id}+bestaudio'

    elif dpg.get_value('include_audio_worst') is True:
        # format_string = f'{format_id}+worstaudio[ext=m4a]'
        format_string = f'{format_id}+worstaudio'

    else:
        format_string = format_id

    with YoutubeDL({
        'quiet': True,
        'noplaylist': True,
        'cachedir': False,
        'progress_hooks': [progress_hook],
        'format': format_string,
        'merge_output_format': file_type,
        # Begin string with r for raw string and f for f-string
        'outtmpl': f"{downloads_path}NoHotMILFs - '{title}'.{file_type}",
        'updatetime': False
    }) as ydl:

        ydl.download(url)'''
