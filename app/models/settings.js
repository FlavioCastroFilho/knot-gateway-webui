var fs = require('fs');
var exec = require('child_process').exec;
var dbus = require('dbus-native');
var sysbus = dbus.systemBus();
var connman = sysbus.getService('net.connman');
/* eslint-disable no-unused-vars */
var sleep = require('sleep');// how to get the automatic ip for rebooting? maybe a delay?
/* eslint-disable no-unused-vars */

var CONFIGURATION_FILE = require('../config').CONFIGURATION_FILE;
var DEFAULT_CONFIGURATION_FILE = require('../config/gatewayFactoryConfig.json');
var DEVICES_FILE = require('../config').DEVICES_FILE;

var writeFile = function writeFile(type, incomingData, done) {
  fs.readFile(CONFIGURATION_FILE, 'utf8', function onRead(err, data) {
    var localData;
    var cmd;
    var interface;

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
      cmd = 'echo ' + incomingData.hostname;
      exec(cmd, function hostname(error) {
        if (error !== null) {
          console.log(error);
          done(error);
        } else {
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
              }

              interface = res[0][0];
              if (!incomingData.automaticIp) {
                connman.getInterface(interface, 'net.connman.Service', function (errInterface, iface) {
                  if (errInterface) {
                    console.log(errInterface);
                    done(errInterface);
                  }
                  /* eslint-disable new-cap */
                  iface.SetProperty(
                    'IPv4.Configuration',
                    ['a{sv}',
                      [// a
                        [// {
                          [// [0]
                            'Method', // s
                            ['s', 'manual'] // v
                          ],
                          [// [1]
                            'Address', // s
                            ['s', incomingData.ipaddress]
                          ],
                          [// [2]
                            'Netmask', // s
                            ['s', incomingData.networkMask]
                          ],
                          [// [3]
                            'Gateway', // s
                            ['s', incomingData.defaultGateway]
                          ]
                        ]// }
                      ]
                    ],
                    function (errInterface2) {
                      if (errInterface2) {
                        console.log(errInterface2);
                        done(errInterface2);
                      }
                    }
                  );
                  /* eslint-disable new-cap */
                });
              } else {
                connman.getInterface(interface, 'net.connman.Service', function (errInterface, iface) {
                  if (errInterface) {
                    console.log(errInterface);
                    done(errInterface);
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
                      }
                    }
                  );
                  /* eslint-disable new-cap */
                });
              }
            });
            /* eslint-disable new-cap */
          });
        }
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
        connman.getInterface('/', 'net.connman.Manager', function (errConnman, nm) {
          if (errConnman) {
            done(errConnman);
            return;
          }
          /* eslint-disable new-cap */
          nm.GetServices(function (errServices, res) {
            if (errServices) {
              done(errServices);
              return;
            }

            if (res[0][1][8][1][1][0][0][1][1][0] === 'dhcp') {
              obj.network.automaticIp = true;
            } else {
              obj.network.automaticIp = false;
            }

            obj.network.ipaddress = res[0][1][8][1][1][0][1][1][1][0];
            obj.network.networkMask = res[0][1][8][1][1][0][2][1][1][0];
            obj.network.defaultGateway = res[0][1][8][1][1][0][3][1][1][0];
            fs.readFile('/etc/hostname', 'utf8', function onReadHostname(errHostname, dataHostname) {
              if (errHostname) {
                done(errHostname);
                return;
              }
              obj.network.hostname = dataHostname;
              done(null, obj.network);
            });
          });
          /* eslint-disable new-cap */
        });
      } catch (e) {
        done(e);
      }
    }
  });
};

var setNetworkSettings = function setNetworkSettings(settings, done) {
  writeFile('net', settings, done);
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
    /* eslint-disable no-lone-blocks */
    {
      connman.getInterface(interface, 'net.connman.Service', function (errInterface, iface) {
        if (errInterface) {
          console.log(errInterface);
          done(errInterface);
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
            }
          }
        );
        /* eslint-disable new-cap */
      });
    }
    /* eslint-disable no-lone-blocks */
    fs.writeFile(CONFIGURATION_FILE, JSON.stringify(DEFAULT_CONFIGURATION_FILE), 'utf8', done);
  });
};

module.exports = {
  getAdministrationSettings: getAdministrationSettings,
  setAdministrationSettings: setAdministrationSettings,
  getRadioSettings: getRadioSettings,
  setRadioSettings: setRadioSettings,
  getNetworkSettings: getNetworkSettings,
  setNetworkSettings: setNetworkSettings,
  setDefaultSettings: setDefaultSettings
};
