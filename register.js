/**
 * Send status.
 */
'use strict';

const fs = require('fs');
const RestClient = require('./includes/restClient.js');

let mockServer = new RestClient({
  URL: process.env.MOCK_SERVER + '/api/auth'
});

const netInterface = require('os').networkInterfaces();
console.log(netInterface);

var authRequest = {
  MAC: netInterface,
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