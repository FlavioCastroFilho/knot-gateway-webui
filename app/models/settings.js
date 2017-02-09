var fs = require('fs');
var network = require('../models/network');

var CONFIGURATION_FILE = require('../config').CONFIGURATION_FILE;
var DEFAULT_CONFIGURATION_FILE = require('../config/gatewayFactoryConfig.json');
var DEVICES_FILE = require('../config').DEVICES_FILE;

var writeFile = function writeFile(type, incomingData, done) {
  fs.readFile(CONFIGURATION_FILE, 'utf8', function onRead(err, data) {
    var localData;

    if (err) {
      done(err);
      return;
    }

    localData = JSON.parse(data);

    if (type === 'adm') {
      if (incomingData.password) {
        localData.user.password = incomingData.password;
      }

      if (incomingData.firmware && incomingData.firmware.name && incomingData.firmware.base64) {
        localData.administration.firmware.name = incomingData.firmware.name;
        localData.administration.firmware.base64 = incomingData.firmware.base64;
      }

      localData.administration.remoteSshPort = incomingData.remoteSshPort;
      localData.administration.allowedPassword = incomingData.allowedPassword;
      localData.administration.sshKey = incomingData.sshKey;
    } else if (type === 'radio') {
      localData.radio.channel = incomingData.channel;
      localData.radio.TxPower = incomingData.TxPower;
    }
    fs.writeFile(CONFIGURATION_FILE, JSON.stringify(localData), 'utf8', done);
  });
};

var getAdministrationSettings = function getAdministrationSettings(done) {
  fs.readFile(CONFIGURATION_FILE, 'utf8', function onRead(err, data) {
    var obj;
    var admObj;

    if (err) {
      done(err);
    } else {
      try {
        obj = JSON.parse(data);
        admObj = {
          remoteSshPort: obj.administration.remoteSshPort,
          allowedPassword: obj.administration.allowedPassword,
          sshKey: obj.administration.sshKey,
          firmware: obj.administration.firmware.name
        };
        done(null, admObj);
      } catch (e) {
        done(e);
      }
    }
  });
};

var setAdministrationSettings = function setAdministrationSettings(settings, done) {
  writeFile('adm', settings, done);
};

var getRadioSettings = function getRadioSettings(done) {
  fs.readFile(CONFIGURATION_FILE, 'utf8', function onRead(err, data) {
    var obj;
    var radioObj;

    if (err) {
      done(err);
    } else {
      try {
        obj = JSON.parse(data);
        radioObj = {
          channel: obj.radio.channel,
          TxPower: obj.radio.TxPower,
          mac: obj.radio.mac
        };
        done(null, radioObj);
      } catch (e) {
        done(e);
      }
    }
  });
};

var setRadioSettings = function setRadioSettings(settings, done) {
  writeFile('radio', settings, done);
};

var setDefaultSettings = function setDefaultSettings(done) {
  var keys = { keys: [] };
  var config = {};

  fs.writeFile(DEVICES_FILE, JSON.stringify(keys), 'utf8', null);
  fs.readFile(CONFIGURATION_FILE, 'utf8', function onRead(err, data) {
    var localData;
    if (err) {
      done(err);
      return;
    }
    localData = JSON.parse(data);

    DEFAULT_CONFIGURATION_FILE.radio.mac = localData.radio.mac;
    network.setHostname('knot', function onHostnameSet(errHostname) {
      if (errHostname) {
        done(errHostname);
      } else {
        config.automaticIp = true;
        network.setIpv4Configuration(config, function onIpv4Set(errIpv4) {
          if (errIpv4) {
            done(err);
          } else {
            fs.writeFile(CONFIGURATION_FILE, JSON.stringify(DEFAULT_CONFIGURATION_FILE), 'utf8', done);
          }
        });
      }
    });
  });
};

module.exports = {
  getAdministrationSettings: getAdministrationSettings,
  setAdministrationSettings: setAdministrationSettings,
  getRadioSettings: getRadioSettings,
  setRadioSettings: setRadioSettings,
  setDefaultSettings: setDefaultSettings
};
