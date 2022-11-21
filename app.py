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

    dpg.add_loading_indicator(tag='loading_indicator', parent='main')
    url_input = dpg.get_value('url_input')

    with YoutubeDL({'cachedir': False}) as ydl:
        video_data = ydl.extract_info(url_input, download=False)
        print(video_data)

    dpg.delete_item('loading_indicator')
    with dpg.table(tag='formats_table', parent='main', row_background=True):

        # use add_table_column to add columns to the table,
        # table columns use child slot 0
        # by default the tag is used as label unless specified otherwise
        dpg.add_table_column(label='Format')
        dpg.add_table_column(label='Quality')
        dpg.add_table_column(label='Size')
        dpg.add_table_column(enabled=False)

        # Parse available formats
        for video_format in video_data['formats']:
            # Filter out webm and invalid files
            if video_format['ext'] != 'webm' and 'filesize' in video_format and video_format['filesize'] is not None:
                with dpg.table_row():
                    # Do not list webm format type
                    dpg.add_text(video_format['ext'])

                    # Returns True if any numbers in string
                    if any(char.isdigit() for char in video_format['format_note']):
                        dpg.add_text(video_format['format_note'])
                    else:
                        # Audio files are referred to by quality
                        dpg.add_text(f"Audio only - {video_format['format_note']}")

                    dpg.add_text(filesize_readable(video_format['filesize']))

                    dpg.add_button(label='Download', callback=download_video, user_data=[url_input, video_format['format_id']])


def download_video(sender, app_data, user_data):
    url = user_data[0]
    format_id = user_data[1]

    with YoutubeDL({'cachedir': False, 'format': format_id}) as ydl:
        ydl.download(url)


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
