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
    log = require('./logger.js');


/**
 * Represent service to update status of a challenge via the serenity API.
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
    // Append the challenge id.
    apiURL += '/' + job.data.id;

    // Upgrade the challenge status to "REVIEW".
    job.data.status = "REVIEW";


    log.info('Requesting PUT %s', apiURL);

    // Make the request.
    request({
        method: 'PUT',
        url: apiURL,
        json: true,
        body: job.data
    }, function (err, rsp, body) {
        // Process error|response.
        if (err || rsp.statusCode != 200) {
            log.error('HTTP error:', err, rsp.statusCode, body);
            callback(err || new Error('HTTP responce code ' + rsp.statusCode + ' received'));
        } else {
            log.info('Got HTTP Response code %d', 200);
            callback(null, body);
        }
    });
};
