/**
 * Send status.
 */
'use strict';

const fs = require('fs');
const RestClient = require('./includes/restClient.js');
require('dotenv').config();

let mockServer = new RestClient({
  URL: process.env.MOCK_SERVER + '/api/auth'
});

const netInterfaces = require('os').networkInterfaces();
const interfaceInfo = netInterfaces[process.env.INTERFACE].pop();

var authRequest = {
  MAC: interfaceInfo.mac,
  arch:  process.arch
}
console.log(authRequest);

mockServer.post(authRequest, function(err, taskAnswer) {
  if (err) {
    console.log('---');
    console.log(err);
    console.log(err.stack);
  }

  console.log(taskAnswer);
});