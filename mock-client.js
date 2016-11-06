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
const spawn = require('child_process').spawn;
const ROOTDIR = '/home/mockclient/';
const request = require('request');

// Debug module.
const debugF = require('debug');

const debug = {
  log: debugF('mock-client:log'),
  debug: debugF('mock-client:debug')
};

var token, tokenExpire, arch, mockServer;

var identificationID = process.env.IDENTIFICATION_ID;

exec('arch', initService) ;

function initService(error, stdout, stderr) {
  arch = stdout.toString().trim();
  var count = 1;

  if (process.env.CHILDCOUNT) {
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
    requestToken(function(answer) {
      token = answer.token;
      tokenExpire = answer.expire;
      requestTask();
    });
  }
}

const requestToken = function(callback) {
  debug.log('Requesting token.');

  var tokenRequest = {
    method: 'token',
    identificationID: identificationID,
    arch:  arch
  }

  debug.debug('Token request: %s', JSON.stringify(tokenRequest, null, 2));

  mockServer.settings.URL = process.env.MOCK_SERVER + '/api/auth';
  mockServer.post(tokenRequest, function(err, serverAnswer) {
    if (err) {
      console.log('---');
      console.log(err);
      console.log(err.stack);
      requestToken(callback);
    } else {
      callback(serverAnswer);
    }
  });
}

const requestTask = function() {

  var taskRequest = {
    identificationID: identificationID,
    arch:  arch
  }

  mockServer.settings.URL = process.env.MOCK_SERVER + '/api/task';

  debug.debug('Task request: %s', JSON.stringify(taskRequest, null, 2));
  mockServer.search(taskRequest, function(err, serverAnswer) {
    if (err) {
      console.log('---');
      console.log(err);
      console.log(err.stack);
    } else {
      if (serverAnswer.task) {
        takeTask(serverAnswer.task);
      } else {
        setTimeout(requestTask, 5000);
      }
    }
  });

}

const takeTask = function(task) {

  // Init task log.
  task.log = '';

  var takeTaskRequest = {
    method: 'delegate'
  }
  debug.debug('Take task request: %s', JSON.stringify(takeTaskRequest, null, 2));

  mockServer.put(task.tid, token, takeTaskRequest, function(err, serverAnswer) {
    if (err) {
      console.log('---');
      console.log(err);
      console.log(err.stack);
      setTimeout(requestTask, 5000);
    } else {
      debug.debug('Take answer %s', JSON.stringify(serverAnswer, null, 2));
      task.reportInterval = setInterval(reportTask, 2000, task);
      initTask(task);
    }
  });

}

const reportTask = function(task) {
  debug.log('Report Task %s.', JSON.stringify(task, null, 2));
  var reportTaskRequest = {
    method: 'update',
    mock: {}
  }

  var buffer = new Buffer(task.log);
  reportTaskRequest.log = buffer.toString('base64');

  var buildLog = ROOTDIR + 'tasks/' + task.tid + '/result/build.log';
  if (fs.existsSync(buildLog)) {
    reportTaskRequest.mock.build = fs.readFileSync(buildLog).toString('base64');
  }

  var rootLog = ROOTDIR + 'tasks/' + task.tid + '/result/root.log';
  if (fs.existsSync(rootLog)) {
    reportTaskRequest.mock.root = fs.readFileSync(rootLog).toString('base64');
  }

  var stateLog = ROOTDIR + 'tasks/' + task.tid + '/result/state.log';
  if (fs.existsSync(stateLog)) {
    reportTaskRequest.mock.state = fs.readFileSync(stateLog).toString('base64');
  }

  debug.debug('Update task request: %s', JSON.stringify(reportTaskRequest, null, 2));

  mockServer.put(task.tid, token, reportTaskRequest, function(err, serverAnswer) {
    if (err) {
      console.log('---');
      console.log(err);
      console.log(err.stack);
    }
    console.log(serverAnswer);
  });
}

const reportFinishedTask = function(task, status) {
  debug.log('Report Finished Task %s.', JSON.stringify(task, null, 2));
  var reportTaskRequest = {
    method: 'finished',
    status: status,
    mock: {}
  }

  var buffer = new Buffer(task.log);
  reportTaskRequest.log = buffer.toString('base64');

  var buildLog = ROOTDIR + 'tasks/' + task.tid + '/result/build.log';
  if (fs.existsSync(buildLog)) {
    reportTaskRequest.mock.build = fs.readFileSync(buildLog).toString('base64');
  }

  var rootLog = ROOTDIR + 'tasks/' + task.tid + '/result/root.log';
  if (fs.existsSync(rootLog)) {
    reportTaskRequest.mock.root = fs.readFileSync(rootLog).toString('base64');
  }

  var stateLog = ROOTDIR + 'tasks/' + task.tid + '/result/state.log';
  if (fs.existsSync(stateLog)) {
    reportTaskRequest.mock.state = fs.readFileSync(stateLog).toString('base64');
  }

  debug.debug('Update task request: %s', JSON.stringify(reportTaskRequest, null, 2));

  mockServer.put(task.tid, token, reportTaskRequest, function(err, serverAnswer) {
    if (err) {
      console.log('---');
      console.log(err);
      console.log(err.stack);
    }
    console.log(serverAnswer);
  });
}

