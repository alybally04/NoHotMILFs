import dearpygui.dearpygui as dpg
from youtube_dl import YoutubeDL

dpg.create_context()


def convert_video():
    url_input = dpg.get_value('url_input')

    with YoutubeDL({'listformats': True}) as ydl:
        info = ydl.extract_info(url_input, download=False)

    dpg.add_text('nigga', parent='main')

    with dpg.table(header_row=False, parent='main'):

        # use add_table_column to add columns to the table,
        # table columns use child slot 0
        dpg.add_table_column()
        dpg.add_table_column()
        dpg.add_table_column()

        # add_table_next_column will jump to the next row
        # once it reaches the end of the columns
        # table next column use slot 1
        for i in range(0, 4):
            with dpg.table_row():
                for j in range(0, 3):
                    dpg.add_text(f"Row{i} Column{j}")

    print(info)


with dpg.window(tag='main'):
    dpg.add_text("Please enter a YouTube URL")
    dpg.add_input_text(label="URL", tag='url_input', no_spaces=True)
    dpg.add_button(label="Convert Video", callback=convert_video)

dpg.create_viewport(title='NoHotMILFs', width=400, height=600)
dpg.setup_dearpygui()

dpg.show_viewport()
# Bool value means whether it should be true or false that this is the main window
dpg.set_primary_window("main", True)

dpg.start_dearpygui()
dpg.destroy_context()
