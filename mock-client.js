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
const ROOTDIR = "/home/mockclient/";

// Debug module.
const debugF = require('debug');

const debug = {
  log: debugF('mock-client:log'),
  debug: debugF('mock-client:debug')
};

const netInterfaces = require('os').networkInterfaces();
const interfaceInfo = netInterfaces[process.env.INTERFACE].pop();

var mac, token, token_expire, arch, mockServer;

if(!interfaceInfo.mac){
  mac = fs.readFileSync('/sys/class/net/' + process.env.INTERFACE + '/address').toString().trim();
} else {
  mac = interfaceInfo.mac;
}

// Switch to user mockclient
process.setgid('mock');
process.setuid('mockclient');

exec('arch', initService) ;

function initService(error, stdout, stderr) {
  arch = stdout.toString().trim();
  var count = 1;

  if(process.env.CHILDCOUNT) {
    count = process.env.CHILDCOUNT;
  }

  var mcluster = new Cluster({
    count: 1
  });

  if (!mcluster.isMaster) {

    mockServer = new RestClient({
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
      requestTask();

      //setInterval(requestTask, 2000);

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
    } else {
      serverAnswer.task.reportInterval = setInterval(reportTask, 2000, serverAnswer.task);
      initTask(serverAnswer.task);
    }

    console.log(serverAnswer);
  });

}

const reportTask = function(task) {
  debug.log('Report Task %s.', JSON.stringify(task, null, 2));
}

const initTask = function(task){
  if(!fs.existsSync(ROOTDIR + 'tasks')){
    fs.mkdirSync(ROOTDIR + 'tasks');
  }

  if(!fs.existsSync(ROOTDIR + 'tasks/' + task.tid)){
    fs.mkdirSync(ROOTDIR + 'tasks/' + task.tid);
  }

  exec('cd ' + ROOTDIR + 'tasks/' + task.tid + ' && wget ' + task.url, function(error, stdout, stderr) {
    if (error) {
      debug.log('TaskID %s Failed.', task.tid);
      debug.log(stdout + stderr);
      return;
    } else {
      debug.debug('[%s] File downloaded', task.tid);
    }
  });
}
