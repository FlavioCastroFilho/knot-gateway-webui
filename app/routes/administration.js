var router = require('express').Router(); // eslint-disable-line new-cap
var settings = require('../models/settings');
var exec = require('child_process').exec;

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

var postReboot = function post(req, res) {
  var child = exec('reboot', function (error, stdout, stderr) {
          console.log(`stdout: ${stdout}`);
          console.error(`stderr: ${stderr}`);
          if (error !== null) {
            res.sendStatus(500);
          }else {
            res.sendStatus(204);
          }
  });
};

router.get('/', get);
router.post('/', post);
router.post('/reboot', postReboot);

module.exports = {
  router: router
};
