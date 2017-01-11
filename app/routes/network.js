var router = require('express').Router(); // eslint-disable-line new-cap
var settings = require('../models/settings');
var administration = require('./administration');
var os = require('os');

var get = function get(req, res) {
  settings.getNetworkSettings(function onNetworkSettingsReturned(err, netSettings) {
    if (err) {
      res.sendStatus(500);
    } else {
      res.json(netSettings);
    }
  });
};

var post = function post(req, res) {
  if (!req.body) {
    res.sendStatus(400);
    return;
  }

  settings.setNetworkSettings(req.body, function onNetworkSettingsSet(err) {
    var json = null;
    var address;
    var interfaces;

    if (err) {
      res.sendStatus(500);
    } else {
      /* eslint-disable no-restricted-syntax */
      for (interfaces in os.networkInterfaces()) {
        if (!os.networkInterfaces()[interfaces][0].internal) {
          address = os.networkInterfaces()[interfaces][0].address;
        }
      }
      /* eslint-disable no-restricted-syntax */

      json = {
        gatewayIp: address
      };

      res.json(json);
      administration.postReboot();
    }
  });
};

router.get('/', get);
router.post('/', post);

module.exports = {
  router: router
};
