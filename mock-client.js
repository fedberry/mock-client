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
      takeTask(serverAnswer.task);
    }

    console.log(serverAnswer);
  });

}

const takeTask = function(task) {

  var takeTaskRequest = {
    method: 'delegate'
  }
  debug.debug('Take task request: %s', JSON.stringify(takeTaskRequest, null, 2));

  mockServer.put(task.tid, token, takeTaskRequest, function(err, serverAnswer) {
    if (err) {
      console.log('---');
      console.log(err);
      console.log(err.stack);
    } else {
      task.reportInterval = setInterval(reportTask, 2000, task);
      initTask(task);
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
    task.log = task.log + "mkdir " + ROOTDIR + 'tasks'  + task.tid + "\n";
  }

  if(fs.existsSync(ROOTDIR + 'tasks/' + task.tid)){
    deleteFolderRecursive(ROOTDIR + 'tasks/' + task.tid);
    task.log = task.log + "remove  " + ROOTDIR + 'tasks/'  + task.tid + "\n";
  }

  fs.mkdirSync(ROOTDIR + 'tasks/' + task.tid);
  task.log = task.log + "mkdir  " + ROOTDIR + 'tasks/'  + task.tid + "\n";

  exec('cd ' + ROOTDIR + 'tasks/' + task.tid + ' && wget ' + task.url, function(error, stdout, stderr) {
    if (error) {
      debug.log('TaskID %s Failed.', task.tid);
      debug.log(stdout + stderr);
      return;
    } else {
      debug.debug('[%s] File downloaded', task.tid);
    }
    task.log = task.log + "Download  " + task.url + "\n";
    task.log = task.log + stdout + stderr;
  });
}

const deleteFolderRecursive = function(path) {
  if( fs.existsSync(path) ) {
    fs.readdirSync(path).forEach(function(file,index){
      var curPath = path + "/" + file;
      if(fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
};
