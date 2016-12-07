var config = require('./config');

var mongojs = require('mongojs');
var db = mongojs(config.mongo.databaseUrl);
module.exports = {
  user: db.collection('user'),
  configuration: db.collection('configuration')
};

db.on('error', function (err) {
  console.log('database error', err);
});

db.on('connect', function () {
  console.log('database connected');
});
