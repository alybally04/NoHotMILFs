module.exports = {
  packagerConfig: {
    icon: __dirname + '/assets/icons/icon', // no file extension required
    extraResource: []
  },
  rebuildConfig: {},
  makers: [
    /*{
      name: '@electron-forge/maker-squirrel',
      config: {
        authors: 'Evelyn Jones',
        description: 'A Program for downloading YouTube videos',
        iconUrl: __dirname + '/assets/icons/icon',
      },
    },*/
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin', 'win32'],
    },
    /*{
      name: '@electron-forge/maker-dmg',
      config: {
        format: 'ULFO'
      }
    }*/
  ],
};
