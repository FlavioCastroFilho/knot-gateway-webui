var fs = require('fs');
var database = require('./../database');
var os = require('os');

var CONFIGURATION_FILE = require('../config').CONFIGURATION_FILE;

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
    } else if (type === 'net') {
      localData.network.automaticIp = incomingData.automaticIp;

      if (!incomingData.automaticIp) {
        localData.network.ipaddress = incomingData.ipaddress;
        localData.network.defaultGateway = incomingData.defaultGateway;
        localData.network.networkMask = incomingData.networkMask;
      } else {
        localData.network.ipaddress = '';
        localData.network.defaultGateway = '';
        localData.network.networkMask = '';
      }
    } else if (type === 'cloud') {
      database.configuration.find(function (error, docs) {
        var configurationCollection = docs;
        var address;
        var interfaceNames;
        var networkInterfaces = os.networkInterfaces();

        for (interfaceNames in networkInterfaces) { // eslint-disable no-restricted-syntax
          if (!networkInterfaces[interfaceNames][0].internal) {
            address = networkInterfaces[interfaceNames][0].address;
            break;
          }
        }

        if (configurationCollection[0]) {
          database.configuration.update({ host_name: os.hostname() },
            {
              $set: {
                parent_ip: incomingData.ip,
                parent_port: incomingData.port,
                local_ip: address
              }
            }, { multi: true }, function () {
              // the update is complete
            });
        } else {
          database.configuration.save({
            host_name: os.hostname(),
            local_ip: address,
            local_port: 3000,
            parent_ip: incomingData.ip,
            parent_port: incomingData.port
          });
        }
        return docs;
      });
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

var getNetworkSettings = function getNetworkSettings(done) {
  fs.readFile(CONFIGURATION_FILE, 'utf8', function onRead(err, data) {
    var obj;

    if (err) {
      done(err);
    } else {
      try {
        obj = JSON.parse(data);
        done(null, obj.network);
      } catch (e) {
        done(e);
      }
    }
  });
};

var setNetworkSettings = function setNetworkSettings(settings, done) {
  writeFile('net', settings, done);
};

var getCloudSettings = function getCloudSettings(done) {
  database.configuration.find(function (err, docs) {
    var configurationCollection = docs;

    fs.readFile(CONFIGURATION_FILE, 'utf8', function onRead(error, data) {
      var localData;
      var radioObj;

      if (err) {
        done(err);
      } else {
        try {
          localData = JSON.parse(data);
          if (configurationCollection[0] !== undefined) {
            radioObj = {
              ip: configurationCollection[0].parent_ip,
              port: configurationCollection[0].parent_port,
              uuid: configurationCollection[0].uuid,
              token: configurationCollection[0].token
            };
            localData.cloud.uuid = configurationCollection[0].uuid;
            localData.cloud.token = configurationCollection[0].token;
            fs.writeFile(CONFIGURATION_FILE, JSON.stringify(localData), 'utf8');
          } else {
            radioObj = {
              ip: null,
              port: null,
              uuid: null,
              token: null
            };
          }
          done(null, radioObj);
        } catch (e) {
          done(e);
        }
      }
    });
    return docs;
  });
};

var setCloudSettings = function setCloudSettings(settings, done) {
  writeFile('cloud', settings, done);
};

module.exports = {
  getAdministrationSettings: getAdministrationSettings,
  setAdministrationSettings: setAdministrationSettings,
  getRadioSettings: getRadioSettings,
  setRadioSettings: setRadioSettings,
  getNetworkSettings: getNetworkSettings,
  setNetworkSettings: setNetworkSettings,
  getCloudSettings: getCloudSettings,
  setCloudSettings: setCloudSettings
};
