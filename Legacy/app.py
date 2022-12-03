import os
import platform
import shutil
import requests
import dearpygui.dearpygui as dpg
import yt_dlp.utils
from yt_dlp import YoutubeDL

# Getting downloads folder path
if platform.system() == 'Windows':
    downloads_path = '%USERPROFILE%/Downloads/'

else:
    downloads_path = '~/Downloads/'

dpg.create_context()


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


def convert_video():
    dpg.configure_item('convert_video', enabled=False)
    dpg.configure_item('clear_all', enabled=False)

    clear_result(None)

    dpg.add_loading_indicator(tag='loading_indicator', parent='main')
    url_input = dpg.get_value('url_input')

    try:
        with YoutubeDL({'quiet': True, 'noplaylist': True, 'cachedir': False}) as ydl:
            video_data = ydl.extract_info(url_input, download=False)

    except yt_dlp.utils.DownloadError:
        dpg.add_text('ERROR CONVERTING VIDEO - Check the URL is correct and try again', tag='conversion_error',
                     parent='main', color=[255, 0, 0])

        dpg.delete_item('loading_indicator')
        dpg.configure_item('convert_video', enabled=True)
        dpg.configure_item('clear_all', enabled=True)

        return

    thumbnail_file = requests.get(video_data['thumbnail'], stream=True)
    with open('thumbnail.png', 'wb') as video_thumbnail:
        shutil.copyfileobj(thumbnail_file.raw, video_thumbnail)

    try:
        width, height, channels, data = dpg.load_image('thumbnail.png')

        with dpg.texture_registry():
            dpg.add_static_texture(width=width, height=height, default_value=data, tag="thumbnail_png")

        dpg.add_image('thumbnail_png', tag='thumbnail', parent='main', width=240, height=135)
    except TypeError:  # load_image returns none if error occurs
        dpg.add_text('IMAGE UNAVAILABLE', tag='img_unavailable', parent='main', color=[255, 0, 0])

    os.remove('thumbnail.png')

    dpg.delete_item('loading_indicator')
    dpg.add_text(video_data['title'], tag='video_title', parent='main')

    with dpg.table(tag='formats_table', parent='main', row_background=True):
        # Adding columns to table
        dpg.add_table_column(label='Format')
        dpg.add_table_column(label='Quality')
        dpg.add_table_column(label='Size')
        dpg.add_table_column()

        # Parse available formats
        for video_format in video_data['formats']:
            # Filter out invalid formats
            if video_format['ext'] != 'mhtml':
                with dpg.table_row():
                    # Returns True if any numbers in string (There are no numbers in audio format names)
                    if any(char.isdigit() for char in video_format['format_note']):
                        format_type = 'video'
                        file_type = 'mp4'
                    else:
                        format_type = 'audio'
                        file_type = video_format['ext']

                    # Adding format name
                    dpg.add_text(video_format['ext'])

                    if format_type == 'video':
                        dpg.add_text(video_format['format_note'])
                    else:
                        dpg.add_text(f"Audio only - {video_format['format_note']}")

                    if 'filesize' in video_format and type(video_format['filesize']) is int:
                        dpg.add_text(filesize_readable(video_format['filesize']))
                    else:
                        dpg.add_text('UNAVAILABLE')

                    '''if 'filesize' in video_format and type(video_format['filesize']) is int:
                        if format_type == 'video':
                            # Add size of audio file that will be added to video file during download to total size
                            total_size = video_format['filesize'] + bestaudio_size
                            file_size = filesize_readable(total_size)

                        else:
                            # Last audio item to save this will be used for combination
                            # with video if video file is downloaded
                            bestaudio_size = video_format['filesize']
                            file_size = filesize_readable(video_format['filesize'])

                        dpg.add_text(file_size)

                    else:
                        dpg.add_text('UNAVAILABLE')'''

                    dpg.add_button(label='Download', callback=download_video,
                                   user_data=[url_input, video_data['title'], video_format['format_id'], file_type])

    dpg.configure_item('convert_video', enabled=True)
    dpg.configure_item('clear_all', enabled=True)


def download_video(sender, app_data, user_data):
    url = user_data[0]
    title = user_data[1]
    format_id = user_data[2]
    file_type = user_data[3]

    dpg.delete_item('download_complete')
    dpg.hide_item('formats_table')

    if file_type == 'mp4':
        dpg.add_text('Downloading video file...', tag='current_download', parent='main')
    else:
        dpg.add_text('Downloading audio file...', tag='current_download', parent='main')

    dpg.add_text('Calculating ETA...', tag='eta', parent='main')
    dpg.add_progress_bar(tag='progress_bar', parent='main')

    def progress_hook(response):
        if response['status'] == 'downloading':
            downloaded_percent = (response["downloaded_bytes"] * 100) // response["total_bytes"]
            downloaded_percent /= 100

            dpg.set_value("eta", f"ETA {time_readable(response['eta'])}")
            dpg.set_value("progress_bar", downloaded_percent)

        elif response['status'] == 'finished':
            dpg.set_value('current_download', 'Downloading audio file...')

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

        ydl.download(url)

    dpg.delete_item('current_download')
    dpg.delete_item('eta')
    dpg.delete_item('progress_bar')

    dpg.add_text('Download Complete! - File is in "Downloads" folder!', tag='download_complete', parent='main', before='formats_table',
                 color=[6, 194, 0])
    dpg.show_item('formats_table')


# Clears output from converting a video
def clear_result(sender):
    if sender == 'clear_all':
        dpg.set_value('url_input', value='')

    items = ['formats_table', 'thumbnail', 'thumbnail_png', 'img_unavailable', 'video_title', 'download_complete',
             'conversion_error', 'download_complete']
    for item in items:
        if dpg.does_alias_exist(item):
            dpg.delete_item(item)


def include_audio_best():
    if dpg.is_item_enabled('include_audio_worst'):
        dpg.configure_item('include_audio_worst', enabled=False)

    else:
        dpg.configure_item('include_audio_worst', enabled=True)


def include_audio_worst():
    if dpg.is_item_enabled('include_audio_best'):
        dpg.configure_item('include_audio_best', enabled=False)

    else:
        dpg.configure_item('include_audio_best', enabled=True)


with dpg.window(tag='main'):
    dpg.add_text("Please enter a YouTube URL")
    dpg.add_input_text(label="URL", tag='url_input', no_spaces=True)

    with dpg.group(horizontal=True):
        dpg.add_button(label="Convert Video", tag='convert_video', callback=convert_video)
        dpg.add_button(label="Clear All", tag='clear_all', callback=clear_result)
        dpg.add_checkbox(label='Include Audio (High Quality)', tag='include_audio_best', default_value=True, callback=include_audio_best, enabled=True)
        dpg.add_checkbox(label='Include Audio (Low Quality)', tag='include_audio_worst', callback=include_audio_worst, enabled=False)

dpg.create_viewport(title='NoHotMILFs', width=900, height=600)
dpg.setup_dearpygui()

dpg.show_viewport()
# Bool value means whether it should be true or false that this is the main window
dpg.set_primary_window("main", True)
dpg.set_viewport_vsync(True)

dpg.start_dearpygui()
dpg.destroy_context()
