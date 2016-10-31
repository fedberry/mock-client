/**
 * Central Startup file.
 * Launch cluster and workers.
 * React on SIGINT and SIGTERM.
 * restart worker if worker exit.
 */
'use strict';

const Cluster = require('./includes/cluster.js');
const RestClient = require('./includes/restClient.js');
const fs = require('fs');
require('dotenv-save').config();

// Debug module.
const debugF = require('debug');

const debug = {
  log: debugF('mock-client:log'),
  debug: debugF('mock-client:debug')
};

const netInterfaces = require('os').networkInterfaces();
const interfaceInfo = netInterfaces[process.env.INTERFACE].pop();



var mcluster = new Cluster({
  count: 2
});

if (!mcluster.isMaster) {
  let mockServer = new RestClient({
    URL: process.env.MOCK_SERVER + '/api/auth',
    secureKey: process.env.SECRET
  });

  debug.log('Requesting token.');

  var tokenRequest = {
    method: 'token',
    MAC: interfaceInfo.mac,
    arch:  process.arch
  }
  mockServer.post(tokenRequest, function(err, taskAnswer) {
    if (err) {
      console.log('---');
      console.log(err);
      console.log(err.stack);
    }

    console.log(taskAnswer);
    setInterval(function(token, expire) {
      console.log(token);
      console.log(expire);
    }, 2000, taskAnswer.token, taskAnswer.expire);

  });
}