const initTask = function(task) {
  if (!fs.existsSync(ROOTDIR + 'tasks')) {
    fs.mkdirSync(ROOTDIR + 'tasks');
    task.log = task.log + 'mkdir ' + ROOTDIR + 'tasks' + '\n';
  }

  if (fs.existsSync(ROOTDIR + 'tasks/' + task.tid)) {
    deleteFolderRecursive(ROOTDIR + 'tasks/' + task.tid);
    task.log = task.log + 'remove  ' + ROOTDIR + 'tasks/'  + task.tid + '\n';
  }

  fs.mkdirSync(ROOTDIR + 'tasks/' + task.tid);
  task.log = task.log + 'mkdir  ' + ROOTDIR + 'tasks/'  + task.tid + '\n';

  fs.mkdirSync(ROOTDIR + 'tasks/' + task.tid + '/result');
  task.log = task.log + 'mkdir  ' + ROOTDIR + 'tasks/'  + task.tid + '/result' + '\n';

  exec('cd ' + ROOTDIR + 'tasks/' + task.tid + ' && wget -q ' + task.url, function(error, stdout, stderr) {
    if (error) {
      debug.log('TaskID %s Failed.', task.tid);
      debug.log(stdout + stderr);
      reportFinishedTask(task, 'failure');
      clearInterval(task.reportInterval);
      setTimeout(requestTask, 5000);
    } else {
      debug.debug('[%s] File downloaded', task.tid);
      task.log = task.log + 'Downloaded  ' + task.url + '\n';
      console.log(stdout + stderr);
      runMock(task);
    }
  });
}

const runMock = function(task) {
  var options = process.env.MOCK_OPTIONS.split(' ');
  var options2 = [
    '-r', process.env.MOCK_CONFIG,
    '--rebuild', ROOTDIR + 'tasks/' + task.tid + '/' + require('path').basename(task.url),
    '--resultdir', ROOTDIR + 'tasks/' + task.tid + '/result'
  ]
  const mockRun = spawn('mock', options2.concat(options));

  debug.debug('Token request: %s', JSON.stringify(options2.concat(options), null, 2));

  task.log = task.log +  'mock' + process.env.MOCK_OPTIONS
    + ' -r ', process.env.MOCK_CONFIG
    + ' --rebuild ' + ROOTDIR + 'tasks/' + task.tid + '/' + require('path').basename(task.url)
    + ' --resultdir ' + ROOTDIR + 'tasks/' + task.tid + '/result';

  mockRun.stdout.on('data', function(data) {
    console.log('stdout: %s', data);
    task.log = task.log + 'stdout: ' + data;
  });

  mockRun.stderr.on('data', function(data) {
    console.log('stderr: %s', data);
    task.log = task.log + 'stderr: ' + data;

  });

  mockRun.on('close', function(code) {
    console.log('child process exited with code %s', code);
    task.log = task.log + 'Mock finished with code: ' + code;
    clearInterval(task.reportInterval);

    if (code == 0) {
      postResultRPMs(task);
      reportFinishedTask(task, 'success');
    } else {
      reportFinishedTask(task, 'failure');
    }

    setTimeout(requestTask, 5000);
  });
}

const deleteFolderRecursive = function(path) {
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach(function(file,index) {
      var curPath = path + '/' + file;
      if (fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
};

const postResultRPMs = function(task) {
  var startPath = ROOTDIR + 'tasks/' + task.tid + '/result';
  var filter = /\.rpm$/;

  if (!fs.existsSync(startPath)) {
    console.log('no dir ',startPath);
    return;
  }

  var files = fs.readdirSync(startPath);
  for (var i = 0; i < files.length; i++) {
    var filename = startPath + '/' + files[i];
    var stat = fs.lstatSync(filename);
    if (stat.isFile()) {
      if (filter.test(filename)) {
        sendFile(task, filename);
      };
    };
  };
};

const sendFile = function(task, file) {
  console.log('Found: ' + file);
  var url = process.env.MOCK_SERVER + '/api/task/' + task.tid;
  console.log(' POST to: ' + url);

  var headers = {
    token: token,
    'User-Agent': 'RestClient.' + process.env.npm_package_version,
    'content-type': 'application/x-redhat-package-manager',
    filename: require('path').basename(file),
  }

  request({
    method: 'POST',
    url: url,
    body: fs.readFileSync(file),
    headers: headers
  }, function optionalCallback(err, httpResponse, body) {
    if (err) {
      return console.error('upload failed:', err);
    }
    console.log('Upload successful!  Server responded with:', body);
  });
}
