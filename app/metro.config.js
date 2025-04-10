const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.alias = {
  ...(config.resolver.alias || {}),
  'lodash/isEmpty': require.resolve('lodash/isEmpty'),
};

module.exports = config;
