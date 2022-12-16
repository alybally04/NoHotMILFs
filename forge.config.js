module.exports = {
  packagerConfig: {
    icon: __dirname + '/assets/icons/icon', // no file extension required
    extraResource: [__dirname + "/venv"]
  },
  rebuildConfig: {},
  makers: [
    /*{
      name: '@electron-forge/maker-squirrel',
      config: {
        authors: 'Evelyn Jones',
        description: 'A GUI for yt-dlp',
        iconUrl: __dirname + '/assets/icons/icon',
        // setupIcon: __dirname + '/assets/icons/icon.ico',
      },
    },*/
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin', 'win32'],
    },
    {
      name: '@electron-forge/maker-dmg',
      config: {
        // background: './assets/dmg-background.png',
        format: 'ULFO'
      }
    }
  ],
};
