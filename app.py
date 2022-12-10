import sys
import random
from PySide6 import QtCore, QtWidgets, QtGui


class MainWindow(QtWidgets.QMainWindow):
    def __init__(self):
        super().__init__()

        self.setWindowTitle("NoHotMILFs")

        mainwindowlayout = QtWidgets.QVBoxLayout()

        mainwindowlayout.addWidget(SearchWidget())
        mainwindowlayout.addWidget(SampleWidget())
        mainwindowlayout.addWidget(SampleWidget())

        mainwindowlayout_widget = QtWidgets.QWidget()
        mainwindowlayout_widget.setLayout(mainwindowlayout)
        self.setCentralWidget(mainwindowlayout_widget)

        # Setting background colour to fill mainwindowlayout_widget
        self.setAutoFillBackground(True)
        # Getting current palette
        palette = self.palette()
        # Modifying current palette
        palette.setColor(QtGui.QPalette.ColorRole.Window, QtGui.QColor('white'))
        self.setPalette(palette)


class SearchWidget(QtWidgets.QWidget):
    def __init__(self):
        super().__init__()

        self.nameLabel = QtWidgets.QLabel('Youtube URL:', self)
        self.url_input = QtWidgets.QLineEdit(self)

        self.search_button = QtWidgets.QPushButton('Fetch', self)
        self.search_button.clicked.connect(self.search_video)
        # search_button.resize(200, 32)
        # search_button.move(100, 40)

        self.layout = QtWidgets.QHBoxLayout(self)
        self.layout.addWidget(self.nameLabel)
        self.layout.addWidget(self.url_input)
        self.layout.addWidget(self.search_button)


    def search_video(self):
        print('Your name: ' + self.url_input.text())


class SampleWidget(QtWidgets.QWidget):
    def __init__(self):
        super().__init__()

        self.hello = ["Hallo Welt", "Hei maailma", "Hola Mundo", "ya russian DOG"]

        self.button = QtWidgets.QPushButton("Click me!")
        self.text = QtWidgets.QLabel("Hello World", alignment=QtCore.Qt.AlignCenter)

        self.layout = QtWidgets.QVBoxLayout(self)
        self.layout.addWidget(self.text)
        self.layout.addWidget(self.button)

        self.button.clicked.connect(self.magic)

    @QtCore.Slot()
    def magic(self):
        self.text.setText(random.choice(self.hello))


if __name__ == "__main__":
    app = QtWidgets.QApplication([])

    window = MainWindow()
    window.resize(800, 500)
    window.setMinimumSize(400, 250)
    window.show()

    sys.exit(app.exec())
