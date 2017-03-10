var dbus = require('dbus-native');

var bus = dbus.systemBus();
var nrf = bus.getService('org.cesar.knot.nrf');

var getRadioSettings = function getRadioSettings(done) {
  var radioObj;
  nrf.getInterface('/org/cesar/knot/nrf0', 'org.freedesktop.DBus.Properties', function (err, iface) {
    if (err) {
      console.log(err);
      done(err);
    } else {
      /* eslint-disable new-cap */
      iface.Get('org.cesar.knot.nrf0.Adapter', 'Address', function (errGet, address) {
        if (errGet) {
          console.log(errGet);
          done(errGet);
        } else {
          radioObj = {
            // index for variant data type
            mac: address[1]
          };
          done(null, radioObj);
        }
      });
      /* eslint-disable new-cap */
    }
  });
};

module.exports = {
  getRadioSettings: getRadioSettings
};
