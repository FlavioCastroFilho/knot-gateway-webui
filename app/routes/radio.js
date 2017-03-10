var router = require('express').Router(); // eslint-disable-line new-cap
var radio = require('../models/radio');

var get = function get(req, res) {
  radio.getRadioSettings(function onRadioSettingsReturned(err, radioSettings) {
    if (err) {
      res.sendStatus(500);
    } else {
      res.json(radioSettings);
    }
  });
};

router.get('/', get);

module.exports = {
  router: router
};
