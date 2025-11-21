const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add support for NativeWind/Tailwind CSS
config.resolver.sourceExts.push('css');

module.exports = config;
