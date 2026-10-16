const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Permite require() de archivos .html y .glb como assets (WebView + modelo 3D)
config.resolver.assetExts.push('html', 'glb');

module.exports = config;
