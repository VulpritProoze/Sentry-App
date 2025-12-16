const { getDefaultConfig } = require('expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

// Enable package exports to properly resolve @tamagui/toast
defaultConfig.resolver.unstable_enablePackageExports = true;

module.exports = defaultConfig;

