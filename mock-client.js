#!/usr/bin/node --harmony
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
require('dotenv-save').config({path: '/etc/mock-client/mock-client.config'});
const exec = require('child_process').exec;

// Debug module.
const debugF = require('debug');

const debug = {
  log: debugF('mock-client:log'),
  debug: debugF('mock-client:debug')
};

const netInterfaces = require('os').networkInterfaces();
const interfaceInfo = netInterfaces[process.env.INTERFACE].pop();

var mac, token, token_expire, arch;

if(!interfaceInfo.mac){
  mac = fs.readFileSync('/sys/class/net/' + process.env.INTERFACE + '/address').toString().trim();
} else {
  mac = interfaceInfo.mac;
}

exec('arch', initService) ;

function initService(error, stdout, stderr) {
  arch = stdout.toString().trim();

  var mcluster = new Cluster({
    count: 1
  });

  if (!mcluster.isMaster) {

    let mockServer = new RestClient({
      URL: process.env.MOCK_SERVER + '/api/auth',
      secureKey: process.env.SECRET
    });

    debug.log('Requesting token.');

    var tokenRequest = {
      method: 'token',
      MAC: mac,
      arch:  arch
    }

    debug.debug('Token request: %s', JSON.stringify(tokenRequest, null, 2));

    mockServer.post(tokenRequest, function(err, serverAnswer) {
      if (err) {
        console.log('---');
        console.log(err);
        console.log(err.stack);
      }

      console.log(serverAnswer);
      mockServer.settings.URL = process.env.MOCK_SERVER + '/api/task';
      token = serverAnswer.token;
      token_expire = serverAnswer.expire;

      setInterval(requestTask, 2000);

    });
  }
}

const requestTask = function() {

  var taskRequest = {
    MAC: mac,
    arch:  arch
  }
  debug.debug('Task request: %s', JSON.stringify(taskRequest, null, 2));
  mockServer.search(taskRequest, function(err, serverAnswer) {
    if (err) {
      console.log('---');
      console.log(err);
      console.log(err.stack);
    }

    console.log(serverAnswer);
  });

}
