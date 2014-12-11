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
    log = require('./utils/logger'),
    jobs = kue.createQueue(require('./config/kue')),
    setChallengeToReview = require('./utils/setChallengeToReview');


log.info('Init review challange consumer...');

// Define the job consumer processing the queue.
jobs.process(
    process.env.REVIEW_QUEUE_NAME || 'ready_for_review',
    function (job, done) {

        log.info('Processing job with id: %d for challange', job.id, job.data);

        setChallengeToReview(job, function (err, rsp) {
            if (err) {
                // Let retries be controlled via queue's job attemps.
                // Just mark this attempt as failed.
                job.log('Error: ' + JSON.stringify(err) );
                done(err);
            } else {
               job.log('Success: ' + JSON.stringify(rsp) );
                done(null, rsp);
            }
        });
    }
);

// promote delayed jobs
jobs.promote( 5000 );

// Handle job enqueued event.
jobs.on('job enqueue', function (id) {
    // Job enqueued notification.
    log.info('job enqueued with id: %d ', id);
}).on('job failed attempt', function (id, error) {
    // Retry of failed jobs is controlled by attempts value
    // so here just notify.
    log.error('job id: %d attempt failed', id, error);
}).on('job failed', function (id, error) {
    // Job failed notification.
    log.error('job id: %d failed', id, error);
}).on('job complete', function (id, result) {
    // Job completed notification.
    log.info('job id: %d completed', id, result);
});
