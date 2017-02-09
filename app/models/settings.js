var fs = require('fs');
var dbus = require('dbus-native');
var sysbus = dbus.systemBus();
var connman = sysbus.getService('net.connman');

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
  var interface;

  fs.writeFile('/etc/hostname', 'knot', 'utf8', null);
  fs.writeFile(DEVICES_FILE, JSON.stringify(keys), 'utf8', null);
  fs.readFile(CONFIGURATION_FILE, 'utf8', function onRead(err, data) {
    var localData;
    if (err) {
      done(err);
      return;
    }
    localData = JSON.parse(data);

    DEFAULT_CONFIGURATION_FILE.radio.mac = localData.radio.mac;
    connman.getInterface('/', 'net.connman.Manager', function (errConnman, nm) {
      if (errConnman) {
        done(errConnman);
        return;
      }
      /* eslint-disable new-cap */
      nm.GetServices(function (errServices, res) {
        if (errServices) {
          console.log(errServices);
          done(errServices);
          return;
        }

        interface = res[0][0];
        connman.getInterface(interface, 'net.connman.Service', function (errInterface, iface) {
          if (errInterface) {
            console.log(errInterface);
            done(errInterface);
            return;
          }
          /* eslint-disable new-cap */
          iface.SetProperty(
            'IPv4.Configuration',
            ['a{sv}',
              [// a
                [// {
                  [// [0]
                    'Method', // s
                    ['s', 'dhcp'] // v
                  ]
                ]// }
              ]
            ],
            function (errInterface2) {
              if (errInterface2) {
                console.log(errInterface2);
                done(errInterface2);
                return;
              }
              fs.writeFile(CONFIGURATION_FILE, JSON.stringify(DEFAULT_CONFIGURATION_FILE), 'utf8', done);
              return;
            }
          );
          /* eslint-disable new-cap */
        });
      });
      /* eslint-disable new-cap */
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
