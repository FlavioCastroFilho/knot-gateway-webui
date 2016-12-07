var router = require('express').Router(); // eslint-disable-line new-cap
var settings = require('../models/settings');

var get = function get(req, res) {
  settings.getCloudSettings(function onCloudSettingsReturned(err, cloudSettings) {
    if (err) {
      res.sendStatus(500);
    } else {
      res.json(cloudSettings);
    }
  });
};

var post = function post(req, res) {
  if (!req.body) {
    res.sendStatus(400);
    return;
  }

  settings.setCloudSettings(req.body, function onCloudSettingsSet(err) {
    if (err) {
      res.sendStatus(500);
    } else {
      res.end();
    }
  });
};

router.get('/', get);
router.post('/', post);

module.exports = {
  router: router
};
