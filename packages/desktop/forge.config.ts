import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
// import { MakerWix } from '@electron-forge/maker-wix';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives';
import { WebpackPlugin } from '@electron-forge/plugin-webpack';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';

import { mainConfig } from './webpack.main.config';
import { rendererConfig } from './webpack.renderer.config';

import path from 'path'

const config: ForgeConfig = {
  packagerConfig: {
    appBundleId: 'com.codingclip.clipcc',
    appCopyright: `Copyright © 2019-${(new Date).getFullYear()} Clip Team.`,
    asar: true,
    icon: path.join(__dirname, 'icons/app')
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({
      iconUrl: 'https://codingclip.com/editor/stable/static/favicon.ico'
    }), 
    // new MakerWix({}),
    new MakerZIP({}, ['win32','darwin']), 
    new MakerRpm({}), 
    new MakerDeb({})
  ],
  plugins: [
    new AutoUnpackNativesPlugin({}),
    new WebpackPlugin({
      mainConfig,
      devContentSecurityPolicy: 'default-src \'self\' \'unsafe-eval\' \'unsafe-inline\' gui: icons: app: http: https: ws: data: blob:',
      renderer: {
        config:  rendererConfig,
        entryPoints: [
          {
            html: './src/index.html',
            js: './src/renderer.ts',
            name: 'main_window',
            preload: {
              js: './src/preload.ts',
            },
          },
          {
            html: './src/splash.html',
            name: 'splash_window',
            js: './src/splash.ts',
            preload: {
              js: './src/preload.ts',
            },
          },
          {
            html: './src/index.html',
            name: 'about_window',
            js: './src/about.ts',
            preload: {
              js: './src/preload.ts',
            },
          },
        ],
      },
    }),
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};

export default config;
