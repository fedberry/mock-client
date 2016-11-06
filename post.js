#!/usr/bin/node --harmony
/**
 * test Upload script.
 */

const taskId = 2;

const fs = require('fs');
require('dotenv-save').config({path: '/etc/mock-client/mock-client.config'});
const ROOTDIR = '/home/mockclient/';

postFromDir(ROOTDIR + '/tasks/' + taskId + '/result', /\.rpm$/)

function postFromDir(startPath,filter){
  if (!fs.existsSync(startPath)){
      console.log("no dir ",startPath);
      return;
  }

  var files = fs.readdirSync(startPath);
  for(var i=0; i<files.length; i++){
    var filename = path.join(startPath,files[i]);
    var stat = fs.lstatSync(filename);
    if (stat.isFile()){
      if(filter.test(filename)) {
        sendFile(filename);
      };
  };
};

const sendFile = function(file){
  console.log('Found: ' + file);
}