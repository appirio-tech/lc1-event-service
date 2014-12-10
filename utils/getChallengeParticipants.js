/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author TCCODER
 */


/*!
 * Module dependencies
 */
var request = require('request'),
  log = require('./logger.js'),
  dotenv = require('dotenv').load(),
  module_name = require('path').basename(__filename, '.js');


/**
 * Represent service to get current participants in challenge.
 *
 * @param {Object} job The job to process
 * @param {Function} callback The function to call when ready.
 * @param {String} apiURL Force this Serenity Challenge API URL to be used.
 * @api public
 */
module.exports = function (job, callback, apiURL) {
  // Allows the URL to be supplied via argument or environment variable.
  // Argument is prefered before env var. If none provided defaults to the URL defined below.
  apiURL =
    apiURL ||
    process.env.SERENITY_CHALLENGE_API ||
    'http://dev-lc1-challenge-service.herokuapp.com/challenges';
  // Append the challenge
  apiURL += '/' + job.data.challengeId + '?fields=id,title,participants';

  log.info('%s: Requesting GET %s', module_name, apiURL);

  // Make the request.
  request({
    url: apiURL,
    json: true
  }, function (err, rsp, body) {
    // Process error|response.
    if (err || rsp.statusCode != 200) {
      log.error('%s: HTTP error:', module_name, err, rsp.statusCode, body);
      callback(err || new Error('HTTP responce code ' + rsp.statusCode + ' received'));
    } else {
      log.info('%s: Got HTTP Response code %d', module_name, 200);
      //log.info('the body is ' + JSON.stringify(body));
      callback(null, body);
    }
  });
};
