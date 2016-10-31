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

// Debug module.
const debugF = require('debug');

require('dotenv').config();

var mcluster = new Cluster({
  count: 2
});

if (!mcluster.isMaster) {
  console.log('Hello World');
  let taskServer = new RestClient({
    URL: process.env.MOCK_SERVER,
    secureKey: process.env.SECRET
  });
  setInterval(function(str1, str2) {
    console.log(str1 + " " + str2);
    var taskRequest = {
      test: 'test'
    }
    taskServer.post(taskRequest, function(err, taskAnswer) {
    if (err) {
      console.log('---');
      console.log(err);
      console.log(err.stack);
    }

    console.log(taskAnswer);
  });
  }, 1000, "Hello.", "How are you?");
}