var dbus = require('dbus-native');
var sysbus = dbus.systemBus();
var connman = sysbus.getService('net.connman');
var fs = require('fs');

var parseService = function parseService(service) {
  var serviceObj = {};
  var i;

  // service is:
  // [i] the network interface
  // [i][0] the name of the network interface
  // [i][1] the structure of the network interface
  // [i][1][8][1][1][0] the ipv4 structure of the first ethernet network interface

  for (i = 0; i < service.length; i += 1) {
    if (service[i][1][0][1][1][0] === 'ethernet') {
      serviceObj.ifacePath = service[i][0];
      serviceObj.ipv4 = service[i][1][8][1][1][0];
      break;
    }
  }

  serviceObj.method = serviceObj.ipv4[0][1][1][0];
  serviceObj.ipaddress = serviceObj.ipv4[1][1][1][0];
  serviceObj.networkMask = serviceObj.ipv4[2][1][1][0];
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
      var serviceObj;
      if (errServices) {
        console.log(errServices);
        done(errServices);
        return;
      }

      serviceObj = parseService(services);

      connman.getInterface(serviceObj.ifacePath, 'net.connman.Service', function (errInterface, iface) {
        var ipv4Configuration;
        if (errInterface) {
          console.log(errInterface);
          done(errInterface);
          return;
        }

        ipv4Configuration = ['a{sv}',
          [// a
            [// {
              [// [0]
                'Method', // s
                ['s', 'dhcp'] // v
              ]
            ]// }
          ]
        ];

        if (!config.automaticIp) {
          ipv4Configuration = ['a{sv}',
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
          ];
        }
        /* eslint-disable new-cap */
        iface.SetProperty(
          'IPv4.Configuration', ipv4Configuration, function (errInterface2) {
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
