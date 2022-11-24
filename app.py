import os
import shutil
import requests
import dearpygui.dearpygui as dpg
from yt_dlp import YoutubeDL

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
def eta_time_readable():
    pass


def convert_video():
    items = ['formats_table', 'thumbnail', 'thumbnail_png', 'img_unavailable', 'video_title', 'download_complete',
             'progress_bar']
    for item in items:
        if dpg.does_alias_exist(item):
            dpg.delete_item(item)

    dpg.add_loading_indicator(tag='loading_indicator', parent='main')
    url_input = dpg.get_value('url_input')

    with YoutubeDL({'quiet': True, 'noplaylist': True, 'cachedir': False}) as ydl:
        video_data = ydl.extract_info(url_input, download=False)

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

        bestaudio_size = 0
        # Parse available formats
        for video_format in video_data['formats']:
            # Filter out invalid formats
            if video_format['ext'] != 'mhtml':
                with dpg.table_row():
                    # Returns True if any numbers in string (There are no numbers in audio format names)
                    if any(char.isdigit() for char in video_format['format_note']):
                        format_type = 'video'
                    else:
                        format_type = 'audio'

                    # Adding format name
                    dpg.add_text(video_format['ext'])

                    if format_type == 'video':
                        dpg.add_text(video_format['format_note'])

                    else:
                        dpg.add_text(f"Audio only - {video_format['format_note']}")

                    if 'filesize' in video_format and type(video_format['filesize']) is int:
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
                        dpg.add_text('UNAVAILABLE')

                    dpg.add_button(label='Download', callback=download_video, user_data=[url_input, video_format['format_id']])


def download_video(sender, app_data, user_data):
    url = user_data[0]
    format_id = user_data[1]

    dpg.hide_item('formats_table')
    dpg.add_text(f"ETA UNKNOWN", tag='eta', parent='main')
    dpg.add_progress_bar(tag='progress_bar', parent='main')

    def progress_hook(response):
        if response['status'] == 'downloading':
            downloaded_percent = (response["downloaded_bytes"]*100) // response["total_bytes"]
            downloaded_percent /= 100

            dpg.set_value("eta", response['eta'])
            dpg.set_value("progress_bar", downloaded_percent)

        elif response["status"] == "finished":
            file_name = response["filename"]

    with YoutubeDL({'quiet': True, 'noplaylist': True, 'cachedir': False, 'progress_hooks': [progress_hook], 'format': f'{format_id}+bestaudio[ext=m4a]', 'merge_output_format': 'mp4'}) as ydl:
        ydl.download(url)

    dpg.delete_item('eta')
    dpg.delete_item('progress_bar')
    dpg.show_item('formats_table')


with dpg.window(tag='main'):
    dpg.add_text("Please enter a YouTube URL")
    dpg.add_input_text(label="URL", tag='url_input', no_spaces=True)
    dpg.add_button(label="Convert Video", callback=convert_video)

dpg.create_viewport(title='NoHotMILFs', width=800, height=500)
dpg.setup_dearpygui()

dpg.show_viewport()
# Bool value means whether it should be true or false that this is the main window
dpg.set_primary_window("main", True)
dpg.set_viewport_vsync(True)

dpg.start_dearpygui()
dpg.destroy_context()
