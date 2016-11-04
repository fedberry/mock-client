/**
 * Send status.
 */
'use strict';

const request = require('request');
const signature = require('./signature.js');

const bind = function(fn, me) { return function() { return fn.apply(me, arguments); }; };

/**
 * Constructor of RestClientClient object.
 *   .
 *   settings.URL = process.env.MONGO_URL;
 *   settings.secureKey = process.env.SECURE_KEY;
 */
function RestClient(settings) {

  // Use a closure to preserve `this`
  var self = this;

  self.settings = settings;

  self.get = bind(self.get, self);
  self.post = bind(self.post, self);
  self.put = bind(self.put, self);
  self.delete = bind(self.delete, self);
  self.search = bind(self.search, self);
  self._request = bind(self._request, self);
}

/**
 * Settings for microservice.
 */
RestClient.prototype.settings = {};

/**
 * Request data from remote server.
 *  statusRequest
 *    - method
 *    - token
 *    - Request
 *    - RecordID
 */
RestClient.prototype._request = function(statusRequest, callback) {
  var self = this;

  let signatureMethods = ['PUT', 'SEARCH', 'PATCH', 'POST'];
  let recordMethods = ['PUT', 'PATCH', 'GET', 'DELETE' ];

  var url = self.settings.URL;

  var requestData = statusRequest.Request;

  var headers = {
    Accept: 'application/json',
    'User-Agent': 'RestClient.' + process.env.npm_package_version
  };

  if (signatureMethods.indexOf(statusRequest.method) > -1) {
    if (self.settings.secureKey) {
      headers.signature = 'sha256=' +
        signature('sha256', JSON.stringify(requestData), self.settings.secureKey);
    }
  }

  if (statusRequest.token) {
    headers.token = statusRequest.token;
  }

  if (recordMethods.indexOf(statusRequest.method) > -1) {
    if (statusRequest.RecordID) {
      var url = self.settings.URL + '/' + statusRequest.RecordID;
    }
  }

  request({
    uri: url,
    method: statusRequest.method,
    headers: headers,
    json: true,
    body: requestData
  }, function(error, response, body) {
    if (error) {
      var err = new TypeError('Communication error');
      return callback(err, null);
    }
    if (response.statusCode == 200) {
      return callback(null, body);
    }

    var err = new TypeError('Response code: ' + response.statusCode);
    return callback(err, null);
  });
}

/**
 * Get wrapper.
 */
RestClient.prototype.get = function(RecordID, token, callback) {
  var self = this;
  var statusRequest = {
    method: 'GET',
    token: token,
    RecordID: RecordID,
    Request: null
  }
  return self._request(statusRequest, callback);
}

/**
 * Get wrapper.
 */
RestClient.prototype.delete = function(RecordID, token, callback) {
  var self = this;
  var statusRequest = {
    method: 'DELETE',
    token: token,
    RecordID: RecordID,
    Request: null
  }
  return self._request(statusRequest, callback);
}

/**
 * Search wrapper.
 */
RestClient.prototype.search = function(data, callback) {
  var self = this;
  var statusRequest = {
    method: 'SEARCH',
    Request: data
  }
  return self._request(statusRequest, callback);
}

/**
 * POST wrapper.
 */
RestClient.prototype.post = function(data, callback) {
  var self = this;
  var statusRequest = {
    method: 'POST',
    Request: data
  }
  return self._request(statusRequest, callback);
}

/**
 * Get wrapper.
 */
RestClient.prototype.put = function(RecordID, token, data, callback) {
  var self = this;
  var statusRequest = {
    method: 'PUT',
    token: token,
    RecordID: RecordID,
    Request: data
  }
  return self._request(statusRequest, callback);
}


module.exports = RestClient;
