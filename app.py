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


def convert_video():
    if dpg.does_alias_exist('formats_table'):
        dpg.delete_item('formats_table')
    if dpg.does_alias_exist('thumbnail'):
        dpg.delete_item('thumbnail')
        dpg.delete_item('thumbnail_png')
    if dpg.does_alias_exist('video_title'):
        dpg.delete_item('video_title')

    dpg.add_loading_indicator(tag='loading_indicator', parent='main')
    url_input = dpg.get_value('url_input')

    with YoutubeDL({'cachedir': False}) as ydl:
        video_data = ydl.extract_info(url_input, download=False)

    thumbnail_file = requests.get(video_data['thumbnail'], stream=True)
    with open('thumbnail.png', 'wb') as video_thumbnail:
        shutil.copyfileobj(thumbnail_file.raw, video_thumbnail)

    width, height, channels, data = dpg.load_image('thumbnail.png')
    with dpg.texture_registry():
        dpg.add_static_texture(width=width, height=height, default_value=data, tag="thumbnail_png")

    os.remove('thumbnail.png')

    dpg.delete_item('loading_indicator')
    dpg.add_image('thumbnail_png', tag='thumbnail', parent='main', width=160, height=90)
    dpg.add_text(video_data['title'], tag='video_title', parent='main')

    with dpg.table(tag='formats_table', parent='main', row_background=True):
        # Adding columns to table
        dpg.add_table_column(label='Format')
        dpg.add_table_column(label='Quality')
        dpg.add_table_column(label='Size')
        dpg.add_table_column(enabled=False)

        # Parse available formats
        for video_format in video_data['formats']:
            # Filter out invalid formats
            if video_format['ext'] != 'mhtml':
                with dpg.table_row():
                    dpg.add_text(video_format['ext'])

                    # Returns True if any numbers in string
                    if any(char.isdigit() for char in video_format['format_note']):
                        dpg.add_text(video_format['format_note'])
                    else:
                        # Audio files are referred to by quality
                        dpg.add_text(f"Audio only - {video_format['format_note']}")

                    if 'filesize' in video_format and type(video_format['filesize']) is int:
                        dpg.add_text(filesize_readable(video_format['filesize']))
                    else:
                        dpg.add_text('UNAVAILABLE')

                    dpg.add_button(label='Download', callback=download_video, user_data=[url_input, video_format['format_id']])


def download_video(sender, app_data, user_data):
    url = user_data[0]
    format_id = user_data[1]

    with YoutubeDL({'cachedir': False, 'format': f'{format_id}+bestaudio[ext=m4a]', 'merge_output_format': 'mp4'}) as ydl:
        ydl.download(url)

    dpg.delete_item('formats_table')
    dpg.add_loading_indicator(tag='loading_indicator', parent='main')


with dpg.window(tag='main'):
    dpg.add_text("Please enter a YouTube URL")
    dpg.add_input_text(label="URL", tag='url_input', no_spaces=True)
    dpg.add_button(label="Convert Video", callback=convert_video)

dpg.create_viewport(title='NoHotMILFs', width=800, height=500)
dpg.setup_dearpygui()

dpg.show_viewport()
# Bool value means whether it should be true or false that this is the main window
dpg.set_primary_window("main", True)

dpg.start_dearpygui()
dpg.destroy_context()
