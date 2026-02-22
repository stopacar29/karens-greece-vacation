const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'webidl-conversions': path.resolve(__dirname, 'node_modules/webidl-conversions'),
};

module.exports = config;
