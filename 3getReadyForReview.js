/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author TCCODER
 */


/*!
 * Module dependencies
 */
var kue = require('kue'),
    _ = require('lodash'),
    jobs = kue.createQueue(require('./config/kue')),
    log = require('./utils/logger'),
    getChallengesReadyForReview = require('./utils/getChallengesReadyForReview'),
    challenges_to_process,
    challenges_enqueued;


log.info('Init review challange producer...');

// Make use of the service module(see its file for details)
// to get on the challenge data and then pass it ot `ProcessChallenges` to process it.
getChallengesReadyForReview(ProcessChallenges);


/**
 * Processes challenges data got from the serenity API.
 *
 * @param {Object} err Some error representation
 * @param {Object} rsp The serenity API response payload.
 * @api private
 */
function ProcessChallenges(err, rsp) {

    // Handle HTTP errors|process data
    if (err) {
        setTimeout(function () {
            log.info('Retrying last errored request...');
            getChallengesReadyForReview(ProcessChallenges);
        }, process.env.RETRY_ERRORED_REQUESTS_AFTER || 3000);
    } else {
        // When here, so far so good.
        // Let's do some work with the data.
        log.info('Processing %d challenges', rsp.content.length);

        // Store the array length that will be processed.
        challenges_to_process = rsp.content.length;

        // Reset enqueued counter.
        challenges_enqueued = 0;

        // Iterate over the data
        // to create jobs for each challenge to be set to review.
        // In dev mode we will work only with filtered set of challenges.
        if (process.env.NODE_ENV == 'production') {
            _(rsp.content).forEach(enqueueChallenge);
        } else {
            _.chain(rsp.content)
                .filter({
                    overview: process.env.REVIEW_DEV_FILTER || 'Kue refactor --kiri4a test'
                })
                .tap(function (content) {
                    challenges_to_process = content.length;
                    log.info('Dev mode -> Challenges filtered to %d', challenges_to_process);
                })
                .forEach(enqueueChallenge);
        }

        // Handle exit|poll when there is no data to process.
        // The loops above won't trigger thus this is needed.
        if (challenges_to_process == 0)
            shutdownOrPoll();
    }
}


/**
 * Creates jobs in the queue applying business logic for this service.
 *
 * @param {Object} chall The challenge resource model.
 * @api private
 */
function enqueueChallenge(chall) {

    log.info('Enqueuing challenge', chall);

    // Create the job.
    var job = jobs.create(
            process.env.REVIEW_QUEUE_NAME || 'ready_for_review', {
                id: chall.id,
                title: chall.title,
                status: chall.status,
                projectSource: chall.projectSource
            }
        )
        .priority(process.env.REVIEW_JOBS_PRIORITY || 'normal')
        .attempts(process.env.REVIEW_JOBS_ATTEMPTS || 3)
        .save(function (save_err) {
            if (save_err)
                log.error('Saving %s(id: %d) failed', chall.title, chall.id, save_err);
            else {
                log.info('Saved %s(id: %d) to redis. Job id:', chall.title, chall.id, job.id);
                // Update the enqueued counter.
                challenges_enqueued++;
                if (challenges_enqueued == challenges_to_process)
                    shutdownOrPoll();
            }
        });
};


/**
 * Handles graceful process exit or polls for new data in intervals.
 */
function shutdownOrPoll() {
    // Graceful shutdown in Heroku, poll|exit in local.
    // Allow this producer to use the Heroku's scheduler
    // to be started regularly. Makes use of the fact that in Heroku
    // the DYNO env var will be defined.
    if (process.env.DYNO) {
        log.info('All %d processed. Shuting down...', challenges_to_process);
        jobs.shutdown(function () {
            process.exit();
        }, 1000);
    } else if (process.env.AUTO_POLLING == true) {
        // Consider this local environment with AUTO_POLLING enabled.
        // Use timeout to poll in intervals.
        log.info('All %d processed. Next polling in %d ms', challenges_to_process, process.env.REVIEW_POLL_INTERVAL || 60 * 1000);
        setTimeout(function () {
            getChallengesReadyForReview(ProcessChallenges);
        }, process.env.REVIEW_POLL_INTERVAL || 60 * 1000);
    } else {
        // Consider this local environment with AUTO_POLLING disabled.
        log.info('All %d processed. Shuting down...', challenges_to_process);
        jobs.shutdown(function () {
            process.exit();
        }, 1000);
    }
};
