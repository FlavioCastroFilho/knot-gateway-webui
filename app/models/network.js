var exec = require('child_process').exec;
var dbus = require('dbus-native');
var sysbus = dbus.systemBus();
var connman = sysbus.getService('net.connman');
var fs = require('fs');

var getHostname = function getHostname(done) {
  fs.readFile('/etc/hostname', 'utf8', function onReadHostname(err, data) {
    if (err) {
      done(err);
      return;
    }
    done(null, data);
  });
};

var setHostname = function setHostname(hostname, done) {
  var cmd;
  cmd = 'echo ' + hostname + ' > /etc/hostname';
  exec(cmd, function onSetHostname(error) {
    if (error !== null) {
      console.log(error);
      done(error);
      return;
    }
    done();
  });
};

var getIpv4Configuration = function getIpv4Configuration(done) {
  var network = {};

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
        network.automaticIp = true;
      } else {
        network.automaticIp = false;
      }

      network.ipaddress = res[0][1][8][1][1][0][1][1][1][0];
      network.networkMask = res[0][1][8][1][1][0][2][1][1][0];
      network.defaultGateway = res[0][1][8][1][1][0][3][1][1][0];

      done(null, network);
    });
    /* eslint-disable new-cap */
  });
};

var setIpv4Configuration = function setIpv4Configuration(config, done) {
  var interface;
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
      if (!config.automaticIp) {
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
                    ['s', 'manual'] // v
                  ],
                  [// [1]
                    'Address', // s
                    ['s', config.ipaddress]
                  ],
                  [// [2]
                    'Netmask', // s
                    ['s', config.networkMask]
                  ],
                  [// [3]
                    'Gateway', // s
                    ['s', config.defaultGateway]
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
              done();
              return;
            }
          );
          /* eslint-disable new-cap */
        });
      } else {
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
              done();
              return;
            }
          );
          /* eslint-disable new-cap */
        });
      }
    });
    /* eslint-disable new-cap */
  });
};

module.exports = {
  getHostname: getHostname,
  setHostname: setHostname,
  getIpv4Configuration: getIpv4Configuration,
  setIpv4Configuration: setIpv4Configuration
};
