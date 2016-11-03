/**
 * Send status.
 */
'use strict';

const fs = require('fs');
const RestClient = require('./includes/restClient.js');
const DotEnv = require('dotenv-save');
const execSync = require('child_process').execSync;

DotEnv.config();

let mockServer = new RestClient({
  URL: process.env.MOCK_SERVER + '/api/auth'
});

const netInterfaces = require('os').networkInterfaces();
const interfaceInfo = netInterfaces[process.env.INTERFACE].pop();

var mac = '';
if(!interfaceInfo.mac){
  mac = execSync('cat /sys/class/net/' + process.env.INTERFACE + '/address').toString()
} else {
  mac = interfaceInfo.mac;
}

var authRequest = {
  method: 'register',
  MAC: mac,
  arch:  execSync('arch').toString()
}
console.log(authRequest);

mockServer.post(authRequest, function(err, taskAnswer) {
  if (err) {
    console.log('---');
    console.log(err);
    console.log(err.stack);
  } else {
    if(!taskAnswer.error) {
      DotEnv.set('SECRET', taskAnswer.secret);
    }
  }

  console.log(taskAnswer);
});
