#!/usr/bin/node --harmony
/**
 * Send status.
 */
'use strict';

const fs = require('fs');
const RestClient = require('./includes/restClient.js');
const DotEnv = require('dotenv-save');
const exec = require('child_process').exec;

DotEnv.config({path: '/etc/mock-client/mock-client.config'});

let mockServer = new RestClient({
  URL: process.env.MOCK_SERVER + '/api/auth'
});

var identificationID = require('crypto').randomBytes(20).toString('hex');

exec('arch', sendRegisterRequest) ;

function sendRegisterRequest(error, stdout, stderr) {
  var arch = stdout.toString().trim();
  var authRequest = {
    method: 'register',
    identificationID: identificationID,
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
        DotEnv.set('SECRET', taskAnswer.secret, {path: '/etc/mock-client/mock-client.config'});
        DotEnv.set('IDENTIFICATION_ID', identificationID, {path: '/etc/mock-client/mock-client.config'});
      }
      console.log('Agent registered. identificationID:' + identificationID + ' ARCH:' + arch)
    }
  });
}
