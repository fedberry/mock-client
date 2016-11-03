/**
 * Send status.
 */
'use strict';

const fs = require('fs');
const RestClient = require('./includes/restClient.js');
const DotEnv = require('dotenv-save');
const exec = require('child_process').exec;

DotEnv.config();

let mockServer = new RestClient({
  URL: process.env.MOCK_SERVER + '/api/auth'
});

const netInterfaces = require('os').networkInterfaces();
const interfaceInfo = netInterfaces[process.env.INTERFACE].pop();

var mac = '';
if(!interfaceInfo.mac){
  mac = fs.readFileSync('/sys/class/net/' + process.env.INTERFACE + '/address').toString().trim();
} else {
  mac = interfaceInfo.mac;
}

exec('arch', sendRegisterRequest) ;

function sendRegisterRequest(error, stdout, stderr) {
  var arch = stdout.toString().trim();
  var authRequest = {
    method: 'register',
    MAC: mac,
    arch: arch
  }
  console.log(authRequest);

  mockServer.post(authRequest, function(err, taskAnswer) {
    if (err) {
      console.log('Err: ---');
      console.log(err);
      console.log(err.stack);
    } else {
      if(!taskAnswer.error) {
        DotEnv.set('SECRET', taskAnswer.secret);
      }
      console.log('Agent registered. MAC:' + mac + ' ARCH:' + arch)
    }
  });
}
