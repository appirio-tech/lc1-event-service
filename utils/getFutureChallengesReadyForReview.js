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
    moment = require('moment'),
    current_datetime = new Date().toISOString();
    lookeAheadMinutes = process.env.LOOK_AHEAD_MINUTES || 60;

var futureTime = moment.utc(current_datetime).add(lookeAheadMinutes,'minutes').format("YYYY-MM-DDTHH:mm:ss");


    log.info('lookahead time is '+lookeAheadMinutes);
    log.info(' the current time is:' + current_datetime);
    log.info('futureTime           '+ futureTime);



/**
 * Represent service to get challenges data filtered by state via the serenity API.
 *
 * @param {Function} callback The function to call when ready.
 * @param {String} apiURL Force this Serenity Challenge API URL to be used.
 * @api public
 */
module.exports = function (callback, apiURL) {
    // Allows the URL to be supplied via argument or environment variable.
    // Argument is prefered before env var. If none provided defaults to the URL defined below.
    apiURL =
        apiURL ||
        process.env.SERENITY_CHALLENGE_API ||
        'http://Xdev-lc1-challenge-service.herokuapp.com/challenges';
    // Append the filter condition.
    apiURL += '?filter=status=SUBMISSION' + '%26subEndAt<' + futureTime;
    // added limit 1 to pass out the workers due to the fixed number of redis clinets of 10
    //apiURL += '&limit=1';

    log.info('Requesting GET %s', apiURL);

    // Make the request.
    request({
        url: apiURL,
        json: true
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
