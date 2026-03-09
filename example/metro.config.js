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
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
