var router = require('express').Router(); // eslint-disable-line new-cap
var settings = require('../models/settings');
var exec = require('child_process').exec;
var network = require('../models/network');
var os = require('os');

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
  var address;
  var interfaces;
  var networkInterfaces = os.networkInterfaces();

  exec('reboot', function reboot(error) {
    if (error !== null) {
      res.sendStatus(500);
    } else {
     /* eslint-disable no-restricted-syntax */
      for (interfaces in networkInterfaces) {
        if (!networkInterfaces[interfaces][0].internal) {
          address = networkInterfaces[interfaces][0].address;
        }
      }
      /* eslint-disable no-restricted-syntax */

      json = {
        gatewayIp: address
      };

      res.json(json);
    }
  });
};

var postRestore = function postRestore(req, res) {
  settings.setDefaultSettings(function onAdministrationSettingsDefaultSet(err) {
    if (err) {
      res.sendStatus(500);
    } else {
      network.setHostname('knot', function onHostnameSet(errHostname) {
        var config = {};
        if (errHostname) {
          res.sendStatus(500);
        } else {
          config.automaticIp = true;
          network.setIpv4Configuration(config, function onIpv4Set(errIpv4) {
            if (errIpv4) {
              res.sendStatus(500);
            } else {
              postReboot(req, res);
            }
          });
        }
      });
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
