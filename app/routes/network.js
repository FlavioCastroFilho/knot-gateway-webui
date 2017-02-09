var router = require('express').Router(); // eslint-disable-line new-cap
var settings = require('../models/settings');
var administration = require('./administration');

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
    if (err) {
      res.sendStatus(500);
    } else {
      /* eslint-disable no-lonely-if */
      if (!req.body.automaticIp) {
        administration.postReboot(req, res, req.body.ipaddress);
      } else {
        administration.postReboot(req, res);
      }
      /* eslint-disable no-lonely-if */
    }
  });
};

router.get('/', get);
router.post('/', post);

module.exports = {
  router: router
};
