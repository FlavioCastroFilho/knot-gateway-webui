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
      iface.Get('org.cesar.knot.nrf0.Adapter', 'Address', function (err2, Address) {
        if (err2) {
          console.log(err2);
          done(err2);
        } else {
          radioObj = {
            mac: Address[1]
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
