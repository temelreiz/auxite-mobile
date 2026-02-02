// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);

// Package exports desteğini etkinleştir
config.resolver.unstable_enablePackageExports = true;

// .mjs ve .cjs dosyalarını destekle
config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs', 'cjs'];

// Node.js polyfill'leri
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  stream: require.resolve('readable-stream'),
  buffer: require.resolve('buffer'),
};

module.exports = config;
