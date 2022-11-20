import dearpygui.dearpygui as dpg
from youtube_dl import YoutubeDL


def convert_video():
    url_input = dpg.get_value('url_input')

    with YoutubeDL({'listformats': True}) as ydl:
        info = ydl.extract_info(url_input, download=False)

    print(info)


dpg.create_context()

with dpg.window(tag='main'):
    dpg.add_text("Please enter a YouTube URL")
    dpg.add_input_text(label="URL", tag='url_input', no_spaces=True)
    dpg.add_button(label="Save", callback=convert_video)

dpg.create_viewport(title='NoHotMILFs', width=500, height=500)
dpg.setup_dearpygui()

dpg.show_viewport()
# Bool value means whether it should be true or false that this is the main window
dpg.set_primary_window("main", True)

dpg.start_dearpygui()
dpg.destroy_context()
