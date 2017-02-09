var router = require('express').Router(); // eslint-disable-line new-cap
var network = require('../models/network');
var administration = require('./administration');

var get = function get(req, res) {
  network.getHostname(function onHostnameReturned(err, hostname) {
    if (err) {
      res.sendStatus(500);
      console.log(err);
    } else {
      network.getIpv4Configuration(function onIpv4Configuration(errIpv4, networkObj) {
        if (errIpv4) {
          res.sendStatus(500);
        } else {
          networkObj.hostname = hostname;
          networkObj.automaticDns = true;
          res.json(networkObj);
        }
      });
    }
  });
};

var post = function post(req, res) {
  if (!req.body) {
    res.sendStatus(400);
    return;
  }

  network.setHostname(req.body.hostname, function onHostnameSet(err) {
    if (err) {
      res.sendStatus(500);
    } else {
      network.setIpv4Configuration(req.body, function onIpv4Set(errIpv4) {
        if (errIpv4) {
          res.sendStatus(500);
        } else {
          administration.postReboot(req, res);
        }
      });
    }
  });
};

router.get('/', get);
router.post('/', post);

module.exports = {
  router: router
};
