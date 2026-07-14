const path = require('path');
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const pluginRoot = path.resolve(__dirname, '..');

const config = {
  watchFolders: [pluginRoot],
  resolver: {
    extraNodeModules: {
      '@quickpose/react-native': pluginRoot,
    },
    nodeModulesPaths: [
      path.resolve(__dirname, 'node_modules'),
      path.resolve(pluginRoot, 'node_modules'),
    ],
    // The plugin's node_modules exist for typechecking only. React and
    // react-native must resolve solely from the example, or hooks crash
    // with two React copies in the bundle.
    blockList: [
      new RegExp(path.resolve(pluginRoot, 'node_modules', 'react').replace(/[/\\]/g, '[/\\\\]') + '[/\\\\].*'),
      new RegExp(path.resolve(pluginRoot, 'node_modules', 'react-native').replace(/[/\\]/g, '[/\\\\]') + '[/\\\\].*'),
    ],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
