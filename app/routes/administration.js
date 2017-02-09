var router = require('express').Router(); // eslint-disable-line new-cap
var settings = require('../models/settings');
var exec = require('child_process').exec;
var network = require('../models/network');

var get = function get(req, res) {
  settings.getAdministrationSettings(function onAdministrationSettingsReturned(err, admSettings) {
    if (err) {
      res.sendStatus(500);
    } else {
      res.json(admSettings);
    }
  });
};

var post = function post(req, res) {
  if (!req.body) {
    res.sendStatus(400);
    return;
  }

  settings.setAdministrationSettings(req.body, function onAdministrationSettingsSet(err) {
    if (err) {
      res.sendStatus(500);
    } else {
      res.end();
    }
  });
};

var postReboot = function postReboot(req, res) {
  var json = [];

  exec('reboot', function reboot(error) {
    if (error !== null) {
      res.sendStatus(500);
    } else {
      /* eslint-disable no-lonely-if */
      if (req.body.ipaddress === undefined) {
        network.getIpv4Configuration(function onIpv4Configuration(errIpv4, networkObj) {
          if (errIpv4) {
            res.sendStatus(500);
          } else {
            json = {
              gatewayIp: networkObj.ipaddress
            };
            res.json(json);
          }
        });
      } else {
        json = {
          gatewayIp: req.body.ipaddress
        };
        res.json(json);
      }
      /* eslint-disable no-lonely-if */
    }
  });
};

var postRestore = function postRestore(req, res) {
  settings.setDefaultSettings(function onAdministrationSettingsDefaultSet(err) {
    if (err) {
      res.sendStatus(500);
    } else {
      postReboot(req, res);
    }
  });
};

router.get('/', get);
router.post('/', post);
router.post('/reboot', postReboot);
router.post('/restore', postRestore);

module.exports = {
  router: router,
  postReboot: postReboot
};
