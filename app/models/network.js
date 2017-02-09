var dbus = require('dbus-native');
var sysbus = dbus.systemBus();
var connman = sysbus.getService('net.connman');
var fs = require('fs');

var parseService = function parseService(service) {
  var serviceObj = {};
  // get the ipv4 array from the service array
  serviceObj.ipv4 = service[0][1][8][1][1][0];
  // get the method value from the ipv4 array
  serviceObj.method = serviceObj.ipv4[0][1][1][0];
  // get the ip address value from the ipv4 array
  serviceObj.ipaddress = serviceObj.ipv4[1][1][1][0];
  // get the network mask value from the ipv4 array
  serviceObj.networkMask = serviceObj.ipv4[2][1][1][0];
  // get the default gateway value from the ipv4 array
  serviceObj.defaultGateway = serviceObj.ipv4[3][1][1][0];

  return serviceObj;
};

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
  fs.writeFile('/etc/hostname', hostname, 'utf8', done);
};

var getIpv4Configuration = function getIpv4Configuration(done) {
  var network = {};
  var serviceObj;

  connman.getInterface('/', 'net.connman.Manager', function (errGetInterface, manager) {
    if (errGetInterface) {
      done(errGetInterface);
      return;
    }
    /* eslint-disable new-cap */
    manager.GetServices(function (errServices, services) {
      if (errServices) {
        done(errServices);
        return;
      }

      serviceObj = parseService(services);

      if (serviceObj.method === 'dhcp') {
        network.automaticIp = true;
      } else {
        network.automaticIp = false;
      }

      network.ipaddress = serviceObj.ipaddress;
      network.networkMask = serviceObj.networkMask;
      network.defaultGateway = serviceObj.defaultGateway;

      done(null, network);
    });
    /* eslint-disable new-cap */
  });
};

var setIpv4Configuration = function setIpv4Configuration(config, done) {
  connman.getInterface('/', 'net.connman.Manager', function (errGetInterface, manager) {
    if (errGetInterface) {
      done(errGetInterface);
      return;
    }
    /* eslint-disable new-cap */
    manager.GetServices(function (errServices, services) {
      var ifacePath;
      if (errServices) {
        console.log(errServices);
        done(errServices);
        return;
      }

      ifacePath = services[0][0];
      connman.getInterface(ifacePath, 'net.connman.Service', function (errInterface, iface) {
        if (errInterface) {
          console.log(errInterface);
          done(errInterface);
          return;
        }
        if (!config.automaticIp) {
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
        } else {
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
        }
      });
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
