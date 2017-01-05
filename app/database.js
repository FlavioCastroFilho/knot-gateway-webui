var config = require('./config');

var mongojs = require('mongojs');
var db = mongojs(config.mongo.databaseUrl);

module.exports = {
  user: db.collection('user'),
  configuration: db.collection('configuration')
};
