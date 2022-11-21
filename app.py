import dearpygui.dearpygui as dpg
from youtube_dl import YoutubeDL

dpg.create_context()


# Convert bits into Human-readable format
def filesize_readable(bits):
    if bits < 1000:  # bits
        units = 'bytes'
    elif bits < 1000000:  # kilobits
        bits /= 1000
        units = 'KB'
    elif bits < 1000000000:  # megabits
        bits /= 1000000
        units = 'MB'
    else:  # gigabits
        bits /= 1000000000
        units = 'GB'

    # Convert from bits to bytes
    bits /= 8

    # Format the output
    formatted_string = f'{round(bits, 1)} {units}'

    return formatted_string


def convert_video():
    if dpg.does_alias_exist('formats_table'):
        dpg.delete_item('formats_table')

    dpg.add_loading_indicator(tag='loading_indicator', parent='main')
    url_input = dpg.get_value('url_input')

    with YoutubeDL({}) as ydl:
        video_data = ydl.extract_info(url_input, download=False)
        print(video_data)

    def download_video(user_data):
        print(user_data)
        print('nigga')
        with YoutubeDL({'format': user_data}) as ydl:
            ydl.extract_info(url_input)

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
            if video_format['ext'] != 'webm' and video_format['filesize'] is not None:
                with dpg.table_row():
                    # Do not list webm format type
                    dpg.add_text(video_format['ext'])

                    if video_format['format_note'] == 'tiny':
                        # Audio files are referred to as tiny for some reason
                        dpg.add_text('Audio only')
                    else:
                        dpg.add_text(video_format['format_note'])

                    dpg.add_text(filesize_readable(video_format['filesize']))

                    print(video_format['format_id'])
                    dpg.add_button(label='Download', callback=download_video, user_data=video_format['format_id'])


with dpg.window(tag='main'):
    dpg.add_text("Please enter a YouTube URL")
    dpg.add_input_text(label="URL", tag='url_input', no_spaces=True)
    dpg.add_button(label="Convert Video", callback=convert_video)

dpg.create_viewport(title='NoHotMILFs', width=400, height=500)
dpg.setup_dearpygui()

dpg.show_viewport()
# Bool value means whether it should be true or false that this is the main window
dpg.set_primary_window("main", True)

dpg.start_dearpygui()
dpg.destroy_context()
