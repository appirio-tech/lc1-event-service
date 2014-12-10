/*
* Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
*
* @version 1.0
* @author Kyle Bowerman
*/


/*!
* Module dependencies
*/
var kue = require('kue'),
_ = require('lodash'),
request = require('request'),
jobs = kue.createQueue(require('./config/kue')),
log = require('./utils/logger'),
challenges_to_process,
challenges_enqueued,
current_datetime = new Date().toISOString();


log.info('Init get reset  producer, a utility call for testing to move some challenges back to submission');

getChallengesToSwap(ProcessChallenges);


/** api call to get the challenges we want to switch BACK to submission for testing purposes **/
function getChallengesToSwap(callback, apiURL) {
  // Allows the URL to be supplied via argument or environment variable.
  // Argument is prefered before env var. If none provided defaults to the URL defined below.
  apiURL =
  apiURL ||
  process.env.SERENITY_CHALLENGE_API ||
  'http://Xdev-lc1-challenge-service.herokuapp.com/challenges';
  // Append the filter condition.
  apiURL += '?filter=status=REVIEW' + '%26subEndAt<' + current_datetime;
  // added limit 1 to pass out the workers due to the fixed number of redis clinets of 10
  apiURL += '&limit=3';

  log.info('Requesting GET %s', apiURL);

  // Make the request.
  request({
    url: apiURL,
    json: true
  }, function(err, rsp, body) {
    // Process error|response.
    if (err || rsp.statusCode != 200) {
      log.error('HTTP error:', err, rsp.statusCode, body);
      callback(err || new Error('HTTP responce code ' + rsp.statusCode + ' received'));
    } else {
      log.info('Got HTTP Response code %d', 200);
      callback(null, body);
    }
  });
}

/** Processes challenges data got from the serenity API.
*
* @param {Object} err Some error representation
* @param {Object} rsp The serenity API response payload.
* @api private
*/
function ProcessChallenges(err, rsp) {

  // Handle HTTP errors|process data
  if (err) {
    setTimeout(function() {
      log.info('Retrying last errored request...');
      getChallengesToSwap(ProcessChallenges);
    }, 3000);
  } else {
    // When here, so far so good.
    // Let's do some work with the data.
    log.info('Processing %d challenges', rsp.content.length);

    // Store the array length that will be processed.
    challenges_to_process = rsp.content.length;

    // Reset enqueued counter.
    challenges_enqueued = 0;
    // en
    _(rsp.content).forEach(enqueueChallenge);


    // Handle exit|poll when there is no data to process.
    // The loops above won't trigger thus this is needed.
    if (challenges_to_process === 0)
      shutdown();
    }
  }


  /**  Creates jobs in the queue applying business logic for this service.
  *
  * @param {Object} chall The challenge resource model.
  * @api private
  */
  function enqueueChallenge(chall) {

    log.info('Enqueuing challenge', chall);

    // Create the job.
    var job = jobs.create('reset_test_challenges', {
      id: chall.id,
      title: chall.title,
      status: chall.status,
      projectSource: chall.projectSource
    })
    .priority('normal')
    .attempts(3)
    .save(function(save_err) {
      if (save_err)
        log.error('Saving %s(id: %d) failed', chall.title, chall.id, save_err);
        else {
          log.info('Saved %s(id: %d) to redis. Job id:', chall.title, chall.id, job.id);
          // Update the enqueued counter.
          challenges_enqueued++;
          if (challenges_enqueued == challenges_to_process)
            shutdown();
          }
        });
      }


      /** Handles graceful process exit or polls for new data in intervals. */
      function shutdown() {
        // Graceful shutdown|poll.

        // Consider this environment with AUTO_POLLING disabled.
        log.info('All %d processed. Shuting down...', challenges_to_process);
        jobs.shutdown(function() {
          process.exit();
        }, 1000);

      }
      
