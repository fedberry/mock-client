#!/usr/bin/node --harmony
/**
 * test Upload script.
 */

const taskId = 2;

const fs = require('fs');
require('dotenv-save').config({path: '/etc/mock-client/mock-client.config'});
const request = require('request');


const ROOTDIR = '/home/mockclient/';

const postFromDir = function (startPath,filter){
  if (!fs.existsSync(startPath)){
      console.log("no dir ",startPath);
      return;
  }

  var files = fs.readdirSync(startPath);
  for(var i=0; i<files.length; i++){
    var filename = startPath + '/' + files[i];
    var stat = fs.lstatSync(filename);
    if (stat.isFile()){
      if(filter.test(filename)) {
        sendFile(filename);
      };
    };
  };
};

const sendFile = function(file){
  console.log('Found: ' + file);
  var url = process.env.MOCK_SERVER + '/api/task/' + taskId;
  console.log(" POST to: " + url);
  var formData = {
    custom_file: {
      value: fs.createReadStream(file),
      options: {
        filename: require('path').basename(file),
        contentType: 'application/x-redhat-package-manager'
      }
    }
  };
  request.post({url:url, formData: formData}, function optionalCallback(err, httpResponse, body) {
    if (err) {
      return console.error('upload failed:', err);
    }
    console.log('Upload successful!  Server responded with:', body);
  });
}

postFromDir(ROOTDIR + '/tasks/' + taskId + '/result', /\.rpm$/);
