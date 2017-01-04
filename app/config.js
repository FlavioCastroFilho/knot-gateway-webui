var DEVICES_FILE = process.env.KEYS_FILE || '/etc/knot/keys.json';
var CONFIGURATION_FILE = process.env.CONFIG_FILE || '/etc/knot/gatewayConfig.json';
var DEFAULT_CONFIGURATION_FILE = process.env.DEFAULT_CONFIG_FILE || '/etc/knot/gatewayFactoryConfig.json';

module.exports = {
  DEVICES_FILE: DEVICES_FILE,
  CONFIGURATION_FILE: CONFIGURATION_FILE,
  DEFAULT_CONFIGURATION_FILE: DEFAULT_CONFIGURATION_FILE
};
