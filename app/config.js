var DEVICES_FILE = process.env.KEYS_FILE || '/etc/knot/keys.json';
var CONFIGURATION_FILE = process.env.CONFIG_FILE || '/etc/knot/gatewayConfig.json';

module.exports = {
  mongo: {
    databaseUrl: 'mongodb://localhost:27017/knot'
  },
  DEVICES_FILE: DEVICES_FILE,
  CONFIGURATION_FILE: CONFIGURATION_FILE
};
